SELECT 
  user_id,
  name,
  email,
  pronouns,
  phone,
  availability,
  pronunciation,
  slack,
  role
FROM users
WHERE user_id = $1;

