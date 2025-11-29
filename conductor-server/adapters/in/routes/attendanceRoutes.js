import { Router } from 'express';

// import { requireAuth, requireInstructorOrTA } from '../../../middleware/auth.js'; #--> need oauth to be done

export function makeAttendanceRouter({ attendanceController }) {
  const router = Router();

  //Removing this TEMP section, you should replace 'requireAuth' with 'requireInstructorOrTA' in all router.posts
  // ⚠️ TEMP: disable auth while we test
  function requireAuth(_req, _res, next) {
    return next();
  }

  // 1. Instructor: start a session (creates activity, returns PIN + QR)
  router.post('/session/start', requireAuth, attendanceController.startAttendanceSession);

  // 2. Student: check-in via QR or PIN (needs basic auth)
  router.post('/checkin', requireAuth, attendanceController.checkinAttendance);

  // 3. Instructor/TA: manual mark
  router.post('/manual', requireAuth, attendanceController.manualMarkAttendance);
  router.get(
    '/courses/:courseId/groups/:groupId/students',
    attendanceController.getStudentsInGroup
  );

  // 4. Course-level summary (overall + per student)
  router.get(
    '/courses/:courseId/summary',
    requireAuth,
    attendanceController.getCourseAttendanceSummary
  );

  // 5. Team (group) attendance over time
  router.get(
    '/courses/:courseId/groups',
    requireAuth,
    attendanceController.getCourseGroupAttendanceSummary
  );

  // 6. Instructor: group + member attendance across all activities
  router.get(
    '/courses/:courseId/instructor-overview',
    requireAuth,
    attendanceController.getCourseGroupAndMemberOverview
  );

  // 7. Student: personal + team attendance across all activities
  router.get(
    '/courses/:courseId/student/:userId/overview',
    requireAuth,
    attendanceController.getStudentCourseAttendanceOverview
  );

  return router;
}
