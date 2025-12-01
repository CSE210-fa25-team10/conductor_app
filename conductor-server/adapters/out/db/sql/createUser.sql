INSERT INTO users (name, email, password, pronouns, phone, availability, pronunciation, slack)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING user_id, name, email, pronouns, phone, availability, pronunciation, slack;

