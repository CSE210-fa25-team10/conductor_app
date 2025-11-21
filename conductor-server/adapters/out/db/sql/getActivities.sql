SELECT activity_id, course_id, name, starts_at, type
FROM activities
WHERE ($1::INT IS NULL OR course_id = $1)
ORDER BY starts_at DESC;

