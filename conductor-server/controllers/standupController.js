import {
  getUserStandupEntries,
  createStandupEntry,
  getCourseStandupEntries,
} from '../services/standupService.js';

export function makeStandUpController() {
/**
 * GET /api/standup
 * Get all standup entries for a user
 * In dummy mode, user_id is sent in request body
 */

async function getMyEntries(req, res) {
  try {
    const { user_id } = req.body; // read user_id from frontend
    if (!user_id) {
      return res.status(400).json({ error: 'user_id_required' });
    }
    const entries = await getUserStandupEntries(user_id);
    res.json({ entries });
  } catch (err) {
    console.error('getMyEntries error:', err);
    res.status(500).json({ error: 'Failed to fetch standup entries' });
  }

}

/**
 * POST /api/standup
 * Create a new standup entry
 * In dummy mode, user_id and name are sent from frontend
 */
async function createEntry(req, res) {
  try {
    const { user_id, name, content, sentiment, leader_feedback, course_feedback } = req.body;
    if (!user_id || !name) {
      return res.status(400).json({ error: 'user_id_and_name_required' });
    }
    if (!content) {
      return res.status(400).json({ error: 'content_required' });
    }

    const entry = await createStandupEntry({
      user_id,
      name,
      content,
      sentiment,
      leader_feedback,
      course_feedback,
    });
    res.status(201).json({ entry });

  } catch (err) {
    console.error('createEntry error:', err);
    res.status(500).json({ error: 'Failed to create standup entry' });
  }
}

/**
 *GET /api/standup/course/:courseId
 * Get standup entries for a specific course (Instructor/TA view)
 */
async function getCourseEntries(req, res) {
  try {
    const courseId = Number(req.params.courseId);
    if (!Number.isInteger(courseId)) {
      return res.status(400).json({ error: 'invalid_course_id' });
    }
    const entries = await getCourseStandupEntries(courseId);
    res.json({ entries });
  } catch (err) {
    console.error('getCourseEntries error:', err);
    res.status(500).json({ error: 'Failed to fetch course standup entries' });
  }
}

 return Object.freeze({
    getMyEntries,
    createEntry,
    getCourseEntries
  });
}

