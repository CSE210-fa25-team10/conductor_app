import { Router } from 'express';

import { requireAuth, requireInstructorOrTA } from '../../../middleware/auth.js';

export function makeStandUpRouter({ standupController }) {
  const router = Router();

  // User standup routes
  router.get('/:courseId', requireAuth('student'), standupController.getMyEntries);
  router.post('/:courseId', requireAuth('student'), standupController.createEntry);

  //Anonymous Feedback Endpoint
  router.post(
    '/:courseId/feedback',
    requireAuth('student'),
    standupController.postAnonymousFeedback
  );
  router.get(
    '/instructor/:courseId/feedback',
    requireInstructorOrTA,
    standupController.getAnonymousFeedback
  );
  router.get(
    '/teamlead/:courseId/feedback',
    requireAuth('teamlead'),
    standupController.getAnonymousFeedbackTeamLead
  );

  return router;
}
