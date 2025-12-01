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

  router.get('/instructor/attendance', requireAuth('instructor'), (req, res) => {
    res.sendFile(path.join(process.cwd(), 'frontend/src/pages/instructor/attendance.html'));
  });

  /**
   * ===== STUDENT ROUTES =====
   */

  router.get('/student', requireAuth('student'), (req, res) => {
    res.sendFile(path.join(process.cwd(), 'frontend/src/pages/student/dashboard.html'));
  });

  router.get('/student/manual_checkin', requireAuth('student'), (req, res) => {
    res.sendFile(path.join(process.cwd(), 'frontend/src/pages/student/manual_checkin.html'));
  });

  return router;
}
