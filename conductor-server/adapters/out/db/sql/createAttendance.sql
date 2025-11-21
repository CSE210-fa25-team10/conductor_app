INSERT INTO attendance (activity_id, user_id, present)
VALUES ($1, $2, $3)
ON CONFLICT (user_id, activity_id) DO UPDATE
  SET present = EXCLUDED.present
RETURNING activity_id, user_id, present;
