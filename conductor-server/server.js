import express from 'express';
import cors from 'cors';
import { dbHealth } from './db.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Allow local frontends in dev (edit CORS_ORIGIN in .env to lock down)
const origins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : ['http://localhost:8080', 'http://localhost:5173'];
app.use(cors({ origin: origins, credentials: true }));

//Parse JSON and forms
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Container/Service health
app.get('/healthz', (_req, res) => res.status(200).send('ok'));

// DB health — verifies backend <-> Postgres connectivity
app.get('/db-check', async (_req, res) => {
    try {
        const ok = await dbHealth();
        res.status(ok ? 200 : 500).json({ db: ok ? 'up' : 'down' });
    } catch (e) {
        res.status(500).json({ db: 'down', error: String(e) });
    }
});

// Test route
app.get('/', (req, res) => {
    res.send('✅ Express 5.1.0 server running on Node.js v24.11.0 LTS, Postgres + Docker setup running');
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
})