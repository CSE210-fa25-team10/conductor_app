import { Router } from 'express';
import path from 'node:path';
// import { requireAuth } from '../requireAuth.js';

export function makePageRouter({ container }) {
  const router = Router();

  router.get('/', (req, res) => res.redirect('/auth/login'));

  router.get('/instructor', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'frontend/src/pages/instructor/dashboard.html'));
  });

  router.get('/student', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'frontend/src/pages/student/dashboard.html'));
  });

  // Eventually we'll want to use these versions that check for a valid logged in user before redirect
//   router.get('/instructor', requireAuth('instructor'), (req, res) => {
//     res.sendFile(path.join(process.cwd(), 'frontend/src/instructor/dashboard.html'));
//   });

//   router.get('/student', requireAuth('student'), (req, res) => {
//     res.sendFile(path.join(process.cwd(), 'frontend/src/student/dashboard.html'));
//   });

  return router;
}