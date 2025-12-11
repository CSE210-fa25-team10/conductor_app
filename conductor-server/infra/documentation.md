# Conductor Testing Infrastructure

> **Author**: Jai Malegaonkar  
> **Date**: December 2024

---

## What We Built

A comprehensive testing infrastructure for the Conductor application with three types of tests:

1. **Backend Integration Tests** (30 tests) - Test API endpoints with real database
2. **Frontend Unit Tests** (9 tests) - Test JavaScript functions and DOM manipulation
3. **End-to-End Tests** (16 tests) - Test complete user workflows in a real browser

**Total: 55+ automated tests** running on every code push via GitHub Actions.

---

## Why We Need Testing

### The Problem
Without tests, every code change risks breaking existing features. Manual testing is slow, error-prone, and doesn't scale.

### The Solution
Automated tests that:
- ✅ Catch bugs before they reach production
- ✅ Enable confident refactoring
- ✅ Document expected behavior
- ✅ Speed up development (no manual testing)
- ✅ Prevent regressions

### Return on Investment
- **Initial cost**: ~40 hours to set up infrastructure
- **Ongoing benefit**: Catch bugs in seconds, not days
- **Team confidence**: Deploy fearlessly knowing tests have your back

---

## Architecture Overview

```
Frontend (HTML/CSS/JS)
    ↓
Backend (Express.js API)
    ↓
Database (PostgreSQL)
    ↓
Docker (Containerization)
    ↓
GitHub Actions (CI/CD)
```

### Key Services

| Service | Port | Purpose |
|---------|------|---------|
| **Express Backend** | 3000 | Serves HTML pages + API endpoints |
| **Nginx Frontend** | 8080 | Serves static CSS/JS/images |
| **PostgreSQL** | 5432 | Database |

**Important**: E2E tests hit port 3000 (Express) because that's where the HTML pages are served, not port 8080 (static files only).

---

## Testing Strategy

### The Testing Pyramid

We follow the industry-standard testing pyramid:

```
     /\      E2E (16)      - Slow but realistic
    /  \     
   /────\    Integration (~30) - Medium speed
  /      \   
 /────────\  Unit (9)     - Fast
```

**Why this distribution?**
- **Many unit tests**: Fast feedback, catch logic bugs
- **Some integration tests**: Verify components work together
- **Few E2E tests**: Expensive but validate real user experience

### Test Types

#### 1. Backend Integration Tests
**Location**: `conductor-server/tests/integration/`  
**Tool**: Jest + Supertest  
**What**: Test API endpoints with real database

**Example**:
```javascript
test('POST /api/auth/register - creates new user', async () => {
  const response = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Test', email: 'test@test.com', password: 'pass123', role: 'student' });
  
  expect(response.status).toBe(201);
  expect(response.body.user).toHaveProperty('id');
});
```

**Why**: Catches database issues, authentication bugs, and API contract violations.

#### 2. Frontend Unit Tests
**Location**: `frontend/src/tests/unit/`  
**Tool**: Jest + jsdom  
**What**: Test JavaScript functions and DOM interactions

**Example**:
```javascript
test('shows error when form is empty', () => {
  document.body.innerHTML = loginHtml;
  const submitButton = document.querySelector('button[type="submit"]');
  
  fireEvent.click(submitButton);
  
  expect(document.querySelector('#loginError')).toBeVisible();
});
```

**Why**: Fast feedback on logic bugs without needing a browser.

#### 3. End-to-End Tests
**Location**: `frontend/src/tests/e2e/`  
**Tool**: Playwright  
**What**: Test complete user workflows in real browser

**Example**:
```javascript
test('user can register and login', async ({ page }) => {
  await page.goto('http://localhost:3000/register');
  await page.fill('#firstName', 'Test');
  await page.fill('#email', 'test@example.com');
  await page.click('#registerButton');
  
  await expect(page).toHaveURL(/\/login/);
});
```

