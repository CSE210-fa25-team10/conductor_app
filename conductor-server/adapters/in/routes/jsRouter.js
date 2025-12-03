import { Router } from 'express';
import path from 'node:path';

export function makeJsRouter() {
  const router = Router();

  /**
   * ===== SHARED JS ROUTES =====
   */

  router.get('/login.js', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'frontend/src/js/login.js'));
  });

  router.get('/register.js', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'frontend/src/js/register.js'));
  });

  router.get('/google_oauth.js', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'frontend/src/js/google_oauth.js'));
  });

  router.get('/profile.js', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'frontend/src/js/profile.js'));
  });

  /**
   * ===== STUDENT JS ROUTES =====
   */

  router.get('/student/dashboard.js', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'frontend/src/js/student/dashboard.js'));
  });

  router.get('/student/checkin.js', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'frontend/src/js/student/checkin.js'));
  });

  router.get('/student/courses.js', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'frontend/src/js/student/courses.js'));
  });

  // FIXME: WE HAVE CHECKIN.JS AND MANUAL_CHECKIN.JS --- which one do we need?
  router.get('/student/manual_checkin.js', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'frontend/src/js/student/manual_checkin.js'));
  });

  router.get('/student/my_attendance.js', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'frontend/src/js/student/my_attendance.js'));
  });

  router.get('/student/upload_assignment.js', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'frontend/src/js/student/upload_assignment.js'));
  });

  /**
   * ===== INSTRUCTOR JS ROUTES =====
   */

  router.get('/instructor/dashboard.js', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'frontend/src/js/instructor/dashboard.js'));
  });

  router.get('/instructor/attendance_overview.js', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'frontend/src/js/instructor/attendance_overview.js'));
  });

  router.get('/instructor/attendance.js', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'frontend/src/js/instructor/attendance.js'));
  });

  router.get('/instructor/courses.js', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'frontend/src/js/instructor/courses.js'));
  });

  router.get('/instructor/grade_assignment.js', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'frontend/src/js/instructor/grade_assignment.js'));
  });

  router.get('/instructor/publish_assignment.js', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'frontend/src/js/instructor/publish_assignment.js'));
  });

  router.get('/instructor/team_attendance.js', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'frontend/src/js/instructor/team_attendance.js'));
  });

  return router;
}
