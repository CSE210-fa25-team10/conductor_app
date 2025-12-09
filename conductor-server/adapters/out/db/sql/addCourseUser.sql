INSERT INTO course_users (user_id, course_id, role)
VALUES ($1, $2, COALESCE($3, 'student'))
ON CONFLICT (user_id, course_id) DO UPDATE
SET role = EXCLUDED.role
RETURNING *;
