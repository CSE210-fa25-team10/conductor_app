INSERT INTO assignments (course_id, name, description, due_date, created_by)
VALUES ($1, $2, $3, $4, $5)
RETURNING assignment_id, course_id, name, description, due_date, created_at, created_by;

