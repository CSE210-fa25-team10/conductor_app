import { Router } from 'express';
import path from 'node:path';
import { requireAuth } from '../../../middleware/auth.js';

export function makePageRouter() {
  const router = Router();

  router.get('/', (req, res) => res.redirect('/api/auth/login'));

  // router.get('/instructor', (req, res) => {
  //   res.sendFile(path.join(process.cwd(), 'frontend/src/pages/instructor/dashboard.html'));
  // });

  // router.get('/student', (req, res) => {
  //   res.sendFile(path.join(process.cwd(), 'frontend/src/pages/student/dashboard.html'));
  // });

  // router.get('/instructor/attendance', (req, res) => {
  //   res.sendFile(path.join(process.cwd(), 'frontend/src/pages/instructor/attendance.html'));
  // });

  // Eventually we'll want to use these versions that check for a valid logged in user before redirect
  router.get('/instructor', requireAuth('instructor'), (req, res) => {
    res.sendFile(path.join(process.cwd(), 'frontend/src/pages/instructor/dashboard.html'));
  });

  router.get('/student', requireAuth('student'), (req, res) => {
    res.sendFile(path.join(process.cwd(), 'frontend/src/pages/student/dashboard.html'));
  });

  return router;
}