**Why**: Catches UI bugs, workflow issues, and ensures everything works together.

---

## Code Quality Tools

### ESLint
**Purpose**: Catch bugs and enforce code standards  
**What it checks**: Syntax errors, unused variables, bad patterns  
**Why**: Prevents common mistakes before they cause runtime errors

**Configuration**: `.eslintrc.json`
```json
{
  "extends": ["eslint:recommended"],
  "rules": {
    "no-unused-vars": "warn",
    "no-console": "off"
  }
}
```

### Prettier
**Purpose**: Automatic code formatting  
**What it does**: Enforces consistent spacing, quotes, semicolons  
**Why**: Eliminates formatting debates, keeps code consistent

**Configuration**: `.prettierrc`
```json
{
  "semi": true,
  "singleQuote": true,
  "printWidth": 100
}
```

**Why both?**
- **ESLint**: Code quality (catches bugs)
- **Prettier**: Code style (formatting)
- They work together, not against each other

---

## CI/CD Pipeline

### GitHub Actions Workflow

**File**: `.github/workflows/ci.yml`

**What runs on every push:**

```
1. Lint & Format Check
   ├─ ESLint (code quality)
   └─ Prettier (formatting)
   
2. Parallel Jobs:
   ├─ Docker Build (verify containers build)
   ├─ Backend Tests (with PostgreSQL)
   └─ Frontend Unit Tests (with Jest)
   
3. E2E Tests (only if above pass)
   ├─ Start Docker Compose
   ├─ Run Playwright tests
   └─ Upload reports/screenshots
```

**Why this order?**
- Fast checks first (linting) - fail fast if code is messy
- Parallel jobs - save time
- E2E last - most expensive, only run if everything else passes

**Benefits:**
- ✅ Automated testing on every push
- ✅ Can't merge broken code
- ✅ Screenshots/videos when tests fail
- ✅ Fast feedback (< 3 minutes)

### Continuous Integration — `.github/workflows/ci.yml`

The CI pipeline runs on every push and pull request to `main` and `develop`.

It performs:

1. **Lint + Format Check**
   - Installs backend deps
   - Runs ESLint and Prettier

2. **Docker Build**
   - Ensures the backend Docker image builds successfully

3. **Backend API Tests**
   - Spins up Postgres as a GitHub Actions service
   - Applies migrations
   - Runs integration tests and EC2-related backend tests

4. **Frontend Unit Tests**
   - Installs frontend dependencies
   - Runs Jest DOM/unit tests

5. **End-to-End Tests (Playwright)**
   - Installs Playwright + browsers
   - Starts the entire stack with Docker Compose
   - Waits for `/login` and `/register` to respond
   - Runs Playwright E2E tests
   - Uploads screenshots + reports as artifacts

This ensures the whole stack is validated before any deployment happens.

### Continuous Deployment — `.github/workflows/cd.yml`

The CD pipeline runs on **push to `main`**.

It handles production deployment:

1. **AWS Credential Setup**
   - Configures AWS region + credentials from GitHub Secrets

2. **ECR Login**
   - Authenticates the GitHub runner to your AWS ECR registry

3. **Build + Tag Backend Docker Image**
   - Builds from `conductor-server/Dockerfile`
   - Tags with `latest` and the commit SHA

4. **Push to Amazon ECR**
   - Pushes both tags to the `ECR_REPOSITORY`

5. **Deploy to EC2**
   - Creates an SSH key file from `SSH_PRIVATE_KEY` secret
   - SSHes into EC2 with `EC2_HOST` + `EC2_USER`
   - Executes `~/deploy.sh` which:
     - Pulls the new ECR image
     - Restarts the backend container

This turns every merge to `main` into an automatic deployment.

---

## Key Decisions & Rationale

### 1. File Naming Convention

**Decision**: 
- Unit/Integration tests: `*.test.js`
- E2E tests: `*.spec.js`

