# API Endpoints Summary

All endpoints requested by the frontend team have been implemented.

## ✅ All Required Endpoints

### Authentication

- ✅ `POST /api/login` - Login with email and password
- ✅ `POST /api/register` - Register a new user

### User

- ✅ `GET /api/user` - Get user info (instructor+student)
- ✅ `POST /api/user` - Edit user info (instructor+student)

### Course

- ✅ `POST /api/course` - Create course (instructor)
- ✅ `GET /api/course` - Get course (instructor+student) - requires `course_id` query param
- ✅ `GET /api/courses` - Get courses info (instructor+student) - for dashboard, optional `user_id` query param

### Attendance

- ✅ `POST /api/attendance` - Create attendance (instructor)
- ✅ `GET /api/attendance` - Get attendance (instructor+student) - optional `course_id` and `user_id` query params

### Assignment

- ✅ `POST /api/assignment` - Create assignment (instructor)
- ✅ `GET /api/assignment` - Get assignment (instructor+student) - optional `course_id` query param

## Dashboard Endpoints

The dashboard page needs these 3 APIs:

- ✅ `GET /api/user` - Get user info
- ✅ `POST /api/user` - Edit user info
- ✅ `GET /api/courses` - Get courses info (with optional `user_id` to filter by user)

## Course Detail Page Endpoints

The course detail page needs these 4 APIs:

- ✅ `POST /api/attendance` - Create attendance (instructor)
- ✅ `GET /api/attendance` - Get attendance (instructor+student)
- ✅ `POST /api/assignment` - Create assignment (instructor)
- ✅ `GET /api/assignment` - Get assignment (instructor+student)

## Implementation Details

All endpoints are implemented in:

- `conductor-server/adapters/in/routes/frontendRoutes.js`

All SQL queries are in:

- `conductor-server/adapters/out/db/sql/`

The schema has been updated to include:

- `password` and `token_response` fields in `users` table
- `name`, `code`, `semester`, `description` fields in `courses` table
- New `assignments` table

## Next Steps

1. Run database migration to apply schema changes:

   ```bash
   npm run migrate
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. All endpoints are ready to use!
