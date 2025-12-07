# Frontend — Conductor App

This document summarizes the frontend layout, workflow, and the important pages and scripts used during development.

Overview
- The frontend is a static site (HTML/CSS/vanilla JS) mounted into the API container in development.
- Primary development path: edit files under `frontend/src/` and reload the browser.

How to run (dev)
- The app is usually run with Docker Compose from the repository root. From the repo root:
  - Rebuild and start API only:
    ```bash
    docker compose build api
    docker compose up -d api
    ```
  - Rebuild and start both frontend and API (if you want the frontend container):
    ```bash
    docker compose up -d --build api frontend
    ```

Project layout (important paths)
- `frontend/src/pages/` — HTML pages grouped by area (auth, instructor, student, shared).
  - `pages/auth/` contains `login.html`, `register.html`.
  - `pages/shared/profile.html` is the user profile page.
  - `pages/instructor/` and `pages/student/` contain area-specific pages.
- `frontend/src/js/` — client-side JS modules for each page.
  - `login.js` — attaches handlers for login form and redirects on success.
  - `register.js` — attaches handlers for registration form and validation.
  - `profile.js` — profile page logic: loads `/api/user`, populates form fields, handles profile photo preview/upload, availability, and calendar rendering.
  - `instructor/` and `student/` subfolders hold area-specific JS.
- `frontend/src/css/` — CSS files for pages and shared styles.

Key behaviors and integration points
- Authentication
  - Login and register forms POST to `/api/auth/login` and `/api/auth/register` respectively (JSON payloads). The API uses cookie-based sessions; client requests include `credentials: 'include'`.

- Profile photo
  - Client reads the selected file as a Data URL and PUTs JSON `{ profile_photo: 'data:image/..;base64,...' }` to `/api/user/profile-photo`.
  - The server stores the photo (bytea) and the frontend expects `profile_photo` as a base64 string to render inside an `<img src="data:image/jpeg;base64,<base64>" />`.
  - To avoid large payloads, the client limits files (e.g., 5MB). Consider client-side resize or multipart upload if needed.

- Google Calendar
  - The frontend calls `/api/config/google` to fetch `clientId` and `apiKey` before initializing `gapi`.
  - Ensure the OAuth Client in Google Cloud Console includes the frontend origin (e.g., `http://localhost:3000`) in Authorized JavaScript origins.

Debugging tips
- If CSS/JS doesn't load, check that HTML uses absolute `/css/...` and `/js/...` paths and that the API serves static assets.
- If you see `data:image/...;base64,[object Object]` in the `img` src, inspect the JSON returned by `GET /api/user` to confirm `profile_photo` is a base64 string, not an object.
- For server logs:
  ```bash
  docker compose logs -f api
  ```

Testing and quick checks
- Check Google config endpoint:
  ```bash
  curl -sS http://localhost:3000/api/config/google | jq .
  ```
- Check current user JSON (requires login session cookie):
  ```bash
  curl -sS -b cookiejar.txt http://localhost:3000/api/user | jq .
  ```

Contributing
- Edit files under `frontend/src/`. Commit to your feature branch and open a PR when ready.
- Keep scripts small and DOM-centric; prefer progressive enhancement since pages are static HTML.

If you want, I can expand this README with a file-by-file reference or add a small developer checklist for running/debugging the frontend.
