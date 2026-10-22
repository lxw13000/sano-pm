-- 代理收入主列表：MySQL 8.0 参数化查询模板
-- 不在数据库创建表、视图或过程。本文件只有 SELECT。
-- :xxx 是应用层命名绑定参数，执行前由数据库驱动转换为绑定占位符。
-- 参数分两类，不能混用：
-- [服务端权限参数]
-- permission_operator_ids_json：服务端根据当前登录账号计算的可见BD/运营ID集合。
--   例如运营A可见自身及两个BD，传[1001,2001,2002]；JSON_TABLE只是展开这个已算好的集合。
--   该集合不是前端选择结果；普通用户没有权限时传[]，不能省略权限条件。
-- can_view_all：仅后端认证的超级管理员/指定账号可为1；普通用户固定为0。
-- [前端业务筛选参数]
-- filter_operator_id：页面选中的一个BD/运营ID；未选或选“全部”时由服务端规范化为NULL。
--   只在权限范围内进一步筛选，不能覆盖或替换permission_operator_ids_json。
--   超级管理员虽然可见全部数据，选择运营后同样需要按filter_operator_id筛选。
-- 其余proxy_id、proxy_leader_id、日期、人数、收入等也属于前端业务筛选。
-- 示例（can_view_all=0，权限集合[1001,2001,2002]）：
--   filter_operator_id=NULL：查上述三个负责人的代理；2001：仅查2001；9999：无结果。
--   服务端可以提前拒绝越权的筛选ID，本SQL仍保留权限限制，不会因此扩大范围。
-- 已确认：anchor_income与parent_proxy_income均为10,000,000原始单位=1 USD，先求和后换算。
-- 主播收益和子代理佣金来源为sano_proxy_anchor_data，字段注释中的*1000不额外换算。
-- 当前代理收入汇总旗下主播anchor_income；子代理行的parent_proxy_income归其直接上级。
-- proxy_income是代理分层佣金，本主列表收入不使用该字段。
-- 日期示例：stat_start_day=20260622，stat_end_day=20260628，两个整数日期均包含。
-- 开播及有效开播读取sano_anchor_data：有日记录即算开播，单日视频时长之和>25分钟才算有效。
-- 页面三项收入汇总由前端或服务端累计返回数据；SQL只输出每个代理的业务字段，不统计记录总条数。
-- 当前先不分页：返回全部符合权限及筛选条件的代理，按proxy_id倒序。
-- 先观察实际结果条数、查询耗时及执行计划，再确定分页位置和优化策略。
-- 查询前校验日期及所有范围下限<=上限；本版不接收page_size/page_offset参数。
-- 未额外添加审核/删除过滤；如业务仅显示正式代理，应在visible_proxy统一补充已确认条件。
WITH
-- 1. 展开服务端已经计算好的权限ID集合，只做去重，不在SQL推导运营/BD上下级。
permission_operators AS (
    SELECT DISTINCT j.operator_id
    FROM JSON_TABLE(
        :permission_operator_ids_json,
        '$[*]' COLUMNS (operator_id BIGINT PATH '$' ERROR ON ERROR)
    ) AS j
    WHERE j.operator_id IS NOT NULL
),
-- 2. 只按权限取得完整可见代理集合，不受前端运营/代理筛选裁剪。
--    后面要从这里查父代理资料，避免“筛选子代理负责人”时把父记录误过滤掉。
visible_proxy AS (
    SELECT p.id, p.proxy_name, p.user_id, p.create_time,
           p.service_user_id, p.parent_id
    FROM sano_proxy AS p
    WHERE :can_view_all = 1
       OR EXISTS (SELECT 1 FROM permission_operators AS a WHERE a.operator_id = p.service_user_id)
),
-- 3. 在完整权限范围内叠加页面筛选。权限条件与页面条件是AND关系。
base_proxy AS (
    SELECT p.id AS proxy_id, p.proxy_name, p.user_id AS proxy_leader_id,
           p.create_time AS proxy_create_time,
           p.service_user_id AS operator_id,
           NULLIF(p.parent_id, 0) AS parent_proxy_id,
           parent.user_id AS parent_proxy_leader_id
    FROM visible_proxy AS p
    -- 父级信息只从权限范围取；父级不受当前列表业务筛选影响。
    LEFT JOIN visible_proxy AS parent ON parent.id = p.parent_id
    WHERE (:proxy_id IS NULL OR p.id = :proxy_id)
      AND (:proxy_leader_id IS NULL OR p.user_id = :proxy_leader_id)
      AND (:parent_proxy_id IS NULL OR p.parent_id = :parent_proxy_id)
      AND (:parent_proxy_leader_id IS NULL OR parent.user_id = :parent_proxy_leader_id)
      -- 前端运营筛选：NULL表示权限内全部；选中ID后只缩小结果，权限仍由visible_proxy保证。
      AND (:filter_operator_id IS NULL OR p.service_user_id = :filter_operator_id)
      -- 创建时间区间：开始包含、结束不包含；结束日由服务端转换为下一日零点。
      AND (:proxy_create_start IS NULL OR p.create_time >= :proxy_create_start)
      AND (:proxy_create_end_exclusive IS NULL OR p.create_time < :proxy_create_end_exclusive)
),
-- 4. 只取候选代理的直属成员，以(代理ID,用户ID)去重；不含子代理主播。
direct_members AS (
    -- 实际执行SQL已确认：sano_user.id为用户ID，别名user_id用于关联主播日表。
    -- 不另加账号状态、性别或主播等级条件，不将子代理主播递归计入。
    SELECT DISTINCT u.proxy_id, u.id AS user_id
    FROM sano_user AS u
    JOIN base_proxy AS p ON p.proxy_id = u.proxy_id
    WHERE u.id IS NOT NULL
),
-- 5. 直属主播数：先按代理聚合，防止与主播日记录关联后人数重复。
member_stats AS (
    SELECT proxy_id, COUNT(*) AS direct_anchor_count
    FROM direct_members
    GROUP BY proxy_id
),
-- 6. 指定日期范围内，仅统计候选代理的直属主播，按代理一次聚合。
--    有任何日记录即算开播，全零或纯语音记录也计入；同一主播跨天只计一次。
--    至少一天video_minute+many_video_minute严格大于25才算有效，NULL按0。
--    恰好25分钟无效；不跨天累加时长判断有效。
--    保留day索引及STRAIGHT_JOIN日期优先策略，实际扫描量与耗时需执行计划验证。
live_stats AS (
    SELECT m.proxy_id,
           COUNT(DISTINCT a.user_id) AS open_anchor_count,
           COUNT(DISTINCT CASE
               WHEN COALESCE(a.video_minute, 0) + COALESCE(a.many_video_minute, 0) > 25
               THEN a.user_id
           END) AS valid_open_anchor_count
    FROM sano_anchor_data AS a FORCE INDEX (`day`)
    STRAIGHT_JOIN direct_members AS m ON m.user_id = a.user_id
    WHERE a.live_day >= :stat_start_day
      AND a.live_day <= :stat_end_day
    GROUP BY m.proxy_id
),
-- 7. 明确当前候选代理的直属子代理，不递归展开孙代理，不将子代理再套页面运营筛选。
--    这里只用于计算“归当前代理”的上级佣金，不扩大可见代理列表或返回子代理自身数据。
child_proxy_scope AS (
    SELECT c.id AS child_proxy_id, p.proxy_id AS target_proxy_id
    FROM base_proxy AS p
    JOIN sano_proxy AS c ON c.parent_id = p.proxy_id
),
-- 8. 先构建来源代理ID集合：候选代理自身与其直属子代理，UNION只保留ID。
--    不携带收入或归属标志；收入与子代理贡献仍独立汇总，不恢复is_child/CASE分配。
source_proxy_ids AS (
    SELECT proxy_id FROM base_proxy
    UNION
    SELECT child_proxy_id AS proxy_id FROM child_proxy_scope
),
--    单个EXISTS判断范围，避免OR下两个相关子查询逐行重复关联。
--    原始记录同时限定日期与来源代理，不按集合中的匹配次数展开金额。
--    用户计划已验证来源集合物化一次并通过auto_distinct_key匹配；其他范围需按实际计划验证。
proxy_income_scope AS (
    SELECT d.proxy_id, d.anchor_income, d.parent_proxy_income
    FROM sano_proxy_anchor_data AS d FORCE INDEX (`day`)
    WHERE d.live_day >= :stat_start_day
      AND d.live_day <= :stat_end_day
      AND EXISTS (
          SELECT 1 FROM source_proxy_ids AS s
          WHERE s.proxy_id = d.proxy_id
      )
),
-- 9. 按来源代理聚合，每代理一行：own_income_raw为旗下主播anchor_income合计。
--    parent_income_raw为该来源代理贡献给其上级的parent_proxy_income，不是自身收入。
income_by_proxy AS (
    SELECT proxy_id,
           SUM(COALESCE(anchor_income, 0)) AS own_income_raw,
           SUM(COALESCE(parent_proxy_income, 0)) AS parent_income_raw
    FROM proxy_income_scope
    GROUP BY proxy_id
),
-- 10. 子代理贡献单独计算：仅汇总直属子代理的parent_income_raw，归其直接上级。
--     不将子代理自身收入计入上级，不递归计入孙代理给其他人的佣金。
child_income_stats AS (
    SELECT c.target_proxy_id AS proxy_id,
           SUM(i.parent_income_raw) AS child_income_raw
    FROM child_proxy_scope AS c
    JOIN income_by_proxy AS i ON i.proxy_id = c.child_proxy_id
    GROUP BY c.target_proxy_id
),
-- 11. 自身收入按proxy_id取anchor_income汇总；子代理收入关联独立佣金汇总。
--     删除旧UNION ALL/is_child/CASE分配链路，不依赖常量标志判断收入归属。
--     每个关联侧已为每代理一行；无收入记录时填0。
income_stats AS (
    SELECT p.proxy_id,
           COALESCE(own.own_income_raw, 0) AS income_raw,
           COALESCE(child.child_income_raw, 0) AS child_income_raw
    FROM base_proxy AS p
    LEFT JOIN income_by_proxy AS own ON own.proxy_id = p.proxy_id
    LEFT JOIN child_income_stats AS child ON child.proxy_id = p.proxy_id
),
-- 12. 每种统计均已聚合成每代理一行，现在再关联，避免一对多交叉导致金额倍增。
--    LEFT JOIN保留无主播、无开播或无收入的代理；正常无业务记录时指标填0。
metrics AS (
    SELECT p.*,
           COALESCE(m.direct_anchor_count, 0) AS direct_anchor_count,
           COALESCE(l.open_anchor_count, 0) AS open_anchor_count,
           COALESCE(l.valid_open_anchor_count, 0) AS valid_open_anchor_count,
           COALESCE(i.income_raw, 0) AS income_raw,
           COALESCE(i.child_income_raw, 0) AS child_income_raw,
           COALESCE(i.income_raw, 0) + COALESCE(i.child_income_raw, 0)
               AS inclusive_income_raw
    FROM base_proxy AS p
    LEFT JOIN member_stats AS m ON m.proxy_id = p.proxy_id
    LEFT JOIN live_stats AS l ON l.proxy_id = p.proxy_id
    LEFT JOIN income_stats AS i ON i.proxy_id = p.proxy_id
),
-- 13. 人数/有效人数/收入上下限必须在聚合完成后筛选；传NULL表示未填，0是有效值。
--    保留全部满足条件的代理；本版不在任何阶段截取代理集合。
filtered AS (
    SELECT *
    FROM metrics
    WHERE (:direct_anchor_min IS NULL OR direct_anchor_count >= :direct_anchor_min)
      AND (:direct_anchor_max IS NULL OR direct_anchor_count <= :direct_anchor_max)
      AND (:valid_open_min IS NULL OR valid_open_anchor_count >= :valid_open_min)
      AND (:valid_open_max IS NULL OR valid_open_anchor_count <= :valid_open_max)
      -- 金额范围针对旗下主播anchor_income收益合计；按原始金额比较，不能先ROUND后筛选。
      AND (:income_min_usd IS NULL OR income_raw >= :income_min_usd * 10000000.00000000)
      AND (:income_max_usd IS NULL OR income_raw <= :income_max_usd * 10000000.00000000)
)
-- 14. 直接输出全部筛选结果，按收入原始金额倒序，不使用LIMIT/OFFSET。
-- 先将汇总金额转为足够精度的DECIMAL再做除法，避免整数SUM直接相除的中间精度导致二次舍入。
SELECT
    p.proxy_id,
    p.proxy_name,
    p.proxy_leader_id,
    p.proxy_create_time,
    p.operator_id, -- 对应sano_proxy.service_user_id，实际为BD或直属运营账号ID。
    operator_user.nick_name AS operator_nick_name, -- 所属BD/运营的昵称。
    p.direct_anchor_count,
    p.open_anchor_count,
    ROUND(100.0 * p.open_anchor_count / NULLIF(p.direct_anchor_count, 0), 1)
        AS open_rate_pct,
    p.valid_open_anchor_count,
    ROUND(100.0 * p.valid_open_anchor_count / NULLIF(p.direct_anchor_count, 0), 1)
        AS valid_open_rate_pct,
    ROUND(CAST(p.income_raw AS DECIMAL(50, 7)) / 10000000.00000000, 2) AS income_usd,
    ROUND(CAST(p.child_income_raw AS DECIMAL(50, 7)) / 10000000.00000000, 2) AS child_income_usd,
    ROUND(CAST(p.inclusive_income_raw AS DECIMAL(50, 7)) / 10000000.00000000, 2) AS inclusive_income_usd,
    p.parent_proxy_id,
    p.parent_proxy_leader_id
FROM filtered AS p
-- 仅在最终结果补充昵称；LEFT JOIN保留尚未匹配到sys_user账号的代理。
LEFT JOIN sys_user AS operator_user ON operator_user.user_id = p.operator_id
ORDER BY p.income_raw DESC;

-- 页面“收入汇总、子代理收入汇总、含子代理收入汇总”由代码累计返回的全部代理行。
-- 累计对应income_usd、child_income_usd、inclusive_income_usd，金额使用精确十进制。
-- 无符合结果时直接返回空结果集，应用返回records=[]。
