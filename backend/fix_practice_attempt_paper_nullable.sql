-- Fix free question-bank practice attempts.
-- Practice attempts are not bound to a paper, so qb_attempt.paper_id must allow NULL.
USE question_bank;

ALTER TABLE qb_attempt
  MODIFY COLUMN paper_id BIGINT UNSIGNED NULL;
