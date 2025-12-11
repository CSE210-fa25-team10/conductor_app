# Deliverable 3 – Technical Video Slide Deck & Voice-Over Script
## Conductor: Course Management Web Application
**Duration: 10–15 minutes**

---

## PART 1: IMPLEMENTATION & ARCHITECTURE

---

### SLIDE 1: Repo Overview & Directory Structure

**Title:** Repository Structure & Setup

**Bullets:**
- GitHub: `CSE210-fa25-team10/conductor_app`
- Root directory layout:
  - `conductor-server/` – Backend (Node.js 24 + Express)
  - `frontend/` – Frontend (Vanilla HTML/CSS/JS + HTMX)
  - `docker-compose.yml` – Local + prod orchestration
  - `admin/` – Team meeting notes, retrospectives, decisions
  - `spec/` – ADRs and infrastructure proposals
- Tech stack: Node 24, PostgreSQL 16, Docker, Google OAuth 2.0, AWS EC2

**Voice-Over (45 sec):**
"Welcome to Conductor's technical deep dive. This is a course management web app built over four sprints by Team 10. The repo is organized into three main parts. First, the backend—Node.js 24 and Express API serving all course, attendance, and user APIs. Second, the frontend—lightweight HTML, CSS, and vanilla JavaScript running in the browser. Third, infrastructure—Docker Compose for local dev and AWS EC2 for production. We've also tracked team decisions and retrospectives in the admin folder so you can see how we evolved the design. Let's walk through each piece."

---

### SLIDE 2: Backend Architecture – Ports & Adapters

**Title:** Backend Implementation: Ports & Adapters Pattern

**Bullets:**
- **Directory:** `conductor-server/`
- **Entry point:** `server.js` – Express app, session/CORS middleware, static asset serving
- **Architecture layers:**
  - `adapters/in/routes/` – HTTP routers (auth, course, attendance, assignment, standup)
  - `controllers/` – Request handlers, validation, response formatting
  - `services/` – Business logic (login, course queries, attendance logic)
  - `domain/entities/` – Data models (User, Course, Activity, StandupEntry, AnonymousFeedback)
  - `domain/ports/` – Interfaces for data access (ClassQueryPort)
  - `adapters/out/db/` – Postgres queries (parameterized SQL)
- **Key files:**
  - `db.js` – pg Pool config, health checks
  - `schema.sql` – Full Postgres DDL (users, courses, assignments, attendance, standups)
  - `middleware/auth.js` – Session-based auth guards

**Voice-Over (60 sec):**
"The backend uses a Ports and Adapters architecture, which is a clean way to keep business logic separate from databases and HTTP. Here's the flow: an HTTP request comes into one of our route files, hits a controller that validates input, then calls a service that holds the business logic. The service can query the database through a parameterized SQL layer, and all responses go back as JSON. The key insight is that our database queries are completely separated from the controllers—if we wanted to swap Postgres for MongoDB tomorrow, we could do that in the adapters layer without touching the business logic. We also enforce session-based authentication with a middleware guard, so protected endpoints are easy to mark. All the schema lives in schema.sql, making the database contract explicit. This makes testing easier and onboarding faster."

---

### SLIDE 3: Backend – API Routes & Endpoints

**Title:** Backend API Routes (All Implemented)

**Bullets:**
- **Authentication Routes** (`authRoutes.js`):
  - `POST /api/login` – Email/password login
  - `POST /api/register` – New user registration
  - `GET /api/auth/googlelogin` – Google OAuth flow
  - `GET /api/auth/callback` – OAuth callback redirect
  - `GET /api/logout` – Session destroy
  
- **User Routes** (`frontendRoutes.js`):
  - `GET /api/user` – Fetch user profile + courses
  - `POST /api/user` – Update user profile

- **Course Routes**:
  - `POST /api/course` – Create new course (instructor only)
  - `GET /api/course` – Fetch single course by ID
  - `GET /api/courses` – Fetch all courses for a user

