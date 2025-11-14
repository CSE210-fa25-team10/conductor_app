import express from "express";
import session from 'express-session';
import apiRoutes from './adapters/in/routes/apiRoutes.js';
import { pool, dbHealth } from "./db.js";
import dotenv from 'dotenv';

const PORT = Number(process.env.PORT) || 3000;

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
}));

// API routes
app.use("/api", apiRoutes);

// Root route
app.get('/', (_req, res) => {
  res.send('✅ Express 5.1.0 server running on Node.js v24.11.0 LTS, Postgres + Docker setup running');
});

// Health check endpoints
app.get('/healthz', (_req, res) => res.status(200).send('ok'));

app.get('/health', async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT now() as db_time");
    res.json({ ok: true, db_time: rows[0].db_time });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// DB health check — verifies backend <-> Postgres connectivity
app.get('/db-check', async (_req, res) => {
  try {
    const ok = await dbHealth();
    res.status(ok ? 200 : 500).json({ db: ok ? 'up' : 'down' });
  } catch (e) {
    res.status(500).json({ db: 'down', error: String(e) });
  }
});

// Start server
console.log("Running server.js from:", process.cwd());
app.listen(PORT, () => {
  console.log(` Server listening on http://localhost:${PORT}`);
});
