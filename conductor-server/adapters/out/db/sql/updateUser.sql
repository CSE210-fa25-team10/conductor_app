UPDATE users
SET 
  name = COALESCE($2, name),
  email = COALESCE($3, email),
  pronouns = COALESCE($4, pronouns),
  phone = COALESCE($5, phone),
  availability = COALESCE($6, availability),
  pronunciation = COALESCE($7, pronunciation),
  slack = COALESCE($8, slack)
WHERE user_id = $1
RETURNING user_id, name, email, pronouns, phone, availability, pronunciation, slack;