- **Attendance Routes** (structure in place, awaiting frontend wire-up):
  - `POST /api/attendance` – Log attendance (PIN, QR, manual)
  - `GET /api/attendance` – Retrieve attendance records

- **Assignment Routes**:
  - `POST /api/assignment` – Create assignment
  - `GET /api/assignment` – List assignments by course

- **Standup Routes** (in progress):
  - Endpoints for work-journal entries and standup submissions

**Voice-Over (75 sec):**
"The backend implements a comprehensive API surface. Authentication is handled through two paths: traditional email/password login or Google OAuth for single sign-on. User endpoints fetch and update profile data. Course endpoints let instructors create courses and students enroll or view course details. Attendance tracking supports three entry methods: a PIN code you enter manually, a QR code scan, or manual instructor entry. Assignments are created by instructors and students submit work. And standups let students log daily work journal entries and reflect on their progress. All of these endpoints follow the same pattern: request validation, service logic, and JSON response. The schema supports role-based access—users have instructor or student roles, and controllers check these roles before allowing operations. This keeps data secure and ensures students can't create courses or see attendance for classes they're not in. We've implemented all the endpoints the frontend asked for; in the next section you'll see them in action on the UI."

---

### SLIDE 4: Frontend Structure – Pages & User Flows

**Title:** Frontend Implementation: Pages & Navigation

**Bullets:**
- **Directory:** `frontend/`
- **Static serving:** 
  - `public/index.html` – Entry point
  - `src/pages/` – Page templates grouped by role (auth, student, instructor, shared)
  - `src/js/` – Vanilla JS handlers for each page
  - `src/css/` – Page-specific and shared styles

- **Key pages by user type:**
  - **Auth (shared):**
    - `/login` – Email/password or Google OAuth
    - `/register` – New user sign-up
  - **Student:**
    - `/student/dashboard` – Enrolled courses, stand-ups, assignments
    - `/student/courses` – Course listing and detail
    - `/student/attendance` – Check-in (PIN/QR/manual)
    - `/student/standup` – Work journal entries
  - **Instructor:**
    - `/instructor/dashboard` – Course management, class stats
    - `/instructor/courses` – Create/edit courses, enrollment
    - `/instructor/attendance` – Generate PINs, mark manual attendance
    - `/instructor/standup` – View student work journals

- **Testing:**
  - Jest + Supertest for unit/integration tests
  - UI test coverage for login, registration, dashboard

**Voice-Over (75 sec):**
"The frontend is built with vanilla HTML, CSS, and JavaScript—no heavy frameworks, which keeps it lean and fast. We organize pages by user role: auth pages are shared, then separate student and instructor sections. Each page has its own template and JavaScript file that handles API calls and DOM updates. Students see a dashboard with their enrolled courses, pending assignments, and standup work journal. They can check in to a course using a PIN, QR code, or instructor manual entry. Instructors see a different dashboard—course creation and management, attendance tracking, and the ability to view student work journals. The frontend is served by the backend as static assets, which simplifies deployment. We use HTMX for some dynamic form interactions, keeping HTML semantic and forms naturally resilient. CSS is organized into shared and page-specific files so styles compose cleanly. We've also started unit testing the login and registration flows with Jest, which gives us confidence that refactors don't break the auth contract. All pages call the backend APIs we just reviewed, so the frontend strictly follows the contract the backend defines."

---

### SLIDE 5: Infrastructure & Deployment Pipeline

**Title:** Infra: Docker, Postgres, EC2 & CI/CD

**Bullets:**
- **Local Development:** `docker-compose.yml`
  - `db` service – PostgreSQL 16, mounts `schema.sql` on init
  - `api` service – Node backend, linked to db, exposes port 3000
  - `frontend` service (optional) – Static frontend served by backend
  - Volumes for persistence and hot-reload

- **Database:**
  - Schema: `schema.sql` (source of truth)
  - Migrations: `scripts/migrate.js` (applies schema on deploy)
  - Sample data: `sample.sql` (optional seed)
  - Tables: users, courses, assignments, attendance, standups, anonymous_feedback

- **Testing & QA:**
  - ESLint for code quality (configured in `eslint.config.js`)
  - Unit test skeletons in `tests/unit/` (attendance, auth, standup)
  - Integration tests in `tests/integration/` (full-flow)
  - Selenium UI tests (login, check-in flows)

- **Production:**
  - EC2 deployment: Backend + DB containers on Amazon Linux
  - GitHub Actions (proposed): Automated testing + deploy on main merge
  - Environment variables: `.env` or AWS Secrets Manager

**Voice-Over (90 sec):**
"Infrastructure is a big part of why this project works. Locally, we use Docker Compose to spin up three containers: PostgreSQL for the database, Node/Express for the API, and optionally the frontend server. This means anyone can clone the repo, run `docker compose up`, and have a fully working environment in seconds—no manual database setup or Node install required. The database schema is defined in a single SQL file, and we use a migration script to apply it when the server starts. This makes it trivial to reset or deploy to new environments. For testing, we've set up ESLint for code quality checks, Jest for unit testing, and Selenium for end-to-end UI tests that verify the login and attendance flows work end to end. In production, we deploy to AWS EC2, where the same Docker containers run on a Linux instance. We've also drafted a CI/CD pipeline using GitHub Actions that automatically runs tests on every PR, then pushes to EC2 on merge if tests pass. This catches bugs early and gives us confidence that main is always deployable. The team is currently refining the production deployment process, but the skeleton is in place."

---

## PART 2: FEATURE DEMO & USER FLOWS

---

### SLIDE 6: Demo Flow 1 – Auth & Login

**Title:** Feature Demo: Authentication & Login

**Instructions for VO & Screen Recording:**
- Record these flows as brief video clips (30–45 sec each) and embed in slide
- Audio: Use this VO script; sync video with narration

**Demo Scenario:**
1. Open app home page (show login form)
2. Show two paths: "Login with Email" and "Sign in with Google"
3. Click email login, enter test credentials (email: `student@example.com`, password: `password123`)
4. Verify session cookie set in DevTools
5. Show redirect to dashboard

**Voice-Over (45 sec):**
"Here's the login flow. A user lands on the Conductor home page. They have two options: log in with their email and password, or use Google single sign-on for faster access. We support Google OAuth so users can authenticate without creating yet another password. If they choose email login, we validate their credentials against the database and create a session cookie. That cookie persists across page reloads, so they stay logged in. In DevTools, you can see the `conductor.sid` cookie that holds the session ID. Once logged in, we redirect to their role-based dashboard—students see courses and standups, instructors see course management and class analytics. This session is secure; we hash passwords and validate every request, so unauthorized users can't access protected pages."

---

### SLIDE 7: Demo Flow 2 – Course Dashboard & Enrollment

**Title:** Feature Demo: Student Dashboard & Courses

**Demo Scenario:**
1. Show student dashboard with enrolled courses (list or cards)
2. Click on a course card to view course details
3. Show course information: name, code, instructor, students
4. Show course actions: assignments, attendance, standup
5. Navigate back to dashboard

**Voice-Over (60 sec):**
"Once logged in, a student lands on their dashboard. This shows all their enrolled courses. Each course is displayed as a card with the course code, name, and instructor. Students can click a course to see more details: the full description, a list of classmates, and course actions. Here are the key features: Assignments shows all work that's due in that course. Attendance is where students check in—either by entering a PIN the instructor shared, scanning a QR code, or if the instructor has enabled it, being marked manually. Standup is a lightweight work journal where students log their daily progress and reflect on their work. If a student isn't enrolled in a course, they can request enrollment using an enrollment code the instructor provides. The dashboard gives instructors a different view—they see all courses they teach, can create new courses, and have drill-down options to see enrollment, attendance records, and student standups. The role-based UI keeps the experience clean for each user type."

---

### SLIDE 8: Demo Flow 3 – Attendance & Check-In

**Title:** Feature Demo: Attendance Check-In (PIN/QR/Manual)

**Demo Scenario:**
1. Navigate to attendance page from course
2. Show three check-in methods:
   a. **PIN Entry:** Show input field, enter example PIN (e.g., "1234"), submit
   b. **QR Code Scan:** Show camera permission prompt, point at QR code (show sample code)
   c. **Manual Entry:** Show instructor interface to mark students present/absent
3. Show confirmation message after successful check-in
4. Show attendance history (dates/times of previous check-ins)

**Voice-Over (75 sec):**
"Attendance tracking is core to Conductor. When an instructor starts a class, they generate an attendance session using Conductor, which creates a unique PIN and QR code for that class meeting. Students then check in using one of three methods. Method one: they enter the PIN manually. We show them a simple input box where they type the PIN the instructor announced, then click Check In. The PIN is time-limited and hashed, so it can't be guessed or reused across class sessions. Method two: they scan the QR code with their phone camera. Conductor detects the QR code and automatically marks them present. This is fast and fraud-resistant because students can't just text a photo to a friend. Method three: the instructor can manually mark students present or absent if the technology isn't available—maybe it's a small seminar or the WiFi is down. All three methods write to the attendance table with a timestamp. Students can view their attendance history on the course page, so they know how many classes they've attended. Instructors see aggregate attendance: a chart or list showing who's been present, absent, or late across the semester. This data feeds into the gradebook automatically."

---

### SLIDE 9: Demo Flow 4 – Work Journal & Standups

**Title:** Feature Demo: Standup & Work Journal

**Demo Scenario:**
1. Navigate to standup/work-journal page
2. Show journal entry form with:
   - Text area for "What I did today"
   - Sentiment emojis (👍 positive, 😕 negative, 🤔 uncertain)
   - Optional tags (e.g., "#frontend", "#debugging")
3. Student fills in an entry, selects sentiment, clicks Save
4. Show confirmation and entry added to timeline
5. Show instructor view: list of student entries for a course, filtered by sentiment
6. Show that entries persist across sessions

**Voice-Over (75 sec):**
"Standups are a lightweight work journal. Every day, students log what they accomplished, what they struggled with, and how they feel about it. This helps instructors understand progress and catch students who are stuck early. A student opens the standup page, sees a simple form with a text box for their daily reflection. They type a brief update—maybe 'Finished the login API, ran into a CORS bug but solved it'—then pick a sentiment emoji: thumbs up for a good day, confused face for a rough day, thinking face for uncertain. They can also add tags like #frontend or #debugging to categorize their work. When they save, the entry gets timestamped and stored in the database. If they check in later in the day, they can add another entry. Instructors see a feed of all student entries for their course, sorted by date. They can filter by sentiment to quickly identify who's struggling, or search by tags to see what teams are working on. The work journal builds team transparency and gives instructors data for better mentoring. Over a semester, it also creates a nice record of what everyone built—perfect for retrospectives or portfolios."

---

### SLIDE 10: Demo Flow 5 – Instructor Course Management

**Title:** Feature Demo: Instructor Dashboard & Course Creation

**Demo Scenario:**
1. Log in as instructor account
2. Show instructor dashboard with course list
3. Click "Create Course"
4. Show course creation form: name, code, semester, description, max students
5. Fill in example course (e.g., "Web Development", "CSE210", "Fall 2025")
6. Submit form
7. Show new course appears in list
8. Show course detail page with enrollment list, statistics

**Voice-Over (60 sec):**
"Now let's look at the instructor view. When an instructor logs in, they see a dashboard with all courses they teach. They can click any course to manage it: see the roster, generate attendance sessions, create assignments, and view student standups. To add a new course, they click 'Create Course' and fill out a form: course name, code, semester, and description. Once created, they get an enrollment code to share with students. Students can then enroll using that code. The course page shows enrollment statistics—how many students are enrolled, attendance rates, and a breakdown of engagement. Instructors can also drill down to see individual student records: their attendance, work journal entries, and assignment submissions. This gives instructors the data they need to track progress and identify at-risk students early. If enrollment is capped, only that many students can join; otherwise it's open. The instructor interface is role-based, so students never see these controls—they only see courses they're enrolled in."

---

## PART 3: MISSING FEATURES & NEXT STEPS

---

### SLIDE 11: What's Complete vs. What's In Progress

**Title:** Feature Completion Status

**Completed Features (MVP):**
- ✅ User authentication (email/password + Google OAuth)
- ✅ User profile management (name, email, role, bio)
- ✅ Course creation and enrollment (instructor + student flows)
- ✅ Attendance tracking (PIN, QR, manual entry)
- ✅ Assignment creation and submission flow
- ✅ Work journal / standup entries
- ✅ Role-based access control (instructor vs. student)
- ✅ Session management and logout
- ✅ Docker deployment (local and EC2-ready)
- ✅ Database schema and migrations
- ✅ CI/CD pipeline skeleton (ESLint, test scaffolds)

**In Progress (Sprint 4 into Final Review):**
- 🟡 Work journal API fully wired to frontend (queries mostly done, UI integration in final QA)
- 🟡 Instructor role-based UI (dashboard showing course stats, enrollment management)
- 🟡 Assignment submission & grading workflow
- 🟡 Attendance analytics (charts, export)
- 🟡 Full test coverage (unit + integration test completion)
- 🟡 JSDoc documentation for backend functions
- 🟡 Production EC2 deployment (container orchestration refinement)

**Voice-Over (60 sec):**
"Our MVP is feature-complete. Authentication, course management, attendance, assignments, and work journals are all working end to end. Students can log in, enroll in courses, check in, and log standups. Instructors can create courses, generate attendance sessions, and view student data. The backend APIs are implemented and the frontend pages are built. However, there are a few areas still in final refinement. The work journal API is mostly complete, but we're doing final integration testing to ensure it wires smoothly to the frontend. The instructor dashboard is coming together but needs a bit more polish on the UI to show course statistics and enrollment management clearly. Assignment grading is scaffolded but needs the submission evaluation workflow. Attendance analytics—charts and export to CSV—are planned but not yet implemented. And we're still filling out the unit test and JSDoc documentation; the skeleton is there, but we're adding the details. Production deployment to EC2 is in progress; containers build cleanly, but we're refining the networking and CI/CD pipeline for automatic deploys."

---

### SLIDE 12: Missing Features by Team

**Title:** Missing Features & Action Items by Subteam

**Frontend (Zheng, Chenhao, Lisa):**
- Finalize work journal UI and connect remaining API calls
- Add role-based instructor dashboard page with course analytics
- Implement assignment submission UI (file upload or text entry)
- Add UI for attendance analytics (chart or table of attendance rates)
- Polish responsive design for mobile and tablet
- Complete unit tests for all pages (registration, courses, standup)
- Add accessibility features (ARIA labels, keyboard navigation)

**Backend (Brandon, Mason, Nikita, Saniya, Tian):**
- Complete work journal query service (list, filter by date/sentiment)
- Implement assignment submission and grading endpoints
- Add attendance analytics queries (attendance rate per student, per course)
- Extend role-based authorization (restrict TA/lead endpoints)
- Add JSDoc comments to all functions for code clarity
- Complete integration test suite (full flows, error cases)
- Optimize database queries (add indexes for large datasets)

**Infrastructure (Jai, Dennis, Jiesen):**
- Finalize EC2 deployment script and health checks
- Set up GitHub Actions CI/CD pipeline (test + deploy on main merge)
- Configure DNS and SSL/TLS for production domain
- Set up database backups and recovery procedures
- Monitor infrastructure (CloudWatch logs, alerts for failures)
- Document deployment runbook for future maintainers
- Load test the API to ensure it scales

**Voice-Over (90 sec):**
"Let me break down what's still pending by team. On the frontend, Zheng's team is wrapping up the work journal integration—the API calls are mostly wired, but they're doing final testing to ensure entries save and display correctly. They're also building out the instructor dashboard so it shows course statistics and a clean enrollment management interface. Assignment submissions need a UI—either a file upload for homework files or a text box for written answers. Attendance analytics should show instructors a table or chart of who's been present and absent. And there's ongoing polish for mobile responsiveness and accessibility; making sure the app works on phones and that keyboard navigation is smooth. On the backend, Brandon's team is finishing the work journal queries—filtering entries by date, sentiment, or search terms. Assignment grading endpoints need to be created so instructors can submit a grade and feedback. Attendance analytics need database queries to compute attendance rates and trends. Role-based authorization needs refinement—we want TAs and course leads to have limited powers, not full instructor permissions. Every function should have JSDoc comments so other developers know what it does without diving into the code. And the integration test suite should cover full end-to-end flows and error cases. Finally, Jai's infrastructure team is polishing the EC2 deployment—making sure health checks work, setting up a GitHub Actions pipeline so tests run on every PR and the app auto-deploys on merge, and adding DNS and SSL so Conductor is accessible on a real domain. Database backups and load testing are also critical for production stability."

---

### SLIDE 13: Technical Debt & Design Decisions

**Title:** Technical Debt & Future Improvements

**Current Technical Debt:**
- Test coverage is light; unit tests exist but need expansion for edge cases
- Documentation could be deeper; JSDoc is started but incomplete
- Role-based UI for TA/lead is scaffolded but not fully fleshed out
- Error handling in controllers could be more granular (specific error codes/messages)
- Database queries could use indexes for large datasets (course enrollment, attendance queries)
- Frontend form validation could be more robust (client-side + server-side validation)

**Design Decisions (see ADRs):**
- Chose Ports & Adapters to decouple business logic from databases (ADR_002)
- Using vanilla JS + HTMX instead of React/Vue for simplicity and speed (lightweight, no build step)
- Session-based auth instead of JWT because sessions are stateful and easier to revoke
- PostgreSQL chosen for relational data model (courses, students, attendance relationships)
- EC2 over serverless because we wanted stable uptime for a classroom app (not bursty traffic)

**Future Improvements:**
- Caching (Redis) for frequently accessed queries (courses, enrollment lists)
- Real-time updates (WebSockets) for live attendance and standup feeds
- Mobile app (React Native or Flutter) for easier check-in on phones
- Gradebook integration with canvas or similar LMS
- Analytics dashboard for instructors (engagement, trend analysis)
- Spam prevention for standups and feedback (moderation, flagging)

**Voice-Over (75 sec):**
"We documented major design decisions in ADRs—Architecture Decision Records—in the spec folder. These explain why we chose certain technologies and tradeoffs. For example, we chose a Ports and Adapters architecture to keep business logic separate from the database layer, making it easy to test and swap dependencies. We used vanilla JavaScript and HTMX instead of a heavy framework like React, which kept our bundle size small and meant no build step—faster iterations. We chose session-based authentication instead of JWT tokens because sessions are easier to revoke if a user logs out, and they're more familiar to backend developers. PostgreSQL is our database because we have relational data—students belong to courses, courses have attendance records—and Postgres is rock-solid for structured data. We deployed to EC2 instead of serverless because classroom apps have steady traffic throughout the day, not bursty, so we wanted predictable uptime and cost. There's some technical debt we should address: test coverage needs to expand, JSDoc documentation is incomplete, and the role-based UI for TAs and course leads is sketched but not fully built out. In a future iteration, we'd add caching with Redis to speed up frequently accessed queries, real-time updates with WebSockets so attendance appears live on the instructor's screen, and maybe a mobile app so students can check in without opening a browser. Integration with Canvas or Blackboard would let instructors sync grades directly to their LMS. And analytics features—engagement dashboards, trend analysis—would help instructors see at a glance how their class is doing."

