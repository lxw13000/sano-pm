-- 代理日数据，MySQL 8.0；固定10列，一天一行，日期倒序。
-- 程序参数：proxy_id必填，stat_start_day/stat_end_day可为NULL，默认近7天含今天。
-- :xxx沿用主列表命名参数格式；用于MyBatis XML需转#{参数名}并处理XML转义/CDATA。
-- 日期默认按数据库会话CURDATE()；抽屉自选日期由程序绑定YYYYMMDD整数，两端包含。
-- 每日直属主播数取sano_stat_proxy.people_amount，按(day_int,proxy_id)完整主键匹配。
-- 人数记录缺失或people_amount为NULL时保留NULL；两项比率均以当日人数为分母。
-- 无业务日期补齐；代理不存在时返回空结果。不分页、不返回总条数。
-- 本SQL只接收具体代理ID；服务端在调用前完成该代理ID的查看权限校验。
-- 收入anchor_income；子代理收入为直属子代理parent_proxy_income，不递归孙级。
-- 两项均先求和再除以10,000,000换美元；proxy_income不是本列表收入。
WITH RECURSIVE
-- 1. 直接从某一个代理ID开始，默认近7天含今天；程序支持抽屉独立选择日期。
input_params AS (
    SELECT :proxy_id AS proxy_id,
           COALESCE(:stat_start_day, CAST(DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 6 DAY), '%Y%m%d') AS UNSIGNED)) AS start_day,
           COALESCE(:stat_end_day, CAST(DATE_FORMAT(CURDATE(), '%Y%m%d') AS UNSIGNED)) AS end_day
),
stat_range AS (
    SELECT i.*,
           STR_TO_DATE(CAST(i.start_day AS CHAR), '%Y%m%d') AS start_date,
           STR_TO_DATE(CAST(i.end_day AS CHAR), '%Y%m%d') AS end_date
    FROM input_params AS i
),
-- 2. 只定位这个具体代理，不重新套用BD/运营账号集合。
target_proxy AS (
    SELECT p.id AS proxy_id
    FROM sano_proxy AS p
    JOIN input_params AS i ON i.proxy_id = p.id
),
-- 3. 日历补齐完整日期；程序校验日期格式、开始<=结束及合理跨度。
date_series (stat_date) AS (
    SELECT t.start_date FROM stat_range AS t WHERE t.start_date <= t.end_date
    UNION ALL
    SELECT DATE_ADD(d.stat_date, INTERVAL 1 DAY)
    FROM date_series AS d CROSS JOIN stat_range AS t
    WHERE d.stat_date < t.end_date
),
calendar_days AS (
    SELECT stat_date, CAST(DATE_FORMAT(stat_date, '%Y%m%d') AS UNSIGNED) AS live_day
    FROM date_series
),
-- 4. 当前直属成员只用于匹配主播日记录；每日人数不再由成员列表COUNT计算。
direct_members AS (
    SELECT DISTINCT u.id AS user_id
    FROM sano_user AS u JOIN target_proxy AS p ON p.proxy_id = u.proxy_id
),
-- 5. 直属主播×已选自然日，按(user_id,live_day)完整主键精确定位日记录。
--    不先按user_id读取该主播全部历史再过滤日期；不扫描平台整个日期范围。
--    STRAIGHT_JOIN确保成员/日期先于日表，PRIMARY为已提供的(user_id,live_day)主键。
--    有日记录即算开播；单日视频+多人视频分钟严格>25才算有效，NULL按0，恰好25无效。
--    预期日表计划应包含user_id及live_day两个等值键；实际耗时仍需执行计划验证。
live_daily AS (
    SELECT a.live_day, COUNT(DISTINCT a.user_id) AS open_anchor_count,
           COUNT(DISTINCT CASE
               WHEN COALESCE(a.video_minute, 0) + COALESCE(a.many_video_minute, 0) > 25
               THEN a.user_id END) AS valid_open_anchor_count
    FROM direct_members AS m
    STRAIGHT_JOIN calendar_days AS calendar ON 1 = 1
    STRAIGHT_JOIN sano_anchor_data AS a FORCE INDEX (PRIMARY)
        ON a.user_id = m.user_id AND a.live_day = calendar.live_day
    GROUP BY a.live_day
),
-- 6. 直属子代理不再套运营筛选，只读取其归当前授权代理的上级佣金。
child_proxy_scope AS (
    SELECT c.id AS child_proxy_id
    FROM sano_proxy AS c JOIN target_proxy AS p ON p.proxy_id = c.parent_id
),
source_proxy_ids AS (
    SELECT proxy_id FROM target_proxy
    UNION
    SELECT child_proxy_id AS proxy_id FROM child_proxy_scope
),
-- 7. 先限定原始日期和来源代理，再按代理+日聚合，与直播日表独立，避免明细交叉倍增。
--    单代理及子代理的小范围由优化器选择代理/日期索引，不强制照搬主列表的访问顺序。
income_by_proxy_day AS (
    SELECT d.proxy_id, d.live_day,
           SUM(COALESCE(d.anchor_income, 0)) AS own_income_raw,
           SUM(COALESCE(d.parent_proxy_income, 0)) AS parent_income_raw
    FROM sano_proxy_anchor_data AS d CROSS JOIN stat_range AS t
    WHERE d.live_day >= t.start_day AND d.live_day <= t.end_day
      AND EXISTS (SELECT 1 FROM source_proxy_ids AS s WHERE s.proxy_id = d.proxy_id)
    GROUP BY d.proxy_id, d.live_day
),
-- 8. 每日子代理贡献只汇总其parent_proxy_income，不取其anchor_income，也不递归孙级。
child_income_daily AS (
    SELECT i.live_day, SUM(i.parent_income_raw) AS child_income_raw
    FROM income_by_proxy_day AS i
    JOIN child_proxy_scope AS c ON c.child_proxy_id = i.proxy_id
    GROUP BY i.live_day
),
-- 9. 日指标均已唯一化，再关联日历。代理不存在时target_proxy为空，不输出日期行。
daily_metrics AS (
    SELECT d.stat_date, p.proxy_id, population.people_amount AS direct_anchor_count,
           COALESCE(l.open_anchor_count, 0) AS open_anchor_count,
           COALESCE(l.valid_open_anchor_count, 0) AS valid_open_anchor_count,
           COALESCE(own.own_income_raw, 0) AS income_raw,
           COALESCE(child.child_income_raw, 0) AS child_income_raw
    FROM calendar_days AS d CROSS JOIN target_proxy AS p
    -- 已确认主键(day_int,proxy_id)唯一，点查当日人数，不聚合、不叠加多天或子代理人数。
    LEFT JOIN sano_stat_proxy AS population
        ON population.day_int = d.live_day AND population.proxy_id = p.proxy_id
    LEFT JOIN live_daily AS l ON l.live_day = d.live_day
    LEFT JOIN income_by_proxy_day AS own ON own.proxy_id = p.proxy_id AND own.live_day = d.live_day
    LEFT JOIN child_income_daily AS child ON child.live_day = d.live_day
)
-- 10. 固定10列。日人数为NULL或0时，两项比率返回NULL，界面显示“—”。
--     真实日人数0保留0；缺失人数保留NULL；无开播/收入记录时相应指标为0。
SELECT d.stat_date, d.proxy_id, d.direct_anchor_count, d.open_anchor_count,
       ROUND(100.0 * d.open_anchor_count / NULLIF(d.direct_anchor_count, 0), 1) AS open_rate_pct,
       d.valid_open_anchor_count,
       ROUND(100.0 * d.valid_open_anchor_count / NULLIF(d.direct_anchor_count, 0), 1) AS valid_open_rate_pct,
       ROUND(CAST(d.income_raw AS DECIMAL(50, 7)) / 10000000.00000000, 2) AS income_usd,
       ROUND(CAST(d.child_income_raw AS DECIMAL(50, 7)) / 10000000.00000000, 2) AS child_income_usd,
       ROUND(CAST(d.income_raw + d.child_income_raw AS DECIMAL(50, 7)) / 10000000.00000000, 2) AS inclusive_income_usd
FROM daily_metrics AS d
ORDER BY d.stat_date DESC;
