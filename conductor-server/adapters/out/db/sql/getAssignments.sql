SELECT 
  assignment_id,
  course_id,
  name,
  description,
  due_date,
  created_at,
  created_by
FROM assignments
WHERE ($1::INT IS NULL OR course_id = $1)
ORDER BY due_date ASC, created_at DESC;

