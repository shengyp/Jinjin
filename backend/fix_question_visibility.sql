-- Make imported questions visible to student question-bank practice.
USE question_bank;

UPDATE qb_question
SET status = 2,
    bank_review_status = 2,
    bank_reviewer_id = COALESCE(bank_reviewer_id, created_by),
    bank_reviewed_at = COALESCE(bank_reviewed_at, NOW(3)),
    bank_review_comment = COALESCE(bank_review_comment, '初始化题库审核通过')
WHERE is_deleted = 0;

SELECT COUNT(*) AS visible_question_count
FROM qb_question
WHERE is_deleted = 0
  AND status = 2
  AND bank_review_status = 2;
