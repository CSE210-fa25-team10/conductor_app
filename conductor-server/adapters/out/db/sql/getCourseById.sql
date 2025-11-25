SELECT 
  course_id,
  name,
  code,
  semester,
  description
FROM courses
WHERE course_id = $1;

