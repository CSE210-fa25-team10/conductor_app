/**
 * routes.js is the central index pointing towards other API routers in the server.
 */

import path from 'path';
import { makeAuthRouter } from './authRoutes.js';
import { makeQueryRouter } from './queryRoutes.js';
import { makePageRouter } from './pageRouter.js';

export function mountRoutes(app, container) {
  // Auth APIs
  app.use('/auth', makeAuthRouter({ authController: container.authController }));

  // Query APIs
  app.use('/queries', makeQueryRouter({ queryService: container.queryController }));

  // HTML pages
  app.use('/', makePageRouter(container));
}