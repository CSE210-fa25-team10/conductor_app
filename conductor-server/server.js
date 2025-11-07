import express from "express";
import { Pool } from "pg";
import "dotenv/config";

const app = express();
app.use(express.json());

console.log("Running server.js from:", process.cwd());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://localhost:5432/conductor",
});

// Root route
app.get("/", (_req, res) => res.type("text").send("ok"));

// Health route
app.get("/health", async (_req, res) => {
  try {
    const { rows } = await pool.query("select now() as db_time");
    res.json({ ok: true, db_time: rows[0].db_time });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(` Server listening on http://localhost:${port}`);
});

// Directory endpoints 

// List users
app.get("/users", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `select user_id, full_name, email, created_at
       from users
       order by created_at desc`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// List courses
app.get("/courses", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `select course_id, code, title, term, section, created_at
       from courses
       order by created_at desc`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// List activities (optionally filter by course_id)
app.get("/activities", async (req, res) => {
  const { course_id } = req.query;
  const sql = course_id
    ? `select activity_id, course_id, name, starts_at, ends_at, type, location
       from activities where course_id = $1
       order by starts_at desc`
    : `select activity_id, course_id, name, starts_at, ends_at, type, location
       from activities
       order by starts_at desc`;
  try {
    const { rows } = await pool.query(sql, course_id ? [course_id] : []);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
