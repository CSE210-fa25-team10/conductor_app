SELECT 
  user_id,
  name,
  email,
  password,
  token_response,
  pronouns,
  phone,
  availability,
  pronunciation,
  slack
FROM users
WHERE email = $1;

