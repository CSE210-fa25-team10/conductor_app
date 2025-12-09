# Conductor Server (Backend)

Node.js 24 + Express 5 API powering Conductor's attendance, standup, course, and reporting tools. The backend exposes `/api/*` endpoints, serves static assets for quick demos, and wires PostgreSQL data through a small ports-and-adapters style architecture.

## Contents

- [Requirements](#requirements)
- [Project Layout](#project-layout)
- [Environment Variables](#environment-variables)
- [Quick Start (local dev)](#quick-start-local-dev)
- [Working with Docker](#working-with-docker)
- [Database & Migrations](#database--migrations)
- [Available npm scripts](#available-npm-scripts)
- [Architecture Notes](#architecture-notes)
- [API Surface](#api-surface)
- [Testing & QA](#testing--qa)
- [Troubleshooting](#troubleshooting)

## Requirements

- Node.js **24.11.0 LTS** (use `nvm use 24` if needed)
- npm 10+
- PostgreSQL 16 (local install or Docker)
- Docker Desktop 4.x (optional, for the compose stack)

## Project Layout

```
conductor-server/
├── server.js               # Express entrypoint + session/CORS/static wiring
├── infra/container.js      # Composition root, builds controllers/services
├── adapters/
│   ├── in/routes/          # HTTP routers grouped by domain
│   └── out/db/sql/         # Parameterized SQL files + README
├── controllers/            # Request handlers (auth, attendance, courses, groups, standup)
├── services/               # Business helpers (auth, query loader, standup, course, group)
├── middleware/             # Session-based auth guards
├── db.js                   # Shared pg Pool + health helper
├── scripts/migrate.js      # Applies schema.sql to $DATABASE_URL
├── schema.sql              # Source-of-truth Postgres schema
├── sample.sql              # Optional development seed data
├── tests/                  # unit + integration specs (Jest + Supertest)
└── Dockerfile              # Production Node 24 slim image
```

The backend is mounted under `/api/*`, while `/css`, `/js`, and `/` serve the lightweight static prototype that lives in `frontend/`.

## Environment Variables

Create `conductor-server/.env` (or export locally) before running scripts:

| Variable                | Required | Description                                                                             | Example                                                     |
| ----------------------- | -------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `PORT`                  | No       | HTTP port for Express                                                                   | `3000`                                                      |
| `NODE_ENV`              | No       | `development`, `test`, or `production`                                                  | `development`                                               |
| `DATABASE_URL`          | Yes      | Postgres connection string used by the API and migrations                               | `postgresql://appuser:apppassword@localhost:5432/conductor` |
| `SESSION_SECRET`        | Yes      | Secret for the `conductor.sid` session cookie                                           | `super-secret-change-me`                                    |
| `ATTENDANCE_PIN_SECRET` | No       | Shared secret for deterministic attendance PINs                                         | `pin-secret`                                                |
| `GOOGLE_CLIENT_ID`      | No\*     | OAuth client for Google login (needed if enabling Google auth flow)                     | `xxx.apps.googleusercontent.com`                            |
| `GOOGLE_CLIENT_SECRET`  | No\*     | OAuth secret matching the above                                                         | `xyz`                                                       |
| `CORS_ORIGIN`           | No       | Optional allowlist origin (default currently allows any origin via `cors()` middleware) | `http://localhost:5173`                                     |

Docker Compose also reads these (in the repo root `.env`):

| Variable            | Description                                    | Example                                              |
| ------------------- | ---------------------------------------------- | ---------------------------------------------------- |
| `POSTGRES_USER`     | Database user created by the `db` service      | `appuser`                                            |
| `POSTGRES_PASSWORD` | Password for the above user                    | `apppassword`                                        |
| `POSTGRES_DB`       | Default database name                          | `conductor`                                          |
| `DATABASE_URL`      | Connection string the API container should use | `postgresql://appuser:apppassword@db:5432/conductor` |

> Tip: keep development `.env` files out of source control.

## Quick Start (local dev)

1. **Install deps**
   ```bash
   cd conductor-server
   npm install
   ```
2. **Provision Postgres** - start a local instance (Homebrew, Docker Desktop, or `docker compose up db -d` from the repo root).
3. **Configure environment** - copy the sample block above into `conductor-server/.env`, pointing `DATABASE_URL` at your Postgres instance.
4. **Apply schema**
   ```bash
   npm run migrate
   ```
5. **Seed data (optional)**
   ```bash
   psql "$DATABASE_URL" -f sample.sql
   ```
6. **Start the API**
   ```bash
   npm start
   ```
7. Navigate to `http://localhost:3000/healthz` (or hit it via curl) to verify the server responds `OK`.

## Working with Docker

The repo root `docker-compose.yml` spins up Postgres, the API, and the production frontend container.

```bash
# From /Users/.../conductor_app
cp .env.example .env              # if you keep root-level examples
docker compose up --build
```

- `db` mounts `schema.sql` and `sample.sql` so the database is created and populated on first boot.
- `api` builds from `conductor-server/Dockerfile`, exposes port `3000`, and waits for the database health check before booting.
- `frontend` runs the published frontend image (served on `http://localhost:8080`) but can be removed if you prefer `npm run dev` inside `/frontend`.

Stop the stack with `docker compose down` (add `-v` to wipe the persistent volume).

## Database & Migrations

- `schema.sql` is the canonical schema (users, groups, courses, attendance, standup tables, etc.). Update it when making structural changes.
- `scripts/migrate.js` runs the entire schema inside a transaction. It reads `DATABASE_URL`, so ensure the env var is set before invoking `npm run migrate`.
- `sample.sql` seeds a handful of instructors, students, groups, and activities. Run it manually (or let Docker compose mount it) when you need demo data.
- The API uses a shared `pg.Pool` (`db.js`). Exposing `dbHealth()` makes it easy to add readiness probes or CLI scripts later.

## Available npm scripts

| Script                            | Description                                                                   |
| --------------------------------- | ----------------------------------------------------------------------------- |
| `npm start`                       | Starts Express with the current env (skips listen when `NODE_ENV=test`).      |
| `npm run migrate`                 | Applies `schema.sql` to `DATABASE_URL`.                                       |
| `npm run lint` / `lint:fix`       | ESLint 9 with Prettier config.                                                |
| `npm run format` / `format:check` | Run Prettier across JS/JSON/MD.                                               |
| `npm run test:unit`               | Jest unit tests (no DB required).                                             |
| `npm run test:integration`        | Supertest + pg integration suite (requires a reachable DB + migrated schema). |
| `npm test`                        | Runs integration tests first, then unit tests.                                |

## Architecture Notes

- **Entry point** - `server.js` configures dotenv, JSON parsing, `express-session`, and `cors`, serves static assets from `../frontend`, and mounts routers through `mountRoutes`.
- **Dependency wiring** - `infra/container.js` builds controllers (auth, attendance, standup, group, course, query) and shares the `pg` pool. This keeps the server modular and is a natural home for future repositories/use cases.
- **Ports & adapters** - HTTP routes live in `adapters/in/routes/*`. Data access goes through `services/queryService` which lazily loads SQL files from `adapters/out/db/sql`.
- **Controllers/services** - Business logic lives in `controllers/*` and `services/*`:
  - `authController` coordinates password+Google logins (requires `GOOGLE_CLIENT_ID/SECRET`).
  - `attendanceController` handles QR/PIN generation, check-ins, group summaries, and instructor dashboards.
  - `courseController`, `groupController`, and `standupController` manage enrollment, team CRUD, and daily standup/feedback flows.
- **Middleware** - `middleware/auth.js` enforces `requireAuth()` (session-based) and `requireInstructorOrTA` (using `course_users` roles) before sensitive routes.
- **Static prototype** - `/css`, `/js`, and `/` routes serve files from the `frontend` folder so design reviews can happen without running `npm run dev`. You can point an external SPA at the API by configuring `CORS` as needed.

## API Surface

High-level route map (see [`ENDPOINTS_SUMMARY.md`](ENDPOINTS_SUMMARY.md) and individual route files for details and payload shapes):

- **Auth** (`/api/auth`) - email/password login & registration, Google OAuth redirect/callback, logout. Successful login stores a lightweight `req.session.user`.
- **Queries** (`/api/queries`) - REST wrappers around SQL files (users, courses, activities, attendance). Add a `.sql` file + route to expose more reads.
- **Frontend helper endpoints** (`/api/postman`) - the legacy routes the frontend team requested (`/api/user`, `/api/course(s)`, `/api/assignment`, etc.).
- **Courses** (`/api/courses`) - instructor course creation, student enrollment, and "my courses" listing.
- **Attendance** (`/api/attendance`) - instructor session start (QR + deterministic PIN), student check-in, manual overrides, course/group summaries, and student dashboards.
- **Standup tool** (`/api/standup`) - students submit standup entries + anonymous feedback, instructors/TA/team leads retrieve reports.
- **Groups** (`/api/groups`) - instructor CRUD for project teams and students fetching their own assignment.
- **Pages/static** - `pageRouter`, `cssRouter`, and `jsRouter` serve the prototype UI under `/`.

Health probe: `GET /healthz` returns `200 OK` when the process is up.

## Testing & QA

1. Ensure `DATABASE_URL` points at a disposable database (integration specs mutate data).
2. Apply the schema: `npm run migrate`.
3. Run tests:
   ```bash
   npm run test:unit          # business logic, no DB
   npm run test:integration   # supertest against the HTTP stack
   npm test                   # combo
   ```
4. Lint/format before opening a PR: `npm run lint && npm run format:check`.

Integration tests currently include scaffolding for a full auth/course flow (`tests/integration/full-flow.test.js`). Fill in the commented assertions as the API stabilizes.

## Troubleshooting

- **Cannot connect to Postgres** - verify `DATABASE_URL`, ensure the instance is running, and confirm the user/password matches `schema.sql` defaults (`appuser/apppassword`).
- **Session not persisting** - check that cookies are being set (`conductor.sid`). In production you must set `SESSION_SECRET` and use a persistent session store.
- **CORS complaints** - uncomment the stricter CORS block in `server.js` and list the dev origins (`http://localhost:5173`, etc.), or set up a reverse proxy.
- **Google login fails** - confirm OAuth credentials, allowed redirect (`http://localhost:3000/api/auth/google/callback`), and that HTTPS is used in production.
- **Attendance PIN mismatch** - set the same `ATTENDANCE_PIN_SECRET` everywhere (API, any worker verifying codes); rotating it invalidates active sessions.

Need something that is not spelled out here? Check the open-domain docs inside `conductor-server/infra`, `adapters/out/db/sql/README.md`, or ask in the team channel.
