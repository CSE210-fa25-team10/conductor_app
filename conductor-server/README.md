# Conductor Server

A lightweight Node.js + Express 5.1.0 backend for the Conductor Tool project.

## 🚀 Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Run the server

```bash
npm start
```

The server will start at:

```
http://localhost:3000
```

You should see:

```angular2html
✅ Express 5.1.0 server running on Node.js v24.11.0 LTS
```

---

## 🧠 Project Structure

```bash
conductor-server/
├── package.json     # Project config
├── server.js        # Main entry point
├── README.md        # This file
└── node_modules/    # Installed dependencies
```

---

## 🧩 Tech Stack

- Node.js v24.11.0 (LTS)
- Express v5.1.0

---

## 🔐 Environment variables (local dev)

This project reads runtime configuration from environment variables. A safe local workflow is:

1. Copy `conductor-server/.env.example` to `conductor-server/.env` (do NOT commit `.env`).
2. Fill in the real values for the Google OAuth client, database URL and any secrets.

Example variables in `.env`:

```
PORT=3000
SESSION_SECRET=super-secret
DATABASE_URL=postgres://appuser:apppassword@localhost:5432/conductor
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
ATTENDANCE_PIN_SECRET=replace-me
FRONTEND_BASE_URL=http://localhost:3000
```

Notes:
- The server already loads `.env` when running locally (server.js uses dotenv.config()).
- **Do not** commit `.env` to git. The project-level `.gitignore` already ignores `.env` files.
- In CI or production, configure these variables using your platform's environment variable settings (e.g., GitHub Actions secrets, Heroku config vars, Vercel environment variables, etc.).

### IMPORTANT — if this repo ever contained real secrets

- I noticed `conductor-server/.env.example` previously contained actual secret values (client secret, API key, session secret).
- If those values were pushed to a remote, treat the credentials as compromised and rotate them immediately in Google Cloud and other services.
- To remove secrets from git history you can use tools like `git-filter-repo` or `BFG Repo-Cleaner` (this rewrites history and requires coordination and force-pushing).

If you want I can help with the following next steps:

- Replace secrets in this repo with placeholders (done).
- Provide step-by-step guidance to rotate the leaked keys in Google Cloud.
- Prepare a safe history-cleanup plan (BFG/git-filter-repo) if you want to remove the secrets from git history.


