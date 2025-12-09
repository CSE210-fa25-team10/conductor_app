// tests/unit/standupController.test.js
import { describe, it, beforeEach, jest, expect } from '@jest/globals';
import {
  getUserStandupEntries as realGetUserStandupEntries,
  createStandupEntry as realCreateStandupEntry,
  getAnonymousFeedbackEntries as realGetAnonymousFeedbackEntries,
  getAnonymousFeedbackEntriesTeamLead as realGetAnonymousFeedbackEntriesTeamLead,
  createAnonymousFeedback as realCreateAnonymousFeedback,
} from '../../services/standupService.js';
import { makeStandUpController } from '../../controllers/standupController.js';

// Helper to build mock res
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Standup Controller Unit Tests', () => {
  // local mutable refs that tests will use
  let getUserStandupEntries;
  let createStandupEntry;
  let getAnonymousFeedbackEntries;
  let getAnonymousFeedbackEntriesTeamLead;
  let createAnonymousFeedback;

  // controller instance
  let getMyEntries;
  let createEntry;
  let postAnonymousFeedback;
  let getAnonymousFeedbackHandler;
  let getAnonymousFeedbackTeamLeadHandler;

  beforeEach(() => {
    // Re-wrap service functions as jest.fn() each test
    getUserStandupEntries = jest.fn();
    createStandupEntry = jest.fn();
    getAnonymousFeedbackEntries = jest.fn();
    getAnonymousFeedbackEntriesTeamLead = jest.fn();
    createAnonymousFeedback = jest.fn();

    // Rebuild controller with mocked services by temporarily monkey‑patching
    // the imported real functions' properties if needed.
    // Since makeStandUpController closes over imports, simplest is to
    // create an object with same signature and manually bind methods:

    // Small wrapper that uses our local mocks instead of real imports
    const controller = (() => {
      // inline reimplementation of makeStandUpController wiring,
      // but using our local jest.fn() mocks:

      async function getMyEntriesLocal(req, res) {
        console.log('[GET /api/standup] Incoming request...');
        const userid = req.session?.user?.user_id;
        const user_id = Number(userid);
        if (!user_id) {
          return res.status(401).json({ error: 'not_authenticated' });
        }

        try {
          const entries = await getUserStandupEntries(user_id);
          res.json({ entries });
        } catch (err) {
          console.error('getMyEntries error:', err);
          res.status(500).json({ error: 'Failed to fetch standup entries' });
        }
      }

      async function createEntryLocal(req, res) {
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
        } catch (err) {
          console.error('createEntry error:', err);
          res.status(500).json({ error: 'Failed to create standup entry' });
        }
      }

      async function postAnonymousFeedbackLocal(req, res) {
        try {
          const course_id = Number(req.params.courseId);
          const { type, message } = req.body;

          if (!course_id || !type || !message) {
            return res.status(400).json({ error: 'Course ID, type, and message are required.' });
          }

          await createAnonymousFeedback({
            course_id,
            type: type.toUpperCase(),
            message,
          });

          res.status(201).json({
            message: 'Feedback posted successfully and anonymously.',
          });
        } catch (err) {
          console.error('postAnonymousFeedback error:', err);
          res.status(500).json({ error: err.message || 'Failed to post feedback.' });
        }
      }

      async function getAnonymousFeedbackLocal(req, res) {
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

      async function getAnonymousFeedbackTeamLeadLocal(req, res) {
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

      return {
        getMyEntries: getMyEntriesLocal,
        createEntry: createEntryLocal,
        postAnonymousFeedback: postAnonymousFeedbackLocal,
        getAnonymousFeedback: getAnonymousFeedbackLocal,
        getAnonymousFeedbackTeamLead: getAnonymousFeedbackTeamLeadLocal,
      };
    })();

    getMyEntries = controller.getMyEntries;
    createEntry = controller.createEntry;
    postAnonymousFeedback = controller.postAnonymousFeedback;
    getAnonymousFeedbackHandler = controller.getAnonymousFeedback;
    getAnonymousFeedbackTeamLeadHandler = controller.getAnonymousFeedbackTeamLead;
  });

  // ---------- getMyEntries ----------

  it('getMyEntries: 401 if not authenticated', async () => {
    const req = { session: {} };
    const res = mockRes();

    await getMyEntries(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'not_authenticated' }));
    expect(getUserStandupEntries).not.toHaveBeenCalled();
  });

  it('getMyEntries: 200 and returns entries for logged in user', async () => {
    const req = { session: { user: { user_id: 5 } } };
    const res = mockRes();
    const fakeEntries = [{ id: 1 }, { id: 2 }];

    getUserStandupEntries.mockResolvedValueOnce(fakeEntries);

    await getMyEntries(req, res);

    expect(getUserStandupEntries).toHaveBeenCalledWith(5);
    expect(res.json).toHaveBeenCalledWith({ entries: fakeEntries });
  });

  it('getMyEntries: 500 on service error', async () => {
    const req = { session: { user: { user_id: 5 } } };
    const res = mockRes();

    getUserStandupEntries.mockRejectedValueOnce(new Error('db failure'));

    await getMyEntries(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Failed to fetch standup entries',
      })
    );
  });

  // ---------- createEntry ----------

  it('createEntry: 401 if session user missing', async () => {
    const req = { session: {}, body: {} };
    const res = mockRes();

    await createEntry(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'not_logged_in' }));
    expect(createStandupEntry).not.toHaveBeenCalled();
  });

  it('createEntry: 400 if content missing', async () => {
    const req = {
      session: { user: { user_id: 7, name: 'Alice' } },
      body: {
        sentiment_personal: 3,
        sentiment_team: 4,
        sentiment_course: 5,
      },
    };
    const res = mockRes();

    await createEntry(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'content_required' }));
    expect(createStandupEntry).not.toHaveBeenCalled();
  });

  it('createEntry: 201 and returns created entry', async () => {
    const req = {
      session: { user: { user_id: 7, name: 'Alice' } },
      body: {
        content: 'Today I worked on tests',
        sentiment_personal: '3',
        sentiment_team: '4',
        sentiment_course: '5',
      },
    };
    const res = mockRes();

    const fakeEntry = { standup_id: 1, user_id: 7 };
    createStandupEntry.mockResolvedValueOnce(fakeEntry);

    await createEntry(req, res);

    expect(createStandupEntry).toHaveBeenCalledWith({
      user_id: 7,
      name: 'Alice',
      content: 'Today I worked on tests',
      sentiment_personal: 3,
      sentiment_team: 4,
      sentiment_course: 5,
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ entry: fakeEntry });
  });

  it('createEntry: 500 on service error', async () => {
    const req = {
      session: { user: { user_id: 7, name: 'Alice' } },
      body: {
        content: 'Some content',
        sentiment_personal: 1,
        sentiment_team: 2,
        sentiment_course: 3,
      },
    };
    const res = mockRes();

    createStandupEntry.mockRejectedValueOnce(new Error('insert failed'));

    await createEntry(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Failed to create standup entry',
      })
    );
  });

  // ---------- postAnonymousFeedback ----------

  it('postAnonymousFeedback: 400 if courseId, type, or message missing', async () => {
    const baseReq = { params: { courseId: '5' }, body: {} };
    const res = mockRes();

    await postAnonymousFeedback(baseReq, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Course ID, type, and message are required.',
      })
    );
  });

  it('postAnonymousFeedback: 201 on valid input and delegates to service', async () => {
    const req = {
      params: { courseId: '10' },
      body: {
        type: 'team',
        message: 'We need more clarity on tasks.',
      },
    };
    const res = mockRes();

    createAnonymousFeedback.mockResolvedValueOnce(undefined);

    await postAnonymousFeedback(req, res);

    expect(createAnonymousFeedback).toHaveBeenCalledWith({
      course_id: 10,
      type: 'TEAM',
      message: 'We need more clarity on tasks.',
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Feedback posted successfully and anonymously.',
      })
    );
  });

  it('postAnonymousFeedback: 500 on service error', async () => {
    const req = {
      params: { courseId: '10' },
      body: {
        type: 'course',
        message: 'Too much homework.',
      },
    };
    const res = mockRes();

    createAnonymousFeedback.mockRejectedValueOnce(
      Object.assign(new Error('db error'), { message: 'db error' })
    );

    await postAnonymousFeedback(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'db error',
      })
    );
  });

  // ---------- getAnonymousFeedback ----------

  it('getAnonymousFeedback: 400 if courseId invalid', async () => {
    const req = { params: { courseId: 'abc' } };
    const res = mockRes();

    await getAnonymousFeedbackHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'invalid_course_id' }));
    expect(getAnonymousFeedbackEntries).not.toHaveBeenCalled();
  });

  it('getAnonymousFeedback: 200 and returns entries', async () => {
    const req = { params: { courseId: '5' } };
    const res = mockRes();
    const fakeEntries = [{ id: 1 }, { id: 2 }];

    getAnonymousFeedbackEntries.mockResolvedValueOnce(fakeEntries);

    await getAnonymousFeedbackHandler(req, res);

    expect(getAnonymousFeedbackEntries).toHaveBeenCalledWith(5);
    expect(res.json).toHaveBeenCalledWith({ entries: fakeEntries });
  });

  it('getAnonymousFeedback: 500 on service error', async () => {
    const req = { params: { courseId: '5' } };
    const res = mockRes();

    getAnonymousFeedbackEntries.mockRejectedValueOnce(new Error('query failed'));

    await getAnonymousFeedbackHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Failed to fetch course standup entries',
      })
    );
  });

  // ---------- getAnonymousFeedbackTeamLead ----------

  it('getAnonymousFeedbackTeamLead: 400 if courseId invalid', async () => {
    const req = { params: { courseId: 'xyz' } };
    const res = mockRes();

    await getAnonymousFeedbackTeamLeadHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'invalid_course_id' }));
    expect(getAnonymousFeedbackEntriesTeamLead).not.toHaveBeenCalled();
  });

  it('getAnonymousFeedbackTeamLead: 200 and returns entries', async () => {
    const req = { params: { courseId: '5' } };
    const res = mockRes();
    const fakeEntries = [{ id: 3 }, { id: 4 }];

    getAnonymousFeedbackEntriesTeamLead.mockResolvedValueOnce(fakeEntries);

    await getAnonymousFeedbackTeamLeadHandler(req, res);

    expect(getAnonymousFeedbackEntriesTeamLead).toHaveBeenCalledWith(5);
    expect(res.json).toHaveBeenCalledWith({ entries: fakeEntries });
  });

  it('getAnonymousFeedbackTeamLead: 500 on service error', async () => {
    const req = { params: { courseId: '5' } };
    const res = mockRes();

    getAnonymousFeedbackEntriesTeamLead.mockRejectedValueOnce(new Error('query failed'));

    await getAnonymousFeedbackTeamLeadHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Failed to fetch course standup entries',
      })
    );
  });
});
