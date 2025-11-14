import express from 'express';
import {
  startAttendanceSession,
  checkinAttendance,
  manualMarkAttendance,
  getCourseAttendanceSummary,
  getCourseGroupAttendanceSummary,
  getStudentsInGroup,
  getCourseGroupAndMemberOverview,
  getStudentCourseAttendanceOverview
} from '../../../controllers/attendanceController.js';

// import { requireAuth, requireInstructorOrTA } from '../../../middleware/auth.js'; #--> need oauth to be done

const router = express.Router();

//Removing this TEMP section, you should replace 'requireAuth' with 'requireInstructorOrTA' in all router.posts
// ⚠️ TEMP: disable auth while we test
function requireAuth(_req, _res, next) {
  return next();
}


// 1. Instructor: start a session (creates activity, returns PIN + QR)
router.post('/session/start', requireAuth, startAttendanceSession);

// 2. Student: check-in via QR or PIN (needs basic auth)
router.post('/checkin', requireAuth, checkinAttendance);

// 3. Instructor/TA: manual mark
router.post('/manual', requireAuth, manualMarkAttendance);
router.get("/courses/:courseId/groups/:groupId/students", getStudentsInGroup);

// 4. Course-level summary (overall + per student)
router.get('/courses/:courseId/summary', requireAuth, getCourseAttendanceSummary);

// 5. Team (group) attendance over time
router.get('/courses/:courseId/groups', requireAuth, getCourseGroupAttendanceSummary);

// 6. Instructor: group + member attendance across all activities
router.get(
  '/courses/:courseId/instructor-overview',
  requireAuth,
  getCourseGroupAndMemberOverview
);

// 7. Student: personal + team attendance across all activities
router.get(
  '/courses/:courseId/student/:userId/overview',
  requireAuth,
  getStudentCourseAttendanceOverview
);


export default router;
