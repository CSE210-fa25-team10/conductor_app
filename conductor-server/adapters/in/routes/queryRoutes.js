import express from 'express';
import { makeQueryService } from '../../../services/queryService.js';
import { pool } from '../../../db.js';

const router = express.Router();
const queryService = makeQueryService({ pool });

/**
 * GET /api/queries/users
 * Get all users
 */
router.get('/users', async (_req, res) => {
  try {
    const users = await queryService.executeQuery('getUsers');
    res.json(users);
  } catch (error) {
    console.error('GET /api/queries/users error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/queries/users/:id
 * Get user by ID
 */
router.get('/users/:id', async (req, res) => {
  const userId = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(userId)) {
    return res.status(400).json({ error: 'user_id must be an integer' });
  }

  try {
    const users = await queryService.executeQuery('getUserById', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(users[0]);
  } catch (error) {
    console.error('GET /api/queries/users/:id error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/queries/courses
 * Get all courses
 */
router.get('/courses', async (_req, res) => {
  try {
    const courses = await queryService.executeQuery('getCourses');
    res.json(courses);
  } catch (error) {
    console.error('GET /api/queries/courses error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/queries/courses/:id/roster
 * Get course roster
 */
router.get('/courses/:id/roster', async (req, res) => {
  const courseId = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(courseId)) {
    return res.status(400).json({ error: 'course_id must be an integer' });
  }

  try {
    const roster = await queryService.executeQuery('getCourseRoster', [courseId]);
    res.json(roster);
  } catch (error) {
    console.error('GET /api/queries/courses/:id/roster error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/queries/courses/:id/activities
 * Get activities for a course
 */
router.get('/courses/:id/activities', async (req, res) => {
  const courseId = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(courseId)) {
    return res.status(400).json({ error: 'course_id must be an integer' });
  }

  try {
    const activities = await queryService.executeQuery('getCourseActivities', [courseId]);
    res.json(activities);
  } catch (error) {
    console.error('GET /api/queries/courses/:id/activities error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/queries/activities
 * Get all activities, optionally filtered by course_id
 */
router.get('/activities', async (req, res) => {
  const courseId = req.query.course_id ? Number.parseInt(req.query.course_id, 10) : null;

  if (req.query.course_id && !Number.isInteger(courseId)) {
    return res.status(400).json({ error: 'course_id must be an integer' });
  }

  try {
    const activities = await queryService.executeQuery('getActivities', [courseId]);
    res.json(activities);
  } catch (error) {
    console.error('GET /api/queries/activities error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/queries/users/:id/courses
 * Get courses for a user
 */
router.get('/users/:id/courses', async (req, res) => {
  const userId = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(userId)) {
    return res.status(400).json({ error: 'user_id must be an integer' });
  }

  try {
    const courses = await queryService.executeQuery('getUserCourses', [userId]);
    res.json(courses);
  } catch (error) {
    console.error('GET /api/queries/users/:id/courses error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/queries/users/:id/attendance
 * Get attendance for a user, optionally filtered by course_id
 */
router.get('/users/:id/attendance', async (req, res) => {
  const userId = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(userId)) {
    return res.status(400).json({ error: 'user_id must be an integer' });
  }

  const courseId = req.query.course_id ? Number.parseInt(req.query.course_id, 10) : null;

  if (req.query.course_id && !Number.isInteger(courseId)) {
    return res.status(400).json({ error: 'course_id must be an integer' });
  }

  try {
    const attendance = await queryService.executeQuery('getUserAttendance', [userId, courseId]);
    res.json(attendance);
  } catch (error) {
    console.error('GET /api/queries/users/:id/attendance error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/queries/attendance
 * Create or update attendance record
 */
router.post('/attendance', async (req, res) => {
  const body = req.body ?? {};
  let { activity_id, user_id } = body;
  const { present } = body;

  activity_id = typeof activity_id === 'string' ? Number.parseInt(activity_id, 10) : activity_id;
  user_id = typeof user_id === 'string' ? Number.parseInt(user_id, 10) : user_id;

  if (
    !Number.isInteger(activity_id) ||
    !Number.isInteger(user_id) ||
    typeof present !== 'boolean'
  ) {
    return res.status(400).json({
      error: 'activity_id (int), user_id (int), and present (boolean) are required',
    });
  }

  try {
    const result = await queryService.executeQuery('createAttendance', [
      activity_id,
      user_id,
      present,
    ]);
    res.status(201).json(result[0]);
  } catch (error) {
    console.error('POST /api/queries/attendance error:', error);
    res.status(400).json({ error: error.message });
  }
});

export default router;
