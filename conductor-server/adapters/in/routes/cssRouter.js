import { Router } from 'express';
import path from 'node:path';

export function makeCssRouter() {
  const router = Router();

  /**
   * ===== SHARED CSS =====
   */

  router.get('/auth.css', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'frontend/src/css/auth.css'));
  });

  /**
   * ===== STUDENT CSS =====
   */

  router.get('/student/dashboard.css', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'frontend/src/css/student/dashboard.css'));
  });

  router.get('/student/courses.css', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'frontend/src/css/student/courses.css'));
  });

  /**
   * ===== INSTRUCTOR CSS =====
   */

  router.get('/instructor/dashboard.css', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'frontend/src/css/instructor/dashboard.css'));
  });

  router.get('/instructor/courses.css', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'frontend/src/css/instructor/courses.css'));
  });

  // FIXME: Can we confirm if this styles.css is required please?
  router.get('/instructor/styles.css', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'frontend/src/css/instructor/styles.css'));
  });

  return router;
}
