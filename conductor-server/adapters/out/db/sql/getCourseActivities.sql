SELECT 
  activity_id,
  course_id,
  name,
  starts_at,
  type
FROM activities
WHERE course_id = $1
ORDER BY starts_at DESC;

