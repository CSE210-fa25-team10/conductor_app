// import express from "express";
// import session from 'express-session';
// import apiRoutes from './adapters/in/routes/apiRoutes.js';
// import { pool, dbHealth } from "./db.js";
// import dotenv from 'dotenv';
// import cors from "cors";

// const PORT = Number(process.env.PORT) || 3000;

// dotenv.config();

// const app = express();

// // CORS for frontend running on port 5500
// app.use(cors({
//   origin: "http://localhost:5500",
//   credentials: true
// }));

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(session({
//     secret: process.env.SESSION_SECRET || "dev-secret",
//     resave: false,
//     saveUninitialized: false,
// }));

// app.use("/api", apiRoutes);

// // Test route
// const isLoggedIn = (req, res, next) => {
//   if (req.session.user) next();
//   else res.redirect('/users');
// };

// app.get('/', isLoggedIn, (req, res) => {
//   res.send(`
//     <h1>Welcome ${req.session.user.name}</h1>
//     <img src="${req.session.user.picture}" />
//     <br/>
//     <a href="/api/auth/logout">Logout</a>
//   `);
// });

// // Container/Service health
// app.get('/healthz', (_req, res) => res.status(200).send('ok'));

// // DB health — verifies backend <-> Postgres connectivity
// app.get('/db-check', async (_req, res) => {
//     try {
//         const ok = await dbHealth();
//         res.status(ok ? 200 : 500).json({ db: ok ? 'up' : 'down' });
//     } catch (e) {
//         res.status(500).json({ db: 'down', error: String(e) });
//     }
// });

// // helper: map PG bad-UUID to 400
// function handlePgUuidError(res, err) {
//   if (err && err.code === "22P02") { // invalid_text_representation
//     return res.status(400).json({ error: "invalid UUID format" });
//   }
//   return res.status(500).json({ error: "internal_error" });
// }

// // Root test route
// app.get('/', (req, res) => {
//     res.send('✅ Express 5.1.0 server running on Node.js v24.11.0 LTS, Postgres + Docker setup running');
// });

// // Health
// app.get("/health", async (_req, res) => {
//   try {
//     const { rows } = await pool.query("select now() as db_time");
//     res.json({ ok: true, db_time: rows[0].db_time });
//   } catch (e) {
//     res.status(500).json({ ok: false, error: e.message });
//   }
// });

// // USERS 

// app.get("/users", async (_req, res) => {
//   try {
//     const { rows } = await pool.query(
//       `SELECT user_id, name, email
//          FROM users
//          ORDER BY user_id DESC`
//     );
//     res.json(rows);
//   } catch (e) {
//     console.error("GET /users error:", e);
//     res.status(500).json({ error: e.message });
//   }
// });

// // COURSES 
// app.get("/courses", async (_req, res) => {
//   try {
//     const { rows } = await pool.query(
//       `SELECT course_id
//          FROM courses
//          ORDER BY course_id DESC`
//     );
//     res.json(rows);
//   } catch (e) {
//     console.error("GET /courses error:", e);
//     res.status(500).json({ error: e.message });
//   }
// });

// // ACTIVITIES 
// app.get("/activities", async (req, res) => {
//   const hasFilter = typeof req.query.course_id !== "undefined";
//   const courseId = hasFilter ? Number.parseInt(req.query.course_id, 10) : null;
//   if (hasFilter && !Number.isInteger(courseId)) {
//     return res.status(400).json({ error: "course_id must be an integer" });
//   }

//   const sql = hasFilter
//     ? `SELECT activity_id, course_id, name, starts_at, type
//          FROM activities
//         WHERE course_id = $1
//         ORDER BY starts_at DESC`
//     : `SELECT activity_id, course_id, name, starts_at, type
//          FROM activities
//         ORDER BY starts_at DESC`;

//   try {
//     const { rows } = await pool.query(sql, hasFilter ? [courseId] : []);
//     res.json(rows);
//   } catch (e) {
//     console.error("GET /activities error:", e);
//     res.status(500).json({ error: e.message });
//   }
// });

// // ROSTER 
// app.get("/courses/:id/roster", async (req, res) => {
//   const courseId = Number.parseInt(req.params.id, 10);
//   if (!Number.isInteger(courseId)) {
//     return res.status(400).json({ error: "course_id must be an integer" });
//   }
//   try {
//     const { rows } = await pool.query(
//       `SELECT u.user_id, u.name, u.email, cu.role
//          FROM course_users cu
//          JOIN users u ON u.user_id = cu.user_id
//         WHERE cu.course_id = $1
//         ORDER BY cu.role, u.name`,
//       [courseId]
//     );
//     res.json(rows);
//   } catch (e) {
//     console.error("GET /courses/:id/roster error:", e);
//     res.status(500).json({ error: e.message });
//   }
// });

// // // ATTENDANCE 
// // app.post("/attendance", async (req, res) => {
// //   let { activity_id, user_id, present } = req.body || {};
// //   activity_id = typeof activity_id === "string" ? Number.parseInt(activity_id, 10) : activity_id;
// //   user_id     = typeof user_id === "string" ? Number.parseInt(user_id, 10) : user_id;

// //   if (!Number.isInteger(activity_id) || !Number.isInteger(user_id) || typeof present !== "boolean") {
// //     return res.status(400).json({ error: "activity_id (int), user_id (int), and present (boolean) are required" });
// //   }
// //   try {
// //     const { rows } = await pool.query(
// //       `INSERT INTO attendance (activity_id, user_id, present)
// //        VALUES ($1, $2, $3)
// //        ON CONFLICT (user_id, activity_id) DO UPDATE
// //          SET present = EXCLUDED.present
// //        RETURNING activity_id, user_id, present`,
// //       [activity_id, user_id, present]
// //     );
// //     res.status(201).json(rows[0]);
// //   } catch (e) {
// //     console.error("POST /attendance error:", e);
// //     res.status(400).json({ error: e.message });
// //   }
// // });

// // Start server
// console.log("Running server.js from:", process.cwd());
// app.listen(PORT, () => {
//   console.log(` Server listening on http://localhost:${PORT}`);
// });

// conductor_app/conductor-server/server.js
import express from "express";
import session from "express-session";
import apiRoutes from "./adapters/in/routes/apiRoutes.js";
import { pool, dbHealth } from "./db.js";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const app = express();

// -------- Paths ----------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// (Optional) serve static HTML if you want via backend
// Not required if you keep using Live Server
app.use(express.static(
  path.join(__dirname, "../frontend/src/pages")
));

// -------- CORS ----------
const FRONTEND_ORIGIN = [
  "http://localhost:5500",
  "http://127.0.0.1:5500"
];

console.log("[server] Allowed CORS origins:", FRONTEND_ORIGIN);

app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true
}));

// -------- Body + Session ----------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
  })
);

// -------- API routes ----------
app.use("/api", apiRoutes);

// -------- Health checks ----------
app.get("/healthz", (_req, res) => res.status(200).send("ok"));

app.get("/db-check", async (_req, res) => {
  try {
    const ok = await dbHealth();
    res.status(ok ? 200 : 500).json({ db: ok ? "up" : "down" });
  } catch (e) {
    res.status(500).json({ db: "down", error: String(e) });
  }
});

// Root – just a boring text so we know server is alive
app.get("/", (_req, res) => {
  res.send("✅ Express API running (Conductor)");
});

// Simple debug endpoint to test from browser
app.get("/api/debug/ping", (_req, res) => {
  res.json({ ok: true, message: "pong from backend" });
});

// -------- Start server ----------
console.log("[server] CWD:", process.cwd());
app.listen(PORT, () => {
  console.log(`🚀 API listening on http://localhost:${PORT}`);
});
