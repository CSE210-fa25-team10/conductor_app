UPDATE users
SET profile_photo = $2
WHERE user_id = $1
RETURNING user_id, name, email, pronouns, phone, availability, pronunciation, slack, profile_photo;
