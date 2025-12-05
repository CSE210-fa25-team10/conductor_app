import {
  getUserStandupEntries,
  createStandupEntry,
  getAnonymousFeedbackEntries,
  getAnonymousFeedbackEntriesTeamLead,
  createAnonymousFeedback,
} from '../services/standupService.js';

export function makeStandUpController() {
  /**
   * GET /api/standup
   * Get all standup entries for a user
   * In dummy mode, user_id is sent in request body
   */

  async function getMyEntries(req, res) {
    console.log('[GET /api/standup] Incoming request...');
    const userid = req.session?.user?.user_id;
    const user_id = Number(userid);
    if (!user_id) {
    return res.status(401).json({ error: "not_authenticated" });
  }

    try {  
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
    const sessionUser = req.session?.user;
    if (!sessionUser) {
      return res.status(401).json({ error: 'not_logged_in' });
    }

    const user_id = Number(sessionUser.user_id);
    const name = sessionUser.name;

    try {
      const { content, sentiment_personal, sentiment_team, sentiment_course } = req.body;


      console.log(' [POST /api/standup] Incoming request...');
      console.log('Request body:', req.body);
      console.log('Parsed fields:', {
        user_id,
        name,
        content_length: content?.length,
        sentiment_personal,
        sentiment_team,
        sentiment_course,
      });

      if (!content) {
        return res.status(400).json({ error: 'content_required' });
      }

      const entry = await createStandupEntry({
        user_id,
        name,
        content,
        sentiment_personal: Number(sentiment_personal),
        sentiment_team: Number(sentiment_team),
        sentiment_course: Number(sentiment_course),
      });
      res.status(201).json({ entry });
      console.log('New standup entry created:', entry);
    } catch (err) {
      console.error('createEntry error:', err);
      res.status(500).json({ error: 'Failed to create standup entry' });
    }
  }

  /**
   * POST /api/standup/feedback
   * Create anonymous feedback for team/course. (NEW ENDPOINT)
   */
  async function postAnonymousFeedback(req, res) {
    try {
      const course_id = Number(req.params.courseId);
      const { type, message } = req.body;

      if (!course_id || !type || !message) {
        return res.status(400).json({ error: 'Course ID, type, and message are required.' });
      }

      // Delegates to use case for validation and persistence
      await createAnonymousFeedback({
        course_id,
        type: type.toUpperCase(),
        message,
      });

      res.status(201).json({ message: 'Feedback posted successfully and anonymously.' });
    } catch (err) {
      console.error('postAnonymousFeedback error:', err);
      res.status(500).json({ error: err.message || 'Failed to post feedback.' });
    }
  }

  /**
   *GET /api/standup/instructor/:courseId/feedback
   * Get standup anonymous entries for a specific course (Instructor/TA view)
   */
  async function getAnonymousFeedback(req, res) {
    try {
      const courseId = Number(req.params.courseId);
      if (!Number.isInteger(courseId)) {
        return res.status(400).json({ error: 'invalid_course_id' });
      }
      const entries = await getAnonymousFeedbackEntries(courseId);
      res.json({ entries });
    } catch (err) {
      console.error('getCourseEntries error:', err);
      res.status(500).json({ error: 'Failed to fetch course standup entries' });
    }
  }

  /**
   *GET /api/standup/teamlead/:courseId/feedback
   * Get standup anonymous entries for a specific course (Instructor/TA view)
   */
  async function getAnonymousFeedbackTeamLead(req, res) {
    try {
      const courseId = Number(req.params.courseId);
      if (!Number.isInteger(courseId)) {
        return res.status(400).json({ error: 'invalid_course_id' });
      }
      const entries = await getAnonymousFeedbackEntriesTeamLead(courseId);
      res.json({ entries });
    } catch (err) {
      console.error('getCourseEntries error:', err);
      res.status(500).json({ error: 'Failed to fetch course standup entries' });
    }
  }

  return Object.freeze({
    getMyEntries,
    createEntry,
    postAnonymousFeedback,
    getAnonymousFeedback,
    getAnonymousFeedbackTeamLead
  });
}
