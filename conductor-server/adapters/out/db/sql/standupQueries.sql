-- Get all standup entries for a user
-- Params: $1 = user_id
SELECT * FROM standup_entries
WHERE user_id = $1
ORDER BY time DESC;

-- Insert a new standup entry
-- Params: $1=user_id, $2=name, $3=content, $4=sentiment, $5=leader_feedback, $6=course_feedback
INSERT INTO standup_entries (user_id, name, content, sentiment, leader_feedback, course_feedback)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- Get standup entries for a course (optional: if we need aggregated sentiment)
-- Params: $1 = course_id
SELECT se.*, u.name AS user_name
FROM standup_entries se
JOIN users u ON u.user_id = se.user_id
JOIN course_users cu ON cu.user_id = u.user_id
WHERE cu.course_id = $1
ORDER BY se.time DESC;