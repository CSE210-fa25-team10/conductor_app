import express from "express";
import { db } from "../db.js";
import { requireUser, requireInstructor } from "../middleware/auth.js";

const router = express.Router();

// /**
//  * Step 2 — Instructor marks present/absent manually
//  */
// router.put("/", requireInstructor, async (req, res) => {
//   const { user_id, course_id, activity_id, present } = req.body;

//   const { rows } = await db.query(
//     `UPDATE activities_users_courses
//      SET present = $4
//      WHERE user_id = $1 AND course_id = $2 AND activity_id = $3
//      RETURNING *`,
//     [user_id, course_id, activity_id, present]
//   );

//   res.json(rows[0]);
// });
/////////////////////////NEW//////////////////
router.put("/", async (req, res) => {
  console.log("⚠️ DB not connected yet — accepting update but not saving:", req.body);
  return res.json({ ok: true, mock: true, updated: req.body });
});
/////////////////////////////////////////////////

// /**
//  * Step 3 — Get roster view
//  */
// router.get("/:activity_id", requireInstructor, async (req, res) => {
//   const activity_id = Number(req.params.activity_id);

//   const { rows } = await db.query(
//     `SELECT u.user_id, u.name, auc.present
//      FROM activities_users_courses auc
//      JOIN users u ON auc.user_id = u.user_id
//      WHERE auc.activity_id = $1
//      ORDER BY u.name`,
//     [activity_id]
//   );

//   res.json(rows);
// });
////////////////////NEW///////////////////////
router.get("/:activity_id", async (req, res) => {
  console.log("⚠️ DB not connected yet — returning mock data");

  return res.json([
    { user_id: 1, name: "Ada Lovelace", present: false },
    { user_id: 2, name: "Alan Turing", present: true },
    { user_id: 3, name: "Grace Hopper", present: false }
  ]);
});
//////////////////////////////////////////////////

/**
 * SIMPLE QR — Start QR attendance session (generates 6-digit code)
 */
router.post("/qr/start", requireInstructor, async (req, res) => {
  const { activity_id } = req.body;

  const qr_code = Math.floor(100000 + Math.random() * 900000).toString();

  await db.query(
    `UPDATE activities
     SET qr_code = $1,
         qr_expires_at = NOW() + INTERVAL '10 minutes'
     WHERE activity_id = $2`,
    [qr_code, activity_id]
  );

  res.json({ qr_code, expires_in: "10 minutes" });
});

/**
 * SIMPLE QR — Student checks in using code
 */
router.post("/qr/check-in", requireUser, async (req, res) => {
  const { qr_code } = req.body;
  const user_id = req.user.user_id;

  const { rows } = await db.query(
    `SELECT activity_id, course_id
     FROM activities
     WHERE qr_code = $1 AND qr_expires_at > NOW()`,
    [qr_code]
  );

  if (rows.length === 0) {
    return res.status(400).json({ error: "Invalid or expired code" });
  }

  const { activity_id, course_id } = rows[0];

  await db.query(
    `UPDATE activities_users_courses
     SET present = TRUE
     WHERE user_id = $1 AND course_id = $2 AND activity_id = $3`,
    [user_id, course_id, activity_id]
  );

  res.json({ status: "Attendance recorded" });
});

export default router;
