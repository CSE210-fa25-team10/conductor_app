import express from 'express';
import session from 'express-session';
// import apiRoutes from './adapters/in/routes/apiRoutes.js';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { mountRoutes } from './adapters/in/routes/routes.js';
import { buildContainer } from './infra/container.js';

const PORT = Number(process.env.PORT) || 3000;

// Get the full path to the current file
const __filename = fileURLToPath(import.meta.url);

// Get the directory name of the current file
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    name: 'conductor.sid',
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      // maxAge: 1000 * 60 * 60 * 2, // 2 hours
    },
    // Store the session somewhere if we want
  })
);
app.use(cors());

// API routes
// app.use('/api', apiRoutes);

// serve static assets (CSS, JS, images)
app.use(express.static(path.join(__dirname, '../frontend')));

// build dependencies (repos, use-cases, controllers, etc.)
const container = buildContainer(process.env);

// mount all HTTP routes
mountRoutes(app, container);

// Health check endpoints
app.get('/healthz', (_req, res) => res.status(200).send('OK'));

// Start server
console.log('Running server.js from:', process.cwd());
app.listen(PORT, () => {
  console.log(` Server listening on http://localhost:${PORT}`);
});
