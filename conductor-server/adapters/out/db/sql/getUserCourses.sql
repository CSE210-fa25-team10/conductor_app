SELECT 
  c.course_id,
  c.name,
  c.code,
  c.semester,
  c.description,
  cu.role
FROM course_users cu
JOIN courses c ON c.course_id = cu.course_id
WHERE cu.user_id = $1
ORDER BY c.course_id DESC;

