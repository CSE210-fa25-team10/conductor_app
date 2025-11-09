import express from "express";
import { Pool } from "pg";
import "dotenv/config";

const app = express();
app.use(express.json());

console.log("Running server.js from:", process.cwd());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://localhost:5432/conductor",
});
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(` Server listening on http://localhost:${port}`);
});

// helper: map PG bad-UUID to 400
function handlePgUuidError(res, err) {
  if (err && err.code === "22P02") { // invalid_text_representation
    return res.status(400).json({ error: "invalid UUID format" });
  }
  return res.status(500).json({ error: "internal_error" });
}

// Root
app.get("/", (_req, res) => res.type("text").send("ok"));

// Health
app.get("/health", async (_req, res) => {
  try {
    const { rows } = await pool.query("select now() as db_time");
    res.json({ ok: true, db_time: rows[0].db_time });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// USERS 

app.get("/users", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT user_id, name, email
         FROM users
         ORDER BY user_id DESC`
    );
    res.json(rows);
  } catch (e) {
    console.error("GET /users error:", e);
    res.status(500).json({ error: e.message });
  }
});

// COURSES 
app.get("/courses", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT course_id
         FROM courses
         ORDER BY course_id DESC`
    );
    res.json(rows);
  } catch (e) {
    console.error("GET /courses error:", e);
    res.status(500).json({ error: e.message });
  }
});

// ACTIVITIES 
app.get("/activities", async (req, res) => {
  const hasFilter = typeof req.query.course_id !== "undefined";
  const courseId = hasFilter ? Number.parseInt(req.query.course_id, 10) : null;
  if (hasFilter && !Number.isInteger(courseId)) {
    return res.status(400).json({ error: "course_id must be an integer" });
  }

  const sql = hasFilter
    ? `SELECT activity_id, course_id, name, starts_at, type
         FROM activities
        WHERE course_id = $1
        ORDER BY starts_at DESC`
    : `SELECT activity_id, course_id, name, starts_at, type
         FROM activities
        ORDER BY starts_at DESC`;

  try {
    const { rows } = await pool.query(sql, hasFilter ? [courseId] : []);
    res.json(rows);
  } catch (e) {
    console.error("GET /activities error:", e);
    res.status(500).json({ error: e.message });
  }
});

// ROSTER 
app.get("/courses/:id/roster", async (req, res) => {
  const courseId = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(courseId)) {
    return res.status(400).json({ error: "course_id must be an integer" });
  }
  try {
    const { rows } = await pool.query(
      `SELECT u.user_id, u.name, u.email, cu.role
         FROM course_users cu
         JOIN users u ON u.user_id = cu.user_id
        WHERE cu.course_id = $1
        ORDER BY cu.role, u.name`,
      [courseId]
    );
    res.json(rows);
  } catch (e) {
    console.error("GET /courses/:id/roster error:", e);
    res.status(500).json({ error: e.message });
  }
});

// ATTENDANCE 
app.post("/attendance", async (req, res) => {
  let { activity_id, user_id, present } = req.body || {};
  activity_id = typeof activity_id === "string" ? Number.parseInt(activity_id, 10) : activity_id;
  user_id     = typeof user_id === "string" ? Number.parseInt(user_id, 10) : user_id;

  if (!Number.isInteger(activity_id) || !Number.isInteger(user_id) || typeof present !== "boolean") {
    return res.status(400).json({ error: "activity_id (int), user_id (int), and present (boolean) are required" });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO attendance (activity_id, user_id, present)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, activity_id) DO UPDATE
         SET present = EXCLUDED.present
       RETURNING activity_id, user_id, present`,
      [activity_id, user_id, present]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error("POST /attendance error:", e);
    res.status(400).json({ error: e.message });
  }
});
