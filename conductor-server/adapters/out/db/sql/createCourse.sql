INSERT INTO courses (name, code, semester, description)
VALUES ($1, $2, $3, $4)
RETURNING course_id, name, code, semester, description;

