import {
  getUserStandupEntries,
  createStandupEntry,
  getCourseStandupEntries,
  createAnonymousFeedback
} from '../services/standupService.js';

export function makeStandUpController() {
/**
 * GET /api/standup
 * Get all standup entries for a user
 * In dummy mode, user_id is sent in request body
 */

async function getMyEntries(req, res) {
    console.log("[GET /api/standup] Incoming request...");
    console.log("Query params:", req.query);
  try {
    const user_id = Number(req.query.user_id);
     console.log("Parsed user_id:", user_id);

    // const { user_id } = req.body; // read user_id from frontend
    
    if (!user_id) {
      return res.status(400).json({ error: 'user_id_required' });
    }
    const entries = await getUserStandupEntries(user_id);
    res.json({ entries });
  } catch (err) {
    console.error('user id in getmyentries', {user_id});
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
    const { user_id, name, content, sentiment_personal, sentiment_team, sentiment_course } = req.body;
    console.log("➡️ [POST /api/standup] Incoming request...");
    console.log("Request body:", req.body);
    console.log("Parsed fields:", {
        user_id,
        name,
        content_length: content?.length,
        sentiment_personal,
        sentiment_team,
        sentiment_course
      });

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
      sentiment_personal: Number(sentiment_personal), 
      sentiment_team: Number(sentiment_team),
      sentiment_course: Number(sentiment_course)
    });
    res.status(201).json({ entry });
    console.log("✅ New standup entry created:", entry);

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
        const { course_id, type, message } = req.body;

        if (!course_id || !type || !message) {
          return res.status(400).json({ error: 'Course ID, type, and message are required.' });
        }

        // Delegates to use case for validation and persistence
        await createAnonymousFeedback({
          course_id: Number(course_id),
          type: type.toUpperCase(),
          message,
        });

        res.status(201).json({ message: 'Feedback posted successfully and anonymously.' });

      } catch (err) {
        console.error('postAnonymousFeedback error:', err);
        res.status(500).json({ error: err.message || 'Failed to post feedback.' });
      }
    }

// /**
//  *GET /api/standup/course/:courseId
//  * Get standup entries for a specific course (Instructor/TA view)
//  */
// async function getCourseEntries(req, res) {
//   try {
//     const courseId = Number(req.params.courseId);
//     if (!Number.isInteger(courseId)) {
//       return res.status(400).json({ error: 'invalid_course_id' });
//     }
//     const entries = await getCourseStandupEntries(courseId);
//     res.json({ entries });
//   } catch (err) {
//     console.error('getCourseEntries error:', err);
//     res.status(500).json({ error: 'Failed to fetch course standup entries' });
//   }
// }

 return Object.freeze({
    getMyEntries,
    createEntry,
    postAnonymousFeedback
  });
}

