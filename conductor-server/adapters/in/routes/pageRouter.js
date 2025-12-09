import { Router } from 'express';
import path from 'node:path';
import { requireAuth } from '../../../middleware/auth.js';

export function makePageRouter() {
  const router = Router();

  router.get('/', (req, res) => res.redirect('/login'));

  router.get('/login', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'frontend/src/pages/auth/login.html'));
  });

  router.get('/register', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'frontend/src/pages/auth/register.html'));
  });

  /**
   * ===== INSTRUCTOR ROUTES =====
   */

  router.get('/instructor', requireAuth('instructor'), (req, res) => {
    res.sendFile(path.join(process.cwd(), 'frontend/src/pages/instructor/dashboard.html'));
  });

  // Instructor Course Detail View (Fixed)
  router.get('/instructor/courses/:courseId', requireAuth('instructor'), (req, res) => {
    res.sendFile(path.join(process.cwd(), 'frontend/src/pages/instructor/courses.html'));
  });

  // Instructor: Mark Class Attendance Manually (New Route)
  router.get('/instructor/courses/:courseId/manual', requireAuth('instructor'), (req, res) => {
    res.sendFile(path.join(process.cwd(), 'frontend/src/pages/instructor/team_attendance.html'));
  });

  // Instructor: View Class Attendance Overview
  router.get('/instructor/courses/:courseId/overview', requireAuth('instructor'), (req, res) => {
    res.sendFile(
      path.join(process.cwd(), 'frontend/src/pages/instructor/attendance_overview.html')
    );
  });

  router.get('/instructor/attendance', requireAuth('instructor'), (req, res) => {
    res.sendFile(path.join(process.cwd(), 'frontend/src/pages/instructor/attendance.html'));
  });

  // Instructor: publish assignments
  router.get('/instructor/courses/:courseId/assignments', requireAuth('instructor'), (req, res) => {
    res.sendFile(path.join(process.cwd(), 'frontend/src/pages/instructor/publish_assignment.html'));
  });
  /**
   * ===== STUDENT ROUTES =====
   */

  router.get('/student', requireAuth('student'), (req, res) => {
    res.sendFile(path.join(process.cwd(), 'frontend/src/pages/student/dashboard.html'));
  });

  // QR-based check-in route
  router.get('/student/checkin', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'frontend/src/pages/student/checkin.html'));
  });

  // PIN-based checkin route
  router.get('/student/manual_checkin', requireAuth('student'), (req, res) => {
    res.sendFile(path.join(process.cwd(), 'frontend/src/pages/student/manual_checkin.html'));
  });

  router.get('/student/attendance', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'frontend/src/pages/student/my_attendance.html'));
  });

  router.get('/course/:id', requireAuth('student'), (req, res) => {
    res.sendFile(path.join(process.cwd(), 'frontend/src/pages/student/courses.html'));
  });
  return router;
}
