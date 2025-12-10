import { Router } from 'express';

import { requireAuth, requireInstructorOrTA } from '../../../middleware/auth.js';

export function makeGroupRouter({ groupController }) {
  const router = Router();

  // To get current user's user_id
  router.get('/users/me-id', requireAuth('student'), groupController.getUserIdofCurrentUser);

  // to get user names of all users of that group
  router.get('/users/:userIds', requireAuth('student'), groupController.getUsersByIds);

  // Get all student groups for a course
  router.get('/:courseId', requireInstructorOrTA, groupController.getGroupsByCourse);

  // Create a new student group in a course
  router.post('/:courseId', requireInstructorOrTA, groupController.createGroup);

  // Update a student group
  router.put('/:courseId/:groupId', requireInstructorOrTA, groupController.updateGroup);

  // Delete a student group
  router.delete('/:courseId/:groupId', requireInstructorOrTA, groupController.deleteGroup);

  // A student should be able to view their group
  router.get('/:courseId/my-group', requireAuth('student'), groupController.getMyGroup);

  return router;
}
