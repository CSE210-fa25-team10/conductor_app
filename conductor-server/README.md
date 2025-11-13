# Conductor Server

A lightweight Node.js + Express 5.1.0 backend for the Conductor Tool project, built with Hexagonal Architecture (Ports and Adapters pattern).

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Run the Server

```bash
npm start
```

The server will start at:
```
http://localhost:3000
```

You should see:
```
✅ Express 5.1.0 server running on Node.js v24.11.0 LTS
```

### 3. Database Migration

```bash
npm run migrate
```

This will apply the database schema defined in `schema.sql`.

### 4. Run Tests

```bash
# Run all tests (watch mode)
npm test

# Run tests once
npm run test:run

# Generate coverage report
npm run test:coverage
```

For detailed testing instructions, see [HOW_TO_TEST.md](./HOW_TO_TEST.md).

---

## 🏗️ Architecture

### Hexagonal Architecture (Ports and Adapters)

The project uses **Hexagonal Architecture** (also known as Ports and Adapters pattern) for better separation of concerns and testability.

**Architecture Layers**:
- **Domain Layer**: Core business entities and port interfaces
- **Application Layer**: Use case logic and DTO transformations
- **Adapters Layer**: 
  - **Inbound**: HTTP routes and controllers
  - **Outbound**: Database repository implementations

**Key Directories**:
- `domain/entities/` - Domain entities (User, Course, Activity)
- `domain/ports/` - Port interface definitions (ClassQueryPort)
- `app/usecases/` - Use case implementations (searchUsers)
- `app/dto/` - Data Transfer Object converters
- `adapters/in/routes/` - HTTP route adapters
- `adapters/out/db/` - Database adapters

---

## 🎯 Core Features

### 1. Authentication System

**Google OAuth 2.0 Integration**
- Complete Google login flow
- Automatic user registration (creates user record on first login)
- Express Session for user session management
- Automatically saves user avatar, name, and email to database

**Related Files**:
- `services/authService.js` - OAuth service logic
- `controllers/authController.js` - Authentication controller
- `adapters/in/routes/authRoutes.js` - Authentication routes

**Features**:
- `/api/auth/login` - Initiate Google login
- `/api/auth/google/callback` - OAuth callback handler
- `/api/auth/logout` - User logout
- Session persistence (using express-session)

### 2. Domain Entities

**User Entity** (`domain/entities/User.js`)
- User ID, name, pronunciation, pronouns
- Profile photo, email, Slack, phone
- Availability information

**Course Entity** (`domain/entities/Course.js`)
- Course ID
- Extensible course information structure

**Activity Entity** (`domain/entities/Activity.js`)
- Activity ID, course ID, name
- Timestamp, activity type (lecture, oh, etc.)

### 3. DTO Conversion Layer

Three DTO converters for transforming domain entities to API response format:
- `app/dto/userToDTO.js` - User DTO conversion
- `app/dto/courseToDTO.js` - Course DTO conversion
- `app/dto/activityToDTO.js` - Activity DTO conversion

### 4. Use Cases

**searchUsers Use Case** (`app/usecases/searchUsers.js`)
- User search functionality
- Supports filtering and result limiting
- Uses dependency injection pattern, accesses data through port interfaces

### 5. Database Repository

**PgClassRepository** (`adapters/out/db/PgClassRepository.js`)
- Implements ClassQueryPort interface
- Uses SQL files for query storage
- Supports parameterized queries to prevent SQL injection

---

## 🌐 API Endpoints

### Authentication
- `GET /api/auth/login` - Initiate Google login
- `GET /api/auth/google/callback` - OAuth callback
- `GET /api/auth/logout` - Logout

### User Management
- `GET /users` - Get all users
  - Returns: user_id, name, email

### Course Management
- `GET /courses` - Get all courses
  - Returns: course_id
- `GET /courses/:id/roster` - Get course roster
  - Returns: User information and roles (student/instructor)

### Activity Management
- `GET /activities` - Get activities list
  - Query params: `course_id` (optional, for filtering)
  - Returns: activity_id, course_id, name, starts_at, type

### Attendance Management
- `POST /attendance` - Record/update attendance
  - Request body: `{ activity_id, user_id, present }`
  - Supports UPSERT operation (update if exists, insert if not)

### Health Checks
- `GET /health` - Server and database health check
- `GET /healthz` - Container health check endpoint
- `GET /db-check` - Database connection check

---

## 🗄️ Database Design

### Core Tables

**users**
- user_id (SERIAL PRIMARY KEY)
- name, pronunciation, pronouns
- profile_photo (BYTEA)
- email, slack, phone
- availability

**courses**
- course_id (SERIAL PRIMARY KEY)

**activities**
- activity_id (SERIAL PRIMARY KEY)
- course_id (foreign key)
- name, starts_at (TIMESTAMPTZ)
- type (lecture, oh, etc.)
- Unique index: course_id + name + minute-level timestamp

**course_users** (many-to-many relationship)
- user_id, course_id
- role (student/instructor)
- Composite primary key

