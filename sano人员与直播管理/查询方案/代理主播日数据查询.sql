-- 代理收入详情→主播日数据：MySQL 8.0，指定代理ID，按日期、主播ID一行展示。
-- 程序参数：proxy_id必填；stat_start_day/stat_end_day为YYYYMMDD整数，NULL默认近7天含今天。
-- 可选筛选：anchor_user_id、anchor_nick；昵称模糊匹配，空字符串与NULL表示不限。
-- 分页：page_size、page_offset必须由服务端绑定整数；默认20、0，校验范围并限制最大页大小。
-- :xxx为命名参数；MyBatis中改为对应的预编译绑定占位符，指定实际jdbcType并处理XML转义或CDATA。
-- 本文件包含两条独立SELECT：总条数、分页明细。MyBatis应分别配置count/list查询，不作为单个多语句执行。
-- 查看权限由接口按具体代理ID预先校验，不传入BD/运营集合。
-- a.proxy_id确定直属范围，不使用parent_proxy_id包含子代理；u仅补充昵称，不用u.proxy_id二次筛历史记录。
-- 表主键(user_id,live_day)已唯一，直接读取日数据，不重复SUM/GROUP BY，不补无记录日期。
-- 金额均按10,000,000原始单位=1美元；贡献佣金proxy_income，总收入income。
-- 有效时长=video_minute+many_video_minute，NULL按0；不再返回有效直播天数。
-- 游戏收入取income_game，沿用相同美元换算规则。
-- 上麦时长未提供来源，固定NULL；income_luxurious已确认为普通礼物收入。

-- 1. 总条数：使用与明细相同的代理、日期、主播及昵称筛选，不带LIMIT/OFFSET。
SELECT COUNT(*) AS total_count
FROM sano_anchor_data AS a
LEFT JOIN sano_user AS u ON u.id = a.user_id
WHERE a.proxy_id = :proxy_id
  AND a.live_day >= COALESCE(:stat_start_day, CAST(DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 6 DAY), '%Y%m%d') AS UNSIGNED))
  AND a.live_day <= COALESCE(:stat_end_day, CAST(DATE_FORMAT(CURDATE(), '%Y%m%d') AS UNSIGNED))
  AND (:anchor_user_id IS NULL OR a.user_id = :anchor_user_id)
  AND (:anchor_nick IS NULL OR :anchor_nick = ''
       OR u.nick LIKE CONCAT('%', :anchor_nick, '%'));

-- 2. 明细固定12列。日期倒序，同日贡献佣金原始金额倒序，再按主播ID升序。
SELECT
    STR_TO_DATE(CAST(a.live_day AS CHAR), '%Y%m%d') AS stat_date,
    a.user_id AS anchor_user_id,
    u.nick AS anchor_nick,
    ROUND(CAST(COALESCE(a.proxy_income, 0) AS DECIMAL(50, 7)) / 10000000.00000000, 2) AS contribution_commission_usd,
    COALESCE(a.video_minute, 0) + COALESCE(a.many_video_minute, 0) AS valid_live_minute,
    COALESCE(a.video_minute, 0) AS video_minute,
    COALESCE(a.many_video_minute, 0) AS many_video_minute,
    CAST(NULL AS SIGNED) AS on_mic_minute,
    ROUND(CAST(COALESCE(a.income, 0) AS DECIMAL(50, 7)) / 10000000.00000000, 2) AS income_usd,
    ROUND(CAST(COALESCE(a.income_luxurious, 0) AS DECIMAL(50, 7)) / 10000000.00000000, 2) AS ordinary_gift_income_usd,
    ROUND(CAST(COALESCE(a.income_lucky, 0) AS DECIMAL(50, 7)) / 10000000.00000000, 2) AS lucky_gift_income_usd,
    ROUND(CAST(COALESCE(a.income_game, 0) AS DECIMAL(50, 7)) / 10000000.00000000, 2) AS game_income_usd
FROM sano_anchor_data AS a
LEFT JOIN sano_user AS u ON u.id = a.user_id
WHERE a.proxy_id = :proxy_id
  AND a.live_day >= COALESCE(:stat_start_day, CAST(DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 6 DAY), '%Y%m%d') AS UNSIGNED))
  AND a.live_day <= COALESCE(:stat_end_day, CAST(DATE_FORMAT(CURDATE(), '%Y%m%d') AS UNSIGNED))
  AND (:anchor_user_id IS NULL OR a.user_id = :anchor_user_id)
  AND (:anchor_nick IS NULL OR :anchor_nick = ''
       OR u.nick LIKE CONCAT('%', :anchor_nick, '%'))
ORDER BY a.live_day DESC, COALESCE(a.proxy_income, 0) DESC, a.user_id ASC
LIMIT :page_size OFFSET :page_offset;