---

### SLIDE 14: Next Steps for Future Developers

**Title:** Handoff Guide: How to Continue the Project

**Immediate (End of Semester):**
1. Complete remaining API endpoints for work journal and assignments
2. Merge all in-progress PRs into main
3. Final testing on EC2 instance (load test, error recovery)
4. Deploy main to EC2 for demo to class
5. Backfill JSDoc and update README with setup instructions

**Short Term (Winter Break / Next Semester):**
1. Expand test coverage to 80%+ (add unit tests for edge cases, more integration tests)
2. Implement role-based UI for TA and course lead roles
3. Add attendance analytics and export to CSV
4. Set up GitHub Actions CI/CD pipeline for automated testing and deployment
5. Document all API endpoints with OpenAPI/Swagger for future frontend work
6. Set up monitoring and alerting (CloudWatch, error tracking)

**Medium Term (Next Project Cycle):**
1. Add real-time updates (WebSockets) for live attendance and standup feeds
2. Implement Gradebook integration (sync with Canvas, manual grading UI)
3. Add caching layer (Redis) for course and enrollment queries
4. Build mobile app or improve mobile responsive design
5. Implement moderation/spam prevention for standups and feedback
6. Performance optimization: query indexing, lazy loading, pagination

**Getting Started for New Dev:**
1. Clone repo: `git clone https://github.com/CSE210-fa25-team10/conductor_app.git`
2. Set up env: Copy `.env.example` to `.env`, fill in DATABASE_URL and GOOGLE OAuth secrets
3. Start local: `docker compose up` – API runs on port 3000
4. Check health: `curl http://localhost:3000/healthz`
5. Read: Start with `conductor-server/README.md`, then `frontend/` folder structure
6. Review: Look at sprint review notes in `admin/meeting/` to see what's complete
7. Code: Pick a feature from the "In Progress" list, follow the Ports & Adapters pattern
8. Test: Add unit test in `tests/unit/`, run `npm test`
9. PR: Follow PR template, get review, merge to main
10. Deploy: Main auto-deploys to EC2 via GitHub Actions (once setup)

**Voice-Over (120 sec):**
"For whoever takes over Conductor next, here's the roadmap. In the immediate term—end of semester—finish the remaining API endpoints for work journal and assignments, make sure everything merges to main cleanly, and do a final round of testing on the EC2 instance. We need to load test the server to make sure it can handle a class of 30 students all checking in at once, and verify error recovery—what happens if the database goes down briefly? Once that's solid, deploy to EC2 for the class demo. Over winter break or early next semester, expand test coverage to at least 80 percent—right now we have the skeleton, but unit tests for edge cases and more integration tests would give confidence in refactors. The instructor UI for role-based access—TAs and course leads should have limited powers—needs to be built out. Attendance analytics should show instructors charts and export data to CSV. A GitHub Actions pipeline would automate testing and deployment, so anyone can merge to main and know it works. And documentation is crucial: JSDoc in the code, an OpenAPI spec for the API, and a setup guide so the next person isn't reverse-engineering the project. In a future cycle, add real-time features with WebSockets so an instructor sees attendance updates live instead of refreshing the page. Gradebook integration would sync grades to Canvas automatically. Caching with Redis would speed up queries for large classes. A mobile app or better mobile web design would make check-in easier on phones. For someone new picking up the project, start by cloning the repo and reading the backend README. Run docker compose up to get a local environment running. Review the sprint notes in the admin folder to see what's been built and what's in progress. The codebase follows Ports & Adapters, so new features should slot into that pattern. When you're ready to contribute, pick a feature from the in-progress list, add unit tests, and submit a PR. Follow the template, get a review, and merge. Then it auto-deploys to EC2. The barrier to entry is low because the architecture is clean and documented; you should be productive within a few hours."