**attendance**
- user_id, activity_id
- present (BOOLEAN)
- Composite primary key

**Other Tables**:
- groups (teams)
- group_users (team membership)
- course_groups (course-team associations)
- standup_entries (standup meeting records)

### Database Migration

- `scripts/migrate.js` - Database migration script
- `schema.sql` - Complete database schema definition
- Supports automatic migration and rollback

---

## 🛠️ Tech Stack

### Runtime Environment
- **Node.js**: v24.11.0 (LTS)
- **Express**: v5.1.0
- **PostgreSQL**: 16 (via Docker)

### Core Dependencies
- `express` - Web framework
- `express-session` - Session management
- `google-auth-library` - Google OAuth authentication
- `pg` - PostgreSQL client
- `dotenv` - Environment variable management

### Development Tools
- Docker & Docker Compose - Containerized deployment
- ES Modules - ES6 module system
- Vitest - Testing framework

---

## 📁 Project Structure

```
conductor-server/
├── adapters/              # Adapter layer
│   ├── in/               # Inbound adapters
│   │   └── routes/       # HTTP routes
│   │       ├── apiRoutes.js
│   │       ├── authRoutes.js
│   │       └── responseMapper.js
│   └── out/              # Outbound adapters
│       └── db/           # Database adapters
│           ├── PgClassRepository.js
│           ├── rowMapper.js
│           └── sql/
│               └── searchUsers.sql
├── app/                  # Application layer
│   ├── dto/              # Data Transfer Objects
│   │   ├── userToDTO.js
│   │   ├── courseToDTO.js
│   │   └── activityToDTO.js
│   ├── errors.js         # Error definitions
│   └── usecases/         # Use case implementations
│       └── searchUsers.js
├── controllers/          # Controllers
│   └── authController.js
├── domain/               # Domain layer
│   ├── entities/         # Domain entities
│   │   ├── User.js
│   │   ├── Course.js
│   │   └── Activity.js
│   └── ports/            # Port interfaces
│       └── ClassQueryPort.js
├── services/             # Service layer
│   └── authService.js
├── scripts/              # Scripts
│   └── migrate.js
├── tests/                # Test files
│   ├── domain/
│   ├── app/
│   ├── controllers/
│   ├── services/
│   └── adapters/
├── infra/                # Infrastructure
│   └── README.txt
├── db.js                 # Database connection pool
├── server.js             # Server entry point
├── schema.sql            # Database schema
├── Dockerfile            # Docker image definition
├── vitest.config.js      # Test configuration
├── package.json
└── README.md
```

---

## 🔍 Code Quality & Design Patterns

### Design Patterns

1. **Dependency Injection (DI)**: Use cases receive dependencies through port interfaces
2. **Repository Pattern**: PgClassRepository encapsulates database access
3. **DTO Pattern**: Separates domain models from API response formats
4. **Ports and Adapters**: Clear boundary definitions

### Code Organization Principles

- **Separation of Concerns**: Each layer has clear responsibilities
- **Dependency Inversion**: Domain layer doesn't depend on infrastructure
- **Single Responsibility**: Each module does one thing
- **Testability**: Easy to mock and test through interfaces

---

## 🚀 Deployment & Operations

### Docker Support

- **Dockerfile**: Production image based on Node 24-slim
- **docker-compose.yml**: Includes API and PostgreSQL services
- Health check configuration
- Environment variable support

### Environment Variables

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `SESSION_SECRET` - Session encryption secret
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode

---

## ⚠️ Important Notes

1. **Database Connection**: Ensure PostgreSQL service is running and DATABASE_URL is correctly configured
2. **OAuth Configuration**: Google OAuth requires correct callback URL configuration
3. **Session Security**: Production environment must use a strong SESSION_SECRET
4. **Error Handling**: Some endpoints may need enhanced error handling mechanisms
5. **API Documentation**: Consider adding Swagger/OpenAPI documentation

---

## 📊 Areas for Improvement

Based on code analysis, the following areas may need further development:

1. **User Search Use Case**: searchUsers use case is implemented but routing may not be fully integrated
2. **Response Mapper**: responseMapper.js file is empty, may need implementation
3. **Row Mapper**: rowMapper.js file is empty, may need implementation
4. **Error Handling**: errors.js file is empty, needs standard error type definitions
5. **More Use Cases**: Currently only searchUsers use case exists, other business logic may need to be added

---

## 📚 Documentation

- [HOW_TO_TEST.md](./HOW_TO_TEST.md) - Detailed testing guide
- [tests/README.md](./tests/README.md) - Test directory documentation
- `schema.sql` - Database schema definition
- `infra/README.txt` - Infrastructure notes

---

## 📝 Recent Development History

Key development milestones:

1. **Hexagonal Architecture Refactoring** - Reorganized from MVC to Hexagonal Architecture
2. **Google OAuth Integration** - Complete authentication system
3. **Docker Setup** - Containerized deployment configuration
4. **Domain Entities** - User, Course, and Activity entities with DTOs
5. **Test Suite** - Comprehensive test coverage for all modules

---

**Last Updated**: 2024-11-27
