import { Router } from 'express';
import { requireAuth } from '../../../middleware/auth.js';

export function makeCourseRouter({ courseController }) {
  const router = Router();

  // 1. Instructor: create a course
  //    Only instructors can create courses
  router.post(
    '/',
    requireAuth('instructor'), // 
    (req, res, next) => courseController.create(req, res, next)
  );

  // 2. Student: join/enroll in a course
  //    Any authenticated user can join
  router.post(
    '/:courseId/join',
    requireAuth(), // 
    (req, res, next) => courseController.join(req, res, next)
  );

  // 3. Logged-in user: list all their courses (+ role)
  router.get(
    '/me',
    requireAuth(), // 
    (req, res, next) => courseController.myCourses(req, res, next)
  );

  return router;
}