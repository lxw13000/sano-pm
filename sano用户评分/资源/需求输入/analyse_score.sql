/*
 Navicat Premium Dump SQL

 Source Server         : sano-test
 Source Server Type    : MySQL
 Source Server Version : 80045 (8.0.45)
 Source Host           : 47.128.144.26:3306
 Source Schema         : sano

 Target Server Type    : MySQL
 Target Server Version : 80045 (8.0.45)
 File Encoding         : 65001

 Date: 27/08/2026 16:38:21
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for analyse_score
-- ----------------------------
DROP TABLE IF EXISTS `analyse_score`;
CREATE TABLE `analyse_score`  (
  `user_id` int NOT NULL COMMENT '用户ID',
  `score_type_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '1' COMMENT '分数类型',
  `score` decimal(10, 2) NULL DEFAULT NULL COMMENT '分数',
  `update_time` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '分数修改时间',
  PRIMARY KEY (`user_id`) USING BTREE,
  UNIQUE INDEX `uni`(`user_id` ASC, `score_type_id` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户评分' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for analyse_score_param
-- ----------------------------
DROP TABLE IF EXISTS `analyse_score_param`;
CREATE TABLE `analyse_score_param`  (
  `id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '参数标识（用于选择分析器）',
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '参数名称',
  `json_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '具体参数JSON业务系统自己解析',
  `default_score` decimal(10, 2) NULL DEFAULT NULL COMMENT '默认分数',
  `order_index` int NULL DEFAULT 0 COMMENT '计算优先级（大先计算）',
  `status` tinyint NULL DEFAULT 1 COMMENT '是否启用',
  `last_exec_time` datetime NULL DEFAULT NULL COMMENT '最后执行时间',
  `exec_interval_hour` int NULL DEFAULT NULL COMMENT '执行最小间隔时间（小时）',
  `init_param` tinyint NULL DEFAULT 0 COMMENT '是否是注册计算（仅注册计算一次）',
  `new_user_exec` tinyint NULL DEFAULT 1 COMMENT '新人是否需要执行',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户分参数' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for analyse_score_param_detail
-- ----------------------------
DROP TABLE IF EXISTS `analyse_score_param_detail`;
CREATE TABLE `analyse_score_param_detail`  (
  `user_id` int NOT NULL COMMENT '用户ID',
  `param_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '参数ID',
  `json_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '具体参数JSON业务系统自己解析',
  `exec_time` datetime NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '计算时间',
  `result_value` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '结果数据',
  `score` decimal(10, 2) NULL DEFAULT NULL COMMENT '获得分数',
  PRIMARY KEY (`user_id`, `param_id`) USING BTREE,
  INDEX `upc`(`user_id` ASC, `param_id` ASC, `score` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户参数分明细' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for analyse_score_type
-- ----------------------------
DROP TABLE IF EXISTS `analyse_score_type`;
CREATE TABLE `analyse_score_type`  (
  `id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '分数类型',
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '类型名称',
  `default_score` decimal(10, 2) NULL DEFAULT NULL COMMENT '默认分数',
  `last_login_day` int NULL DEFAULT NULL COMMENT '扫描最近多少天登录的用户',
  `last_exec_time` datetime NULL DEFAULT NULL COMMENT '最近执行时间',
  `exec_ms` bigint NULL DEFAULT NULL COMMENT '执行耗时毫秒',
  `status` tinyint NULL DEFAULT 1 COMMENT '是否启用',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户分数类型' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for analyse_score_type_param
-- ----------------------------
DROP TABLE IF EXISTS `analyse_score_type_param`;
CREATE TABLE `analyse_score_type_param`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `score_type_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '分数类型ID',
  `param_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '参数ID',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户分类型参数关系' ROW_FORMAT = Dynamic;

SET FOREIGN_KEY_CHECKS = 1;
