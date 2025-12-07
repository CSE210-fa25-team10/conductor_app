# Frontend — Conductor App

A static HTML/CSS/vanilla JavaScript frontend for the Conductor collaborative learning platform.

## Table of Contents

- [Security](#security)
- [Background](#background)
- [Install](#install)
- [Usage](#usage)
- [API](#api)
- [Contributing](#contributing)
- [License](#license)

## Security

- All API requests include `credentials: 'include'` to send authentication cookies.
- Sensitive data (passwords) are sent only over HTTPS in production.
- Form inputs are validated client-side; server-side validation is required.
- Profile photos are base64-encoded for JSON transport; consider limiting file size or resizing client-side.
- Avoid storing sensitive tokens or secrets in localStorage; use secure, httpOnly cookies.
- Content Security Policy (CSP) headers should be set server-side to prevent injection attacks.

## Background

The frontend provides a user interface for:
- User authentication (login/register).
- Role-based dashboards (student/instructor).
- Profile management (name, phone, availability, profile photo).
- Course browsing and team management.
- Attendance check-in and history.
- Calendar view for course events and Google Calendar integration.

The frontend is mounted into the API container in development and uses relative/absolute asset paths for CSS and JS.

## Install

### Prerequisites

- Node.js 18+ (optional; Docker runs Node internally).
- Docker Compose (for running with the full stack).

### Quick Start with Docker

From the repository root:

```bash
docker compose up -d --build frontend
```

The frontend will be served by nginx at `http://localhost:3000`.

### Local Development (without Docker)

1. Install dependencies (if using a local development server):
   ```bash
   cd frontend
   npm install
   ```

2. Serve static files with a local HTTP server (e.g., `http-server`):
   ```bash
   npx http-server src
   ```

3. Open `http://localhost:8080` in your browser.

### Development with Backend

To run frontend + API + database:

```bash
docker compose up -d --build api frontend
```

Access the app at `http://localhost:3000`.

## Usage

### Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── login.html
│   │   │   └── register.html
│   │   ├── shared/
│   │   │   └── profile.html
│   │   ├── instructor/
│   │   │   ├── dashboard.html
│   │   │   ├── courses.html
│   │   │   ├── attendance.html
│   │   │   └── ...
│   │   └── student/
│   │       ├── dashboard.html
│   │       ├── courses.html
│   │       ├── checkin.html
│   │       └── ...
│   ├── js/
│   │   ├── login.js
│   │   ├── register.js
│   │   ├── profile.js
│   │   ├── instructor/
│   │   │   ├── dashboard.js
│   │   │   └── ...
│   │   └── student/
│   │       ├── dashboard.js
│   │       └── ...
│   └── css/
│       ├── auth.css
│       ├── profile.css
│       ├── instructor/
│       │   └── ...
│       └── student/
│           └── ...
├── jest.config.mjs
├── jest.setup.js
├── package.json
└── README.md
```

### Key Pages

- **Login** (`/login`) — Authenticate with email/password.
- **Register** (`/register`) — Create a new account.
- **Profile** (`/profile`) — Manage user info, phone, availability, and profile photo.
- **Student Dashboard** (`/student`) — View courses, check in, and manage teams.
- **Instructor Dashboard** (`/instructor`) — Manage courses, view attendance, grade.

### Key Scripts

- `login.js` — Handles login form submission and role-based redirect.
- `register.js` — Handles user registration with validation.
- `profile.js` — Loads user profile, handles photo upload, calendar rendering, and field updates.
- `dashboard.js` (student/instructor) — Loads user info and course data.

## API

The frontend communicates with the backend via these endpoints:

### Authentication

- `POST /api/auth/login` — Login (email, password).
- `POST /api/auth/register` — Register (name, email, password, role, optional phone).
- `GET /api/auth/google` — Google OAuth redirect.
- `GET /api/auth/callback` — OAuth callback.

### User

- `GET /api/user` — Get current user profile.
- `POST /api/user` — Update profile (phone, pronunciation, availability, pronouns, slack).
- `PUT /api/user/profile-photo` — Upload profile photo (base64 JSON).

### Configuration

- `GET /api/config/google` — Get Google API keys (clientId, apiKey).

### Courses

- `GET /api/courses` — List user courses.
- `POST /api/course` — Create course (instructor).

### Attendance

- `GET /api/attendance` — Get attendance records.
- `POST /api/attendance` — Mark attendance.

See `conductor-server/ENDPOINTS_SUMMARY.md` for full API documentation.

## Contributing

### Local Development Workflow

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature
   ```

2. Edit files in `src/pages/` and `src/js/` as needed.

3. Test locally:
   ```bash
   docker compose up -d api frontend
   docker compose logs -f frontend
   ```

4. Commit and push:
   ```bash
   git add .
   git commit -m "feat(frontend): describe your changes"
   git push origin feature/your-feature
   ```

5. Open a Pull Request.

### Code Style

- Use vanilla JavaScript (no frameworks); keep scripts simple and event-driven.
- Write JSDoc comments for functions.
- Use consistent indentation (2 spaces).
- Separate concerns: HTML (pages), CSS (styling), JS (behavior).
- Add `name` attributes to form inputs so FormData collects them properly.

### Testing

Run unit tests:
```bash
npm test
```

Manual smoke tests:
- Log in at `/login`.
- Register at `/register`.
- Update profile at `/profile`.
- Check dashboard loads without errors.

### Debugging Tips

- **CSS not loading?** — Check that HTML uses absolute paths `/css/...` and server maps them correctly.
- **Form data not sending?** — Ensure form inputs have `name` attributes and FormData is used in JS.
- **Profile photo shows `[object Object]`?** — Verify the API returns `profile_photo` as a base64 string, not a Buffer object.
- **API calls fail?** — Check browser console for CORS errors or 401 auth errors; ensure `credentials: 'include'` is set.

View logs:
```bash
docker compose logs -f frontend
docker compose logs -f api
```

## License

This project is licensed under the MIT License — see `LICENSE` file in the repository root for details.

---

**Questions or issues?** Open a GitHub issue or contact the maintainers.
