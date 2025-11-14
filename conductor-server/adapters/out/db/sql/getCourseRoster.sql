SELECT u.user_id, u.name, u.email, cu.role
FROM course_users cu
JOIN users u ON u.user_id = cu.user_id
WHERE cu.course_id = $1
ORDER BY cu.role, u.name;

