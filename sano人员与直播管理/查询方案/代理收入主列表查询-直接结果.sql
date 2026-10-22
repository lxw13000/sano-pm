-- 固定20个BD/运营ID，统计2026-10-14至2026-10-20；其他条件不限，不分页。
-- 收入取sano_proxy_anchor_data.anchor_income；子代理收入取直属子代理的parent_proxy_income。
-- 两项原始金额均先求和再除以10,000,000；页面汇总由代码累计，不额外乘除1000。
-- 本文件直接返回16列业务结果，不含EXPLAIN ANALYZE，不含诊断列。
-- 日期优先、各原始数据按范围预筛选的完整验证版，实际性能待测。
WITH
-- 2. 只按权限取得完整可见代理集合，不受前端运营/代理筛选裁剪。
--    后面要从这里查父代理资料，避免“筛选子代理负责人”时把父记录误过滤掉。
visible_proxy AS (
    SELECT p.id, p.proxy_name, p.user_id, p.create_time,
           p.service_user_id, p.parent_id
    FROM sano_proxy AS p
    WHERE p.service_user_id IN (106, 108, 109, 114, 117, 119, 120, 121, 122, 125, 129, 130, 134, 135, 137, 144, 148, 151, 152, 103)
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
    WHERE a.live_day >= 20261014
      AND a.live_day <= 20261020
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
    WHERE d.live_day >= 20261014
      AND d.live_day <= 20261020
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
FROM metrics AS p
-- 仅在最终结果补充昵称；LEFT JOIN保留尚未匹配到sys_user账号的代理。
LEFT JOIN sys_user AS operator_user ON operator_user.user_id = p.operator_id
ORDER BY p.income_raw DESC;
