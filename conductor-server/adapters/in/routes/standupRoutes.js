import { Router } from 'express';

// import { requireAuth, requireInstructorOrTA } from '../../../middleware/auth.js'; #--> need oauth to be done

export function makeStandUpRouter({ standupController }) {
  const router = Router();

  //Removing this TEMP section, you should replace 'requireAuth' with 'requireInstructorOrTA' in all router.posts
  // ⚠️ TEMP: disable auth while we test
  function requireAuth(_req, _res, next) {
    return next();
  }

  function requireInstructorOrTA(_req, _res, next) {
  return next();
  }


  // User standup routes
  router.get('/', requireAuth, standupController.getMyEntries);
  router.post('/', requireAuth, standupController.createEntry);

  // Instructor/TA view
  router.get('/course/:courseId', requireAuth, requireInstructorOrTA, standupController.getCourseEntries);

  return router;
}




