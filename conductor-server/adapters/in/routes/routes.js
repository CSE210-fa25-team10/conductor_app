/**
 * routes.js is the central index pointing towards other API routers in the server.
 */

import path from 'path';
import { makeAuthRouter } from './authRoutes.js';
import { makeQueryRouter } from './queryRoutes.js';
import { makePageRouter } from './pageRouter.js';
import { makeAttendanceRouter } from './attendanceRoutes.js';

export function mountRoutes(app, container) {
  // Auth APIs
  app.use('/api/auth', makeAuthRouter({ authController: container.authController }));

  // Query APIs
  app.use('/api/queries', makeQueryRouter({ queryService: container.queryController }));

  // Modification APIs
  // frontendRoutes here...

  // Attendance APIs
  app.use('/api/attendance', makeAttendanceRouter({ attendanceController: container.attendanceController }))

  // HTML pages
  app.use('/', makePageRouter(container));
}