/**
 * routes.js is the central index pointing towards other API routers in the server.
 */

import path from 'path';
import { makeAuthRouter } from './authRoutes.js';
import { makePageRouter } from './pageRouter.js';

export function mountRoutes(app, container) {
  // Auth APIs
  app.use('/auth', makeAuthRouter({ authController: container.authController }));

  // HTML pages
  app.use('/', makePageRouter(container));
}