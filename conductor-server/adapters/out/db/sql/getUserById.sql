SELECT 
  user_id,
  name,
  email,
  pronouns,
  phone,
  availability,
  pronunciation,
  slack
FROM users
WHERE user_id = $1;

