import express from "express";
import { db } from "../db.js";
import { requireInstructor } from "../middleware/auth.js";

const router = express.Router();

router.post("/", requireInstructor, async (req, res) => {
  const { course_id, name, time, type } = req.body;

  // 1. Create activity
  const { rows } = await db.query(
    `INSERT INTO activities (course_id, name, time, type)
     VALUES ($1, $2, $3, $4)
     RETURNING activity_id`,
    [course_id, name, time, type]
  );
  const activity_id = rows[0].activity_id;

  // 2. Initialize attendance defaults = absent
  await db.query(
    `INSERT INTO activities_users_courses (user_id, course_id, activity_id, present)
     SELECT user_id, $1, $2, FALSE
     FROM courses_users
     WHERE course_id = $1`,
    [course_id, activity_id]
  );

  res.json({ activity_id });
});

export default router;
