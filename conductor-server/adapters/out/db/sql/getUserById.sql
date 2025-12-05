SELECT 
  user_id,
  name,
  email,
  profile_photo,
  pronouns,
  phone,
  availability,
  pronunciation,
  slack
FROM users
WHERE user_id = $1;

