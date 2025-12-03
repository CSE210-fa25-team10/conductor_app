/**
 * routes.js is the central index pointing towards other API routers in the server.
 */

import { makeAuthRouter } from './authRoutes.js';
import { makeQueryRouter } from './queryRoutes.js';
import { makeFrontendRouter } from './frontendRoutes.js';
import { makePageRouter } from './pageRouter.js';
import { makeAttendanceRouter } from './attendanceRoutes.js';
import { makeCssRouter } from './cssRouter.js';
import { makeJsRouter } from './jsRouter.js';

export function mountRoutes(app, container) {
  // Auth APIs
  app.use('/api/auth', makeAuthRouter({ authController: container.authController }));

  // Query APIs
  app.use('/api/queries', makeQueryRouter({ queryService: container.queryController }));

  // Frontend/test APIs (mounted under /api to match client expectations)
  app.use('/api', makeFrontendRouter());

  // Attendance APIs
  app.use(
    '/api/attendance',
    makeAttendanceRouter({ attendanceController: container.attendanceController })
  );

  // CSS routes
  app.use('/css', makeCssRouter());

  // JS routes
  app.use('/js', makeJsRouter());

  // HTML pages
  app.use('/', makePageRouter());
}
