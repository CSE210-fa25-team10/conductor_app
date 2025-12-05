import express from 'express';
import { makeQueryService } from '../../../services/queryService.js';
import { pool } from '../../../db.js';

export function makeFrontendRouter() {
  const router = express.Router();
  const queryService = makeQueryService({ pool });

  /**
   * GET /api/user
   * Get current user info (instructor+student)
   * Note: Currently accepts user_id from session or query param.
   * In production, should use proper authentication middleware.
   */
  router.get('/user', async (req, res) => {
    console.log('[frontendRoutes] GET /api/user hit - session user:', Boolean(req.session?.user));
    // session may store user as { id } (authController) or { user_id } in older code
    const sessionUser = req.session?.user || {};
    const userId = sessionUser.id || sessionUser.user_id || req.query.user_id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userIdInt = Number.parseInt(userId, 10);
    if (!Number.isInteger(userIdInt)) {
      return res.status(400).json({ error: 'Invalid user_id' });
    }

    try {
      const users = await queryService.executeQuery('getUserById', [userIdInt]);
      if (users.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = users[0];
      const userInfo = { ...user };
      // Convert profile_photo (bytea/Buffer) to base64 string for JSON transport
      if (userInfo.profile_photo && userInfo.profile_photo instanceof Buffer) {
        userInfo.profile_photo = userInfo.profile_photo.toString('base64');
      }
      delete userInfo.password; // Exclude password safely
      res.json(userInfo);
    } catch (error) {
      console.error('GET /api/user error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/user
   * Edit user info (instructor+student)
   * Note: Currently accepts user_id from session or body.
   * In production, should use proper authentication middleware.
   */
  router.post('/user', async (req, res) => {
    console.log('[frontendRoutes] POST /api/user hit - body:', req.body);
    const sessionUser = req.session?.user || {};
    const userId = sessionUser.id || sessionUser.user_id || req.body.user_id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userIdInt = Number.parseInt(userId, 10);
    if (!Number.isInteger(userIdInt)) {
      return res.status(400).json({ error: 'Invalid user_id' });
    }

    const { name, email, pronouns, phone, availability, pronunciation, slack } = req.body || {};

    try {
      const result = await queryService.executeQuery('updateUser', [
        userIdInt,
        name || null,
        email || null,
        pronouns || null,
        phone || null,
        availability || null,
        pronunciation || null,
        slack || null,
      ]);

      if (result.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const out = { ...result[0] };
      if (out.profile_photo && out.profile_photo instanceof Buffer) {
        out.profile_photo = out.profile_photo.toString('base64');
      }
      res.json(out);
    } catch (error) {
      console.error('POST /api/user error:', error);
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Email already in use' });
      }
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/course
   * Create course (instructor)
   */
  router.post('/course', async (req, res) => {
    const { name, code, semester, description } = req.body || {};

    if (!name) {
      return res.status(400).json({ error: 'course name is required' });
    }

    try {
      const result = await queryService.executeQuery('createCourse', [
        name,
        code || null,
        semester || null,
        description || null,
      ]);

      res.status(201).json(result[0]);
    } catch (error) {
      console.error('POST /api/course error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/course
   * Get course (instructor+student)
   * Query params: course_id (required)
   */
  router.get('/course', async (req, res) => {
    const courseId = req.query.course_id ? Number.parseInt(req.query.course_id, 10) : null;

    if (!courseId || !Number.isInteger(courseId)) {
      return res.status(400).json({ error: 'course_id is required and must be an integer' });
    }

    try {
      const courses = await queryService.executeQuery('getCourseById', [courseId]);
      if (courses.length === 0) {
        return res.status(404).json({ error: 'Course not found' });
      }
      res.json(courses[0]);
    } catch (error) {
      console.error('GET /api/course error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/courses
   * Get courses info (instructor+student) - for dashboard
   * Query params: user_id (optional) - if provided, returns courses for that user
   */
  router.get('/courses', async (req, res) => {
    const userId = req.query.user_id ? Number.parseInt(req.query.user_id, 10) : null;

    if (req.query.user_id && !Number.isInteger(userId)) {
      return res.status(400).json({ error: 'user_id must be an integer' });
    }

    try {
      if (userId) {
        const courses = await queryService.executeQuery('getUserCourses', [userId]);
        res.json(courses);
      } else {
        const courses = await queryService.executeQuery('getCourses');
        res.json(courses);
      }
    } catch (error) {
      console.error('GET /api/courses error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/config/google
   * Returns public Google API config (clientId and apiKey) for the frontend to initialize gapi.
   */
  router.get('/config/google', (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID || null;
    const apiKey = process.env.GOOGLE_API_KEY || null;
    res.json({ clientId, apiKey });
  });

  // /**
  //  * POST /api/attendance
  //  * Create attendance (instructor)
  //  */
  // router.post('/attendance', async (req, res) => {
  //   const body = req.body ?? {};
  //   let { activity_id, user_id } = body;
  //   const { present } = body;

  //   activity_id = typeof activity_id === 'string' ? Number.parseInt(activity_id, 10) : activity_id;
  //   user_id = typeof user_id === 'string' ? Number.parseInt(user_id, 10) : user_id;

  //   if (
  //     !Number.isInteger(activity_id) ||
  //     !Number.isInteger(user_id) ||
  //     typeof present !== 'boolean'
  //   ) {
  //     return res.status(400).json({
  //       error: 'activity_id (int), user_id (int), and present (boolean) are required',
  //     });
  //   }

  //   try {
  //     const result = await queryService.executeQuery('createAttendance', [
  //       activity_id,
  //       user_id,
  //       present,
  //     ]);
  //     res.status(201).json(result[0]);
  //   } catch (error) {
  //     console.error('POST /api/attendance error:', error);
  //     res.status(400).json({ error: error.message });
  //   }
  // });

  // /**
  //  * GET /api/attendance
  //  * Get attendance (instructor+student)
  //  * Query params: course_id (optional), user_id (optional)
  //  */
  // router.get('/attendance', async (req, res) => {
  //   const courseId = req.query.course_id ? Number.parseInt(req.query.course_id, 10) : null;
  //   const userId = req.query.user_id ? Number.parseInt(req.query.user_id, 10) : null;

  //   if (req.query.course_id && !Number.isInteger(courseId)) {
  //     return res.status(400).json({ error: 'course_id must be an integer' });
  //   }
  //   if (req.query.user_id && !Number.isInteger(userId)) {
  //     return res.status(400).json({ error: 'user_id must be an integer' });
  //   }

  //   try {
  //     const attendance = await queryService.executeQuery('getAttendance', [courseId, userId]);
  //     res.json(attendance);
  //   } catch (error) {
  //     console.error('GET /api/attendance error:', error);
  //     res.status(500).json({ error: error.message });
  //   }
  // });

  /**
   * POST /api/assignment
   * Create assignment (instructor)
   */
  router.post('/assignment', async (req, res) => {
    const { course_id, name, description, due_date, created_by } = req.body || {};

    if (!course_id || !name) {
      return res.status(400).json({ error: 'course_id and name are required' });
    }

    const courseIdInt = Number.parseInt(course_id, 10);
    const createdById = created_by ? Number.parseInt(created_by, 10) : null;

    if (!Number.isInteger(courseIdInt)) {
      return res.status(400).json({ error: 'course_id must be an integer' });
    }
    if (created_by && !Number.isInteger(createdById)) {
      return res.status(400).json({ error: 'created_by must be an integer' });
    }

    try {
      const result = await queryService.executeQuery('createAssignment', [
        courseIdInt,
        name,
        description || null,
        due_date || null,
        createdById,
      ]);

      res.status(201).json(result[0]);
    } catch (error) {
      console.error('POST /api/assignment error:', error);
      res.status(400).json({ error: error.message });
    }
  });

  /**
   * PUT /api/user/profile-photo
   * Accepts JSON { profile_photo: "base64..." } and updates the user's profile photo (bytea)
   */
  router.put('/user/profile-photo', async (req, res) => {
    console.log('[frontendRoutes] PUT /api/user/profile-photo hit - content-type:', req.headers['content-type']);
    console.log('[frontendRoutes] session user present:', Boolean(req.session?.user));
    const sessionUser = req.session?.user || {};
    const userId = sessionUser.id || sessionUser.user_id || req.body.user_id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userIdInt = Number.parseInt(userId, 10);
    if (!Number.isInteger(userIdInt)) {
      return res.status(400).json({ error: 'Invalid user_id' });
    }

    const { profile_photo } = req.body || {};
    if (!profile_photo) {
      return res.status(400).json({ error: 'profile_photo is required' });
    }

    try {
      // profile_photo may be a data URL like 'data:image/png;base64,AAA...'
      let base64 = profile_photo;
      const commaIdx = base64.indexOf(',');
      if (commaIdx !== -1) base64 = base64.slice(commaIdx + 1);

      const buffer = Buffer.from(base64, 'base64');

      const result = await queryService.executeQuery('updateUserProfilePhoto', [userIdInt, buffer]);
      if (!result || result.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      const out = { ...result[0] };
      if (out.profile_photo && out.profile_photo instanceof Buffer) {
        out.profile_photo = out.profile_photo.toString('base64');
      }
      // return the updated user row with profile_photo as base64
      res.json(out);
    } catch (error) {
      console.error('PUT /api/user/profile-photo error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/assignment
   * Get assignment (instructor+student)
   * Query params: course_id (optional)
   */
  router.get('/assignment', async (req, res) => {
    const courseId = req.query.course_id ? Number.parseInt(req.query.course_id, 10) : null;

    if (req.query.course_id && !Number.isInteger(courseId)) {
      return res.status(400).json({ error: 'course_id must be an integer' });
    }

    try {
      const assignments = await queryService.executeQuery('getAssignments', [courseId]);
      res.json(assignments);
    } catch (error) {
      console.error('GET /api/assignment error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
