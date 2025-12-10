# Conductor App

A collaborative learning platform for managing student teams, attendance, and course coordination.

## Table of Contents

- [Security](#security)
- [Background](#background)
- [Install](#install)
- [Usage](#usage)
- [API](#api)
- [Contributing](#contributing)
- [License](#license)

## Security

- User authentication uses cookie-based sessions with bcrypt password hashing.
- Sensitive endpoints require authentication middleware (`requireAuth`).
- Environment variables (e.g., database credentials, Google OAuth keys) are never committed; use `.env` files.
- Profile photos are stored as bytea in the database; base64 encoding is used for JSON transport.
- CORS and CSP policies should be configured in production.

## Background

Conductor is designed to streamline team-based coursework by providing:
- User registration and role-based access (instructor/student).
- Course and team management for instructors.
- Attendance tracking and check-in capabilities.
- User profile management with availability and contact information.
- Integration with Google Calendar for course event sync (in progress).

The app uses a modular Node.js backend with Express and a static HTML/CSS/vanilla JS frontend.

## Install

### Prerequisites

- Docker and Docker Compose
- Node.js 24+ (if running locally without Docker)
- PostgreSQL 13+ (if running locally)

### Quick Start with Docker

1. Clone the repository:
   ```bash
   git clone https://github.com/CSE210-fa25-team10/conductor_app.git
   cd conductor_app
   ```

2. Create a `.env` file in the root (example):
   ```bash
   DATABASE_URL=postgres://user:password@db:5432/conductor
   SESSION_SECRET=your-secret-key
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_API_KEY=your-google-api-key
   ```

3. Build and start containers:
   ```bash
   docker compose up -d --build
   ```

4. Run database migrations (if needed):
   ```bash
   docker compose exec api npm run migrate
   ```

5. Access the app at `http://localhost:3000`.

### Local Development (without Docker)

1. Install backend dependencies:
   ```bash
   cd conductor-server
   npm install
   ```

2. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

3. Set up PostgreSQL and run migrations.

4. Start the backend:
   ```bash
   cd conductor-server
   npm start
   ```

5. Serve frontend (e.g., with `http-server` or nginx).

## Usage

### Login

1. Navigate to `http://localhost:3000/login`.
2. Enter email and password.
3. On successful login, you'll be redirected to your role-specific dashboard.

### Registration

1. Navigate to `http://localhost:3000/register`.
2. Fill in name, email, password, role (student/instructor), and optional phone number.
3. After registration, you'll be redirected to login.

### Profile Management

1. After login, click your avatar or go to `http://localhost:3000/profile`.
2. Update pronunciation, phone number, and availability.
3. Upload a profile photo (max 5MB).
4. Save changes.

### Instructor Features

- Create and manage courses.
- View and grade student attendance.
- Export attendance reports.
- Manually mark attendance.

### Student Features

- View enrolled courses.
- Check in to class (via QR code or manual entry).
- View attendance history.
- Join teams and manage availability.

## API

### Authentication

- `POST /api/auth/login` — Local login (email, password).
- `POST /api/auth/register` — Register a new user.
- `GET /api/auth/google` — Google OAuth redirect.
- `GET /api/auth/callback` — OAuth callback handler.
- `POST /api/auth/logout` — Destroy session.

### User

- `GET /api/user` — Get current user profile.
- `POST /api/user` — Update user profile (phone, pronunciation, availability, pronouns, slack).
- `PUT /api/user/profile-photo` — Upload profile photo (base64 JSON).

### Configuration

- `GET /api/config/google` — Get Google API configuration (clientId, apiKey).

### Courses

- `GET /api/courses` — List courses.
- `POST /api/course` — Create a course (instructor only).

### Attendance

- `GET /api/attendance` — Get attendance records.
- `POST /api/attendance` — Mark attendance.

Detailed API documentation is available in `conductor-server/ENDPOINTS_SUMMARY.md`.

## Contributing

1. Create a feature branch from `main`:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name
   ```

2. Make changes and commit:
   ```bash
   git add .
   git commit -m "feat: describe your changes"
   git push origin feature/your-feature-name
   ```

3. Open a Pull Request on GitHub and request review.

4. After approval, merge to `main` and delete the feature branch.

### Code Style

- Use ESLint for JavaScript (run `npm run lint` in backend or frontend).
- Write JSDoc comments for functions.
- Keep functions small and focused.
- Write tests for critical logic.

### Local Testing

Run unit tests:
```bash
cd conductor-server
npm test
```

View server logs:
```bash
docker compose logs -f api
```

Check frontend assets load:
```bash
curl -i http://localhost:3000/login
```

## License

This project is licensed under the MIT License — see `LICENSE` file for details.

---

**Questions?** Open an issue on GitHub or contact the maintainers.
