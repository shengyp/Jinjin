-- Smart learning merge layer from the LLM learning system.
-- Run after the original question_bank schema and upgrade scripts.

CREATE TABLE IF NOT EXISTS qb_knowledge_point (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(100) NULL,
  parent_id BIGINT NULL,
  tag_id BIGINT NULL,
  level INT NOT NULL DEFAULT 1,
  description VARCHAR(1000) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  is_deleted TINYINT NOT NULL DEFAULT 0,
  KEY idx_kp_parent (parent_id),
  KEY idx_kp_tag (tag_id),
  UNIQUE KEY uk_kp_code (code)
);

CREATE TABLE IF NOT EXISTS qb_learning_resource (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  resource_type VARCHAR(40) NOT NULL DEFAULT 'article',
  url VARCHAR(1000) NULL,
  summary VARCHAR(2000) NULL,
  knowledge_point_id BIGINT NULL,
  tag_id BIGINT NULL,
  created_by BIGINT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  is_deleted TINYINT NOT NULL DEFAULT 0,
  KEY idx_resource_kp (knowledge_point_id),
  KEY idx_resource_tag (tag_id)
);

CREATE TABLE IF NOT EXISTS qb_learning_behavior (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  behavior_type VARCHAR(40) NOT NULL,
  ref_id BIGINT NULL,
  knowledge_point_id BIGINT NULL,
  tag_id BIGINT NULL,
  duration_seconds INT NULL,
  note VARCHAR(1000) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_behavior_user_time (user_id, created_at),
  KEY idx_behavior_kp (knowledge_point_id),
  KEY idx_behavior_tag (tag_id)
);