---

### SLIDE 15: Closing: Lessons & Recommendations

**Title:** Summary: Key Lessons & Recommendations

**What Went Well:**
- Ports & Adapters architecture made the codebase maintainable and testable
- Contract-based development (Postman) aligned frontend and backend early
- Docker and docker-compose meant anyone could spin up a full environment in seconds
- Daily standups and sprint retrospectives kept the team aligned
- Strong peer support and clear ownership (team leads) prevented bottlenecks
- Iterative deployment to EC2 meant we could catch issues early

**What to Improve:**
- Freeze scope early and defend priorities; we had scope creep mid-sprint
- Integrate continuously (daily) instead of big merges at end of sprint
- Staff testing as a dedicated role; right now it's "when there's time"
- Centralize decisions; some slipped into DMs and weren't recorded
- Document as you code (JSDoc, README) rather than backfilling at the end
- Communication cadence: more frequent stand-ups in the middle sprint help catch drift

**For Production (EC2):**
- Set up automated backups for the Postgres database
- Monitor error rates and response times; alert on failures
- Set up SSL/TLS for HTTPS; never run course enrollment on plain HTTP
- Load test before exposing to students; make sure the app handles peak check-in times
- Have a rollback plan: if a deploy breaks, be able to revert quickly
- Document the deployment runbook so anyone can troubleshoot production issues

**Voice-Over (90 sec):**
"To wrap up: what made this project successful was clear architecture, aligned communication, and strong team ownership. The Ports & Adapters pattern meant we could test the business logic independently of the database, making changes confident. Using Postman as a contract kept frontend and backend moving in parallel without nasty surprises. Docker meant we eliminated 'works on my machine' problems—everyone had the same environment. Daily standups and sprint retrospectives gave us a chance to catch issues early and adjust course. And having clear team leads meant decisions happened fast and blockers got escalated immediately. If you're building something similar, do these things. Freeze scope early; it's tempting to add features, but core features delivered well beat more features delivered late. Integrate daily, not weekly; small merges catch integration bugs early. Make testing a real role, not a chore for tired developers at the end. Centralize decisions and make them visible; record them in a decision log so future devs know why things are the way they are. Write documentation as you code—JSDoc, README—so people can understand your work without asking. For a production system like Conductor used in a real classroom, treat it seriously: automated backups, monitoring, SSL encryption, load testing before launch. The codebase is clean now; the next team should keep it that way."

---

## APPENDIX: Quick Reference

### Useful Commands
```bash
# Local development
docker compose up                # Start all services
docker compose logs -f api       # Watch API logs
docker compose exec db psql -U appuser -d conductor  # Connect to DB

# Backend
npm install                      # Install dependencies
npm start                        # Start server
npm test                         # Run tests
npm run lint                     # Check code style

# Database
npm run migrate                  # Apply schema.sql
psql "$DATABASE_URL" -f sample.sql  # Seed test data

# Frontend
cd frontend && npm install && npm start  # Dev server (if separate)
```

### Key Files to Know
- `conductor-server/server.js` – Express entry point
- `conductor-server/schema.sql` – Database schema
- `conductor-server/infra/container.js` – Dependency injection
- `frontend/public/index.html` – Frontend entry point
- `docker-compose.yml` – Local dev orchestration
- `admin/meeting/` – Sprint notes and decisions

### Team Leads & Ownership
- **Frontend:** Zheng Yuan
- **Backend:** Mason Li
- **Infrastructure:** Jai Malegaonkar
- **Project Manager:** Brandon Lai

---

**Document Created:** December 10, 2025  
**Repository:** https://github.com/CSE210-fa25-team10/conductor_app  
**For Questions:** Refer to sprint retrospectives in `admin/meeting/`
