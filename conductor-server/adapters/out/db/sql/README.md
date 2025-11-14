# SQL Queries

This directory contains SQL query files that can be called from the frontend through the API.

## Available Queries

### User Queries
- `getUsers.sql` - Get all users
- `getUserById.sql` - Get a specific user by ID
- `getUserCourses.sql` - Get all courses for a user
- `getUserAttendance.sql` - Get attendance records for a user

### Course Queries
- `getCourses.sql` - Get all courses
- `getCourseRoster.sql` - Get roster (users) for a course
- `getCourseActivities.sql` - Get activities for a course

### Activity Queries
- `getActivities.sql` - Get all activities (optionally filtered by course_id)

### Attendance Queries
- `createAttendance.sql` - Create or update an attendance record

## API Endpoints

All queries are accessible through the `/api/queries` endpoints:

- `GET /api/queries/users` - Get all users
- `GET /api/queries/users/:id` - Get user by ID
- `GET /api/queries/users/:id/courses` - Get courses for a user
- `GET /api/queries/users/:id/attendance?course_id=123` - Get attendance for a user (optional course filter)
- `GET /api/queries/courses` - Get all courses
- `GET /api/queries/courses/:id/roster` - Get course roster
- `GET /api/queries/courses/:id/activities` - Get activities for a course
- `GET /api/queries/activities?course_id=123` - Get activities (optional course filter)
- `POST /api/queries/attendance` - Create/update attendance

## Adding New Queries

1. Create a new `.sql` file in this directory
2. Use parameterized queries with `$1`, `$2`, etc. for parameters
3. Add a corresponding route in `adapters/in/routes/queryRoutes.js`
4. The query will be automatically loaded and cached

## Example Usage from Frontend

```javascript
// Get all users
const users = await fetch('/api/queries/users').then(r => r.json());

// Get courses for a user
const courses = await fetch('/api/queries/users/123/courses').then(r => r.json());

// Get activities for a course
const activities = await fetch('/api/queries/courses/456/activities').then(r => r.json());

// Create attendance record
const attendance = await fetch('/api/queries/attendance', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    activity_id: 789,
    user_id: 123,
    present: true
  })
}).then(r => r.json());
```

