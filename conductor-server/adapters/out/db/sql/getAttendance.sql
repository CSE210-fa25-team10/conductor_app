SELECT 
  a.activity_id,
  a.course_id,
  a.name,
  a.starts_at,
  a.type,
  att.user_id,
  att.present
FROM attendance att
JOIN activities a ON a.activity_id = att.activity_id
WHERE ($1::INT IS NULL OR a.course_id = $1)
  AND ($2::INT IS NULL OR att.user_id = $2)
ORDER BY a.starts_at DESC;

