import { Router } from 'express';

import { requireAuth, requireInstructorOrTA } from '../../../middleware/auth.js'; //--> need oauth to be done

export function makeAttendanceRouter({ attendanceController }) {
  const router = Router();

  // //Removing this TEMP section, you should replace 'requireAuth' with 'requireInstructorOrTA' in all router.posts
  // // ⚠️ TEMP: disable auth while we test
  // function requireAuth(_req, _res, next) {
  //   return next();
  // }

  // 1. Instructor: start a session (creates activity, returns PIN + QR)
  router.post(
    '/courses/:courseId/session/start',
    requireInstructorOrTA,
    attendanceController.startAttendanceSession
  );

  // 2. Student: check-in via QR or PIN (needs basic auth)
  router.post('/checkin', attendanceController.checkinAttendance);

  // 3. Instructor/TA: manual mark
  router.post(
    '/courses/:courseId/manual',
    requireInstructorOrTA,
    attendanceController.manualMarkAttendance
  );
  router.get(
    '/courses/:courseId/groups/:groupId/students',
    requireInstructorOrTA,
    attendanceController.getStudentsInGroup
  );

  // 4. Course-level summary (overall + per student)
  router.get(
    '/courses/:courseId/summary',
    requireInstructorOrTA,
    attendanceController.getCourseAttendanceSummary
  );

  // 5. Team (group) attendance over time
  router.get(
    '/courses/:courseId/groups',
    requireInstructorOrTA,
    attendanceController.getCourseGroupAttendanceSummary
  );

  // 6. Instructor: group + member attendance across all activities
  router.get(
    '/courses/:courseId/instructor-overview',
    requireInstructorOrTA,
    attendanceController.getCourseGroupAndMemberOverview
  );

  // 7. Student: personal + team attendance across all activities
  router.get(
    '/courses/:courseId/student/overview',
    requireAuth('student'),
    attendanceController.getStudentCourseAttendanceOverview
  );

  return router;
}
