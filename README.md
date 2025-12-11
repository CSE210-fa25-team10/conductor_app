# Conductor App

Conductor helps instructors and students stay on top of attendance, standups, and coursework. This repo brings everything together: a Node.js + Express API that talks to Postgres, a static frontend with accompanying Jest/Playwright tests, and a Docker Compose stack that reproduces the full environment in a couple of commands.

## Repository Layout

```
conductor_app/
|-- conductor-server/   # Backend API, schema, scripts, tests
|-- frontend/           # Static assets + frontend test harness (Jest + Playwright)
|-- admin/              # Meeting notes, presentations, and misc docs
|-- spec/               # Architectural decision records and specs
|-- docker-compose.yml  # Dev stack (db + api + nginx frontend)
`-- README.md           # You are here
```

See [`conductor-server/README.md`](conductor-server/README.md) for the detailed backend guide.
See [`frontend/README.md`](frontend/README.md) for the detailed backend guide.

## Requirements

Have the following handy before you dive in:

- Node.js 24.x (run `nvm install 24 && nvm use 24` if needed)
- npm 10+
- PostgreSQL 16 (local install or through Docker)
- Docker Desktop (optional, but easiest way to spin up the stack)
- Browsers + system deps installed via Playwright for frontend E2E tests

## Environment Variables

Backend (`conductor-server/.env`):

| Variable | Description | Example |
| --- | --- | --- |
| `PORT` | Express port (default 3000) | `3000` |
| `DATABASE_URL` | Postgres connection string | `postgresql://appuser:apppassword@localhost:5432/conductor` |
| `SESSION_SECRET` | Secret for express-session | `dev-secret-change-me` |
| `ATTENDANCE_PIN_SECRET` | Deterministic PIN salt for attendance | `pin-secret` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Enable Google OAuth login | `xxxx.apps.googleusercontent.com` |

Docker Compose (`.env` at repo root, read by `docker-compose.yml`):

| Variable | Description | Example |
| --- | --- | --- |
| `POSTGRES_USER` | Username for the db container | `appuser` |
| `POSTGRES_PASSWORD` | Password for the db user | `apppassword` |
| `POSTGRES_DB` | Default database name | `conductor` |
| `DATABASE_URL` | Connection string the API container should use | `postgresql://appuser:apppassword@db:5432/conductor` |
| `NODE_ENV` | Mode for the API container | `development` |
| `PORT` | Backend port exposed to host | `3000` |

Keep secrets out of version control (use local `.env` files).

## Quick Start

### Docker Compose stack

From the repo root:

```bash
cp .env.example .env   # if you track one locally
docker compose up --build
```

- `db` (Postgres 16) mounts `schema.sql` and `sample.sql`, so schema + demo data appear automatically.
- `api` builds from `conductor-server/Dockerfile`, waits for the database health check, and binds to port 3000.
- `frontend` copies the static assets into nginx and serves them on port 8080.

Shut the stack down with `docker compose down`. Add `-v` when you want to wipe the persistent Postgres volume.

## Testing

Backend:

- `npm run test:unit` inside `conductor-server` for controller/service unit tests.
- `npm run test:integration` against a running Postgres database (uses Supertest).
- `npm test` runs both suites (integration first, then unit).
- `npm run lint` / `npm run format:check` for ESLint and Prettier.

Frontend:

- `npm run test:unit` for Jest DOM tests.
- `npm run test:e2e` for Playwright (ensure the API + DB are up, e.g., via Docker Compose).
- `npm run test:all` to run both suites sequentially.

CI typically wires these commands into separate jobs (unit first, then integration/E2E).

## CI/CD Overview

All GitHub Actions workflows live in `.github/workflows`

### Continuous Integration - `ci.yml`

Runs on every push and PR to `main`:

- ESLint + Prettier checks
- Backend Docker build
- Backend integration tests (Postgres service)
- Backend EC2-related unit tests
- Frontend Jest unit tests
- Full-stack E2E tests with Docker Compose + Playwright
- Uploads reports/screenshots on failure

### Continuous Deployment - `cd.yml`

Runs on push to `main`:

- Logs in to Amazon ECR
- Builds and tags backend Docker image
- Pushes image → ECR (latest + commit SHA)
- SSHes into EC2
- Runs `deploy.sh` to pull + restart the backend container

Secrets are configured in GitHub Actions (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `EC2_HOST`, `EC2_USER`, `SSH_PRIVATE_KEY`).

## Additional Docs

- [`conductor-server/README.md`](conductor-server/README.md) - backend deep dive, architecture, troubleshooting.
- [`conductor-server/infra/documentation.md`](conductor-server/infra/documentation.md) - testing + CI/CD deep dive
- `admin/` and `spec/adr/` - organizational notes, meeting decks, and architectural decisions.

Questions or missing info? Reach out in the project channel or add to this README as the repo evolves.
