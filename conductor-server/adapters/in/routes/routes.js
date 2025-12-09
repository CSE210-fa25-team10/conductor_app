/**
 * routes.js is the central index pointing towards other API routers in the server.
 */

import { makeAuthRouter } from './authRoutes.js';
import { makeQueryRouter } from './queryRoutes.js';
import { makeFrontendRouter } from './frontendRoutes.js';
import { makePageRouter } from './pageRouter.js';
import { makeAttendanceRouter } from './attendanceRoutes.js';
import { makeStandUpRouter } from './standupRoutes.js';
import { makeGroupRouter } from './groupRoutes.js';
import { makeCssRouter } from './cssRouter.js';
import { makeJsRouter } from './jsRouter.js';
import { makeCourseRouter } from './courseRoutes.js';

export function mountRoutes(app, container) {
  // Auth APIs
  app.use('/api/auth', makeAuthRouter({ authController: container.authController }));

  // Query APIs
  app.use('/api/queries', makeQueryRouter({ queryService: container.queryController }));

  // Postman APIs
  app.use('/api/postman', makeFrontendRouter());

  // Attendance APIs
  app.use(
    '/api/attendance',
    makeAttendanceRouter({ attendanceController: container.attendanceController })
  );

  //  Courses APIs
  app.use('/api/courses', makeCourseRouter({ courseController: container.courseController }));
  // Standup Tool APIs
  app.use('/api/standup', makeStandUpRouter({ standupController: container.standupController }));

  // Groups APIs
  app.use('/api/groups', makeGroupRouter({ groupController: container.groupController }));

  // CSS routes
  app.use('/css', makeCssRouter());

  // JS routes
  app.use('/js', makeJsRouter());

  // HTML pages
  app.use('/', makePageRouter());
}
