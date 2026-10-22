-- 代理收入详情抽屉：指定代理、指定日期段，返回一行三个金额，不是每日明细。
-- 直接执行：代理135937，动态取数据库会话今天及前6天。
-- 统计日期两端包含；接口调用前校验具体代理ID查看权限、日期格式和起止顺序。
-- 不接收BD/运营集合，不关联主播、直播日表或代理人数日表。
-- 直属主播收入取本代理anchor_income，子代理贡献取直属子代理parent_proxy_income。
-- 子代理的anchor_income和本代理自己的parent_proxy_income不混入上述收入。
-- 不递归孙级；proxy_income为分层佣金，不作为本抽屉的直属主播收入。
-- 两项原始金额均先求和再除以10,000,000换美元，保留两位；含子代理项先加原始值。
WITH
-- 1. 抽屉独立日期：打开时可显式传入主列表周期，未提供时默认近7天。
input_params AS (
    SELECT 135937 AS proxy_id,
           CAST(DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 6 DAY), '%Y%m%d') AS UNSIGNED) AS start_day,
           CAST(DATE_FORMAT(CURDATE(), '%Y%m%d') AS UNSIGNED) AS end_day
),
-- 2. 本代理旗下主播在统计期间的收入，直接按原始表proxy_id与日期定位并汇总。
anchor_income_total AS (
    SELECT COALESCE(SUM(d.anchor_income), 0) AS income_raw
    FROM sano_proxy_anchor_data AS d
    JOIN input_params AS q ON q.proxy_id = d.proxy_id
    WHERE d.live_day >= q.start_day AND d.live_day <= q.end_day
),
-- 3. 直属子代理归当前代理的贡献佣金。child.id唯一，不将原始收入多重关联。
--    不按子代理所属运营筛掉其给当前代理的佣金，也不递归累计孙级给其他人的佣金。
child_income_total AS (
    SELECT COALESCE(SUM(d.parent_proxy_income), 0) AS child_income_raw
    FROM sano_proxy_anchor_data AS d
    JOIN sano_proxy AS child ON child.id = d.proxy_id
    JOIN input_params AS q ON q.proxy_id = child.parent_id
    WHERE d.live_day >= q.start_day AND d.live_day <= q.end_day
)
-- 4. 只返回三个金额：代理存在但无收入时为0，不存在的代理返回空结果。
SELECT
    ROUND(CAST(a.income_raw AS DECIMAL(50, 7)) / 10000000.00000000, 2) AS income_usd,
    ROUND(CAST(c.child_income_raw AS DECIMAL(50, 7)) / 10000000.00000000, 2) AS child_income_usd,
    ROUND(CAST(a.income_raw + c.child_income_raw AS DECIMAL(50, 7)) / 10000000.00000000, 2) AS inclusive_income_usd
FROM sano_proxy AS p
JOIN input_params AS q ON q.proxy_id = p.id
CROSS JOIN anchor_income_total AS a
CROSS JOIN child_income_total AS c;
