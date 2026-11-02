-- 公会评估与风险审核：四表目标设计。
-- 目标：MySQL 8.0 / InnoDB。不是已有表升级脚本，未在真实数据库执行。
-- 不含 DROP、清空或迁移语句。已有同名表时应停止并另做迁移评审。
-- 会话时区统一UTC+8；所有业务金额为美元。
-- 参见同目录《公会评估与风险审核-简化表设计.md》的JSON契约及事务约束。

CREATE TABLE agency_stat_evaluation (
    id VARCHAR(36) NOT NULL COMMENT '评估任务/结果ID，由应用生成',
    agency_id INT NOT NULL COMMENT '公会ID',
    stat_scope TINYINT NOT NULL COMMENT '1直属、2全树',
    operator_sys_user_id BIGINT DEFAULT NULL COMMENT '截止日运营责任人；不是当前权限凭证',
    bd_sys_user_id BIGINT DEFAULT NULL COMMENT '截止日BD责任人；不是当前权限凭证',
    evaluation_type VARCHAR(12) NOT NULL COMMENT 'DAILY、FORMAL、MANUAL',
    cutoff_date DATE NOT NULL COMMENT '业务截止日，UTC+8；正式评估固定周日',
    series_id VARCHAR(36) NOT NULL COMMENT '版本序列ID；首版为自身ID，同截止日重评继承',
    version_no INT NOT NULL DEFAULT 1 COMMENT '序列内递增版本，必须大于0',
    compare_evaluation_id VARCHAR(36) DEFAULT NULL COMMENT '明确对比对象；手动同截止日，日常可为前次成功结果',
    auto_task_key VARCHAR(96) DEFAULT NULL COMMENT '自动任务唯一键：类型:公会:范围:截止日；手动为空',
    request_id VARCHAR(64) DEFAULT NULL COMMENT '手动请求唯一键；自动为空',
    requested_by BIGINT DEFAULT NULL COMMENT '手动发起人，自动为空',
    request_reason_type VARCHAR(32) DEFAULT NULL COMMENT 'DATA_REPAIR、RELATION_SUPPLEMENT、RULE_CHANGE、CONFIG_CHANGE、MANUAL_VERIFICATION',
    request_reason VARCHAR(2000) DEFAULT NULL COMMENT '手动重评原因说明',
    run_status VARCHAR(16) NOT NULL DEFAULT 'WAITING' COMMENT 'WAITING、RUNNING、SUCCEEDED、FAILED',
    result_stage VARCHAR(16) DEFAULT NULL COMMENT '成功后：ACCUMULATING、OBSERVING、NORMAL',
    status_reason VARCHAR(1000) DEFAULT NULL COMMENT '等待、失败或积累/观察阶段的具体原因',
    last_attempt_at DATETIME(3) DEFAULT NULL COMMENT '最近尝试时间；不替代调度器执行锁/租约',
    rule_version VARCHAR(64) DEFAULT NULL COMMENT '不可变评分规则版本，与快照一致',
    business_score DECIMAL(7,4) DEFAULT NULL COMMENT '经营评分0至100，不可计算为空；原精度在快照',
    risk_score DECIMAL(7,4) DEFAULT NULL COMMENT '风险评分0至100，不可计算为空；原精度在快照',
    risk_level VARCHAR(16) DEFAULT NULL COMMENT 'LOW、WATCH、MEDIUM、HIGH；不可计算为空',
    portrait_type VARCHAR(64) DEFAULT NULL COMMENT '产品第18.3节正式画像分类编码；积累/观察期不套正式分类',
    machine_conclusion VARCHAR(64) DEFAULT NULL COMMENT '系统结论编码，不存人工确认套利',
    result_snapshot JSON DEFAULT NULL COMMENT '完整指标、窗口、覆盖、依据版本、评分过程与自然语言结论',
    review_id VARCHAR(36) DEFAULT NULL COMMENT '触发/合并审核事项ID，逻辑关联；只允许从空绑定一次',
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '任务创建时间',
    completed_at DATETIME(3) DEFAULT NULL COMMENT '本次成功生成时间；非成功为空，成功后固定',
    PRIMARY KEY (id),
    UNIQUE KEY uk_eval_auto_task (auto_task_key),
    UNIQUE KEY uk_eval_request (request_id),
    UNIQUE KEY uk_eval_series_version (series_id, version_no),
    KEY idx_eval_list (evaluation_type, cutoff_date, stat_scope, run_status),
    KEY idx_eval_agency_history (agency_id, stat_scope, evaluation_type, cutoff_date),
    KEY idx_eval_operator (operator_sys_user_id, evaluation_type, cutoff_date),
    KEY idx_eval_bd (bd_sys_user_id, evaluation_type, cutoff_date),
    KEY idx_eval_compare (compare_evaluation_id),
    KEY idx_eval_review (review_id),
    CONSTRAINT fk_agency_eval_compare FOREIGN KEY (compare_evaluation_id)
        REFERENCES agency_stat_evaluation (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin COMMENT='公会评估任务、不可变版本及完整结果快照';

CREATE TABLE agency_stat_evaluation_evidence (
    evaluation_id VARCHAR(36) NOT NULL COMMENT '所属评估版本ID',
    evidence_id VARCHAR(128) NOT NULL COMMENT '稳定事实ID，同事实跨评估版本沿用',
    rule_code VARCHAR(64) NOT NULL COMMENT '主要命中规则编码',
    evidence_grade VARCHAR(16) NOT NULL COMMENT 'DIRECT、STRONG、TEMPORAL、BEHAVIOR',
    trace_method VARCHAR(16) NOT NULL COMMENT 'DIRECT、FIFO、MIXED、NONE；与证据等级分开',
    requires_verification TINYINT NOT NULL DEFAULT 1 COMMENT '0无需另行核验、1仍有待核验事项；不是人工结论',
    summary VARCHAR(2000) NOT NULL COMMENT '本版本事实摘要',
    facts_snapshot JSON NOT NULL COMMENT '规则实际值/阈值/贡献分、窗口、账号、金额、来源链及不可变归档引用',
    content_hash CHAR(64) NOT NULL COMMENT '规范化业务事实SHA-256，排除生成时间和纯文案差异',
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '证据快照保存时间',
    PRIMARY KEY (evaluation_id, evidence_id),
    KEY idx_evidence_rule (evaluation_id, rule_code),
    CONSTRAINT fk_agency_evidence_eval FOREIGN KEY (evaluation_id)
        REFERENCES agency_stat_evaluation (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin COMMENT='评估版本中的事实证据及归档快照';

CREATE TABLE agency_stat_risk_review (
    id VARCHAR(36) NOT NULL COMMENT '审核/复核事项ID',
    agency_id INT NOT NULL COMMENT '事项公会；必须与来源及合并评估一致',
    stat_scope TINYINT NOT NULL COMMENT '1直属、2全树；不得跨范围合并',
    source_evaluation_id VARCHAR(36) NOT NULL COMMENT '首次触发事项的评估ID，创建后不变',
    previous_review_id VARCHAR(36) DEFAULT NULL COMMENT '前次已完成事项；复核时关联，不改旧结论',
    trigger_reason VARCHAR(1000) NOT NULL COMMENT '新建或复核的具体触发原因',
    status VARCHAR(16) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING、IN_PROGRESS、COMPLETED、RECHECK',
    reviewer_sys_user_id BIGINT DEFAULT NULL COMMENT '领取并处理的审核人',
    conclusion VARCHAR(32) DEFAULT NULL COMMENT 'EXCLUDED、HIGH_RISK、CONFIRMED_ARBITRAGE；未完成时只是草稿',
    reason VARCHAR(2000) DEFAULT NULL COMMENT '草稿或提交后的审核依据说明',
    attachments JSON DEFAULT NULL COMMENT '附件数组：文件ID、名称、永久引用、上传人/时间、摘要',
    reviewed_at DATETIME(3) DEFAULT NULL COMMENT '最终提交时间；草稿为空',
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '事项创建时间',
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '最近保存时间',
    active_key VARCHAR(64) GENERATED ALWAYS AS (
        CASE WHEN status IN ('PENDING', 'IN_PROGRESS', 'RECHECK')
            THEN CONCAT(agency_id, ':', stat_scope) ELSE NULL END
    ) STORED COMMENT '同公会同范围唯一未完成事项；完成后NULL释放唯一键',
    PRIMARY KEY (id),
    UNIQUE KEY uk_review_active (active_key),
    UNIQUE KEY uk_review_source (source_evaluation_id),
    KEY idx_review_list (status, created_at),
    KEY idx_review_reviewer (reviewer_sys_user_id, status),
    KEY idx_review_agency (agency_id, stat_scope, created_at),
    KEY idx_review_completed (status, reviewed_at),
    KEY idx_review_previous (previous_review_id),
    CONSTRAINT fk_agency_review_source FOREIGN KEY (source_evaluation_id)
        REFERENCES agency_stat_evaluation (id),
    CONSTRAINT fk_agency_review_previous FOREIGN KEY (previous_review_id)
        REFERENCES agency_stat_risk_review (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin COMMENT='风险审核事项、人工结论与核验附件';

CREATE TABLE agency_stat_review_evidence (
    review_id VARCHAR(36) NOT NULL COMMENT '审核事项ID',
    evaluation_id VARCHAR(36) NOT NULL COMMENT '证据所属评估版本ID，不得丢弃版本',
    evidence_id VARCHAR(128) NOT NULL COMMENT '候选或被引用证据ID',
    is_cited TINYINT NOT NULL DEFAULT 0 COMMENT '0候选、1人工选为结论依据；完成后禁止更改',
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '加入证据池时间',
    PRIMARY KEY (review_id, evaluation_id, evidence_id),
    KEY idx_review_evidence_version (evaluation_id, evidence_id),
    CONSTRAINT fk_agency_review_ref_review FOREIGN KEY (review_id)
        REFERENCES agency_stat_risk_review (id),
    CONSTRAINT fk_agency_review_ref_evidence FOREIGN KEY (evaluation_id, evidence_id)
        REFERENCES agency_stat_evaluation_evidence (evaluation_id, evidence_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin COMMENT='审核证据池及人工最终引用，固定证据版本';

-- 服务端必须实现，不能只依赖以上DDL：
-- 1. 类型/枚举/范围/评分边界、JSON结构、主列与快照一致性校验。
-- 2. 自动键与请求ID按任务类型互斥且必填；series首行锁定分配版本。
-- 3. 评估compare与series的公会、范围、截止日及时间先后合法性校验。
-- 4. 成功结果/证据不可覆盖；等待失败不得填充旧评分。
-- 5. 发布结果、证据及创建/合并审核在同一事务；并发唯一键冲突回滚重试。
-- 6. review_id是逻辑外键，必须存在且同公会同范围；来源评估也需回填该ID。
-- 7. 证据池仅允许本事项所属评估；人工引用、附件及结论完成后冻结。
-- 8. 领取/保存/提交采用行锁与条件更新；统一当前授权校验。
-- 9. 文件与归档至少随已引用证据保留一年，不能保存临时下载URL冒充长期凭证。
-- 10. 执行锁/租约使用现有调度系统；时间戳本身不保证执行独占。