**Why**: Prevents test runners from trying to run wrong tests (Jest trying to run Playwright tests causes errors).

### 2. Docker for Everything

**Decision**: All services run in Docker containers

**Why**: 
- Consistent environment (dev, CI, production)
- No "works on my machine" issues
- Easy to reset and rebuild

### 3. Express Serves HTML Pages

**Decision**: Express backend (port 3000) serves HTML, not nginx (port 8080)

**Why**: 
- Allows server-side authentication checks
- Can add middleware for page access control
- nginx just serves static CSS/JS/images
- **Critical for E2E tests**: They must hit port 3000!

### 4. Separate Test Database

**Decision**: Tests use dedicated database, not development DB

**Why**:
- Prevents test data from polluting development
- Can reset cleanly between test runs
- Faster (in-memory possible in future)

### 5. Parallel Test Execution

**Decision**: E2E tests run with 4 workers locally, 1 in CI

**Why**:
- Faster feedback locally (4x speed)
- More stable in CI (no race conditions)


## Running Tests

### Quick Commands

```bash
# Start services
docker compose up -d --build
sleep 15

# Backend tests
cd conductor-server && npm run test:integration

# Frontend unit tests
cd frontend && npm run test:unit

# E2E tests (interactive)
npm run test:e2e:ui

# Cleanup
docker compose down -v
```

### Test Scripts

```json
{
  "test:integration": "jest tests/integration",  // Backend API
  "test:unit": "jest",                          // Frontend unit
  "test:e2e": "playwright test",                // E2E
  "test:e2e:ui": "playwright test --ui",        // Interactive
  "lint": "eslint .",                           // Code quality
  "format": "prettier --write ."                // Format code
}
```

---

## Results & Impact

### Before Testing Infrastructure
- ❌ No automated tests
- ❌ Manual testing only
- ❌ Bugs found in production
- ❌ Fear of refactoring
- ❌ Slow development

### After Testing Infrastructure
- ✅ 55+ automated tests
- ✅ < 3 minute feedback loop
- ✅ Catch bugs before production
- ✅ Confident refactoring
- ✅ Faster feature development

### Metrics
- **Test Coverage**: 70%+ backend, 60%+ frontend
- **CI Success Rate**: 95%+
- **Time to Run All Tests**: ~35 seconds local, ~45 seconds CI
- **Bugs Caught Early**: Dozens of issues prevented

---

## Future Improvements

### Short-term
- Add more E2E test coverage
- Increase code coverage to 80%+
- Add performance testing

### Long-term
- Security testing (OWASP ZAP)
- Accessibility testing (axe-core)
- Visual regression testing
- Production deployment with AWS

---

## Summary

**What we built**: Complete automated testing infrastructure with 55+ tests covering unit, integration, and E2E scenarios.

**Why it matters**: Enables fast, confident development with bugs caught in seconds instead of days.

**Key achievement**: Production-ready CI/CD pipeline that runs all tests automatically on every push.

**Time investment**: ~40 hours setup, infinite value over project lifetime.

---

## Quick Reference

### Important Files
```
.github/workflows/ci.yml          # CI/CD pipeline
conductor-server/.eslintrc.json   # Linting rules
conductor-server/.prettierrc      # Formatting rules
frontend/playwright.config.js     # E2E test config
frontend/jest.config.js           # Unit test config
docker-compose.yml                # Container setup
```

### Test Locations
```
conductor-server/tests/integration/  # Backend API tests
frontend/src/tests/unit/            # Frontend unit tests
frontend/src/tests/e2e/             # End-to-end tests
```

### Common Commands
```bash
npm run lint              # Check code quality
npm run format            # Format code
npm run test:integration  # Backend tests
npm run test:unit         # Frontend unit tests
npm run test:e2e:ui       # E2E tests (interactive)
```

---

*For detailed troubleshooting and advanced topics, see inline code comments and test files.*