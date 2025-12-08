import { Router } from 'express';

// import { requireAuth } from '../../../middleware/auth.js'; // real auth later

export function makeCourseRouter({ courseController }) {
  const router = Router();

  // TEMP: disable auth while testing (same pattern as attendanceRoutes)
  function requireAuth(_req, _res, next) {
    return next();
  }

  // 1. Instructor: create a course
  //    - also associates creating user with course as role='instructor'
  router.post('/', requireAuth, (req, res, next) => courseController.create(req, res, next));

  // 2. Student: join/enroll in a course
  //    - adds row to course_users as role='student'
  router.post('/:courseId/join', requireAuth, (req, res, next) =>
    courseController.join(req, res, next)
  );

  // 3. Logged-in user: list all their courses (+ role)
  router.get('/me', requireAuth, (req, res, next) => courseController.myCourses(req, res, next));

  return router;
}
