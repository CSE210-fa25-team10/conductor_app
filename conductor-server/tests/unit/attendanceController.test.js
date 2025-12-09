// // conductor-server/tests/unit/attendanceController.test.js
// import { describe, it } from '@jest/globals';
// // import { checkinAttendance } from '../../controllers/attendanceController.js';
// // Mock internal helpers and database access
// // import { pool } from '../../db.js';

// // jest.mock('../../db.js', () => ({
// //   pool: {
// //     query: jest.fn(),
// //   },
// // }));

// // const mockRes = () => {
// //   const res = {};
// //   res.status = jest.fn().mockReturnValue(res);
// //   res.json = jest.fn().mockReturnValue(res);
// //   return res;
// // };

// describe('Attendance Controller Unit Tests', () => {
//   // Test parameters
//   const TEST_ACTIVITY_ID = 10;
//   const TEST_COURSE_ID = 5;
//   const TEST_EMAIL = 'student@course.edu';

//   // NOTE: You would need to mock the external helpers like computePin and isWithinWindow
//   // to ensure they return deterministic results for testing the controller logic.

//   it('should successfully check in a student via manual PIN and course ID', async () => {
//     // Mock all the necessary database calls (get user, get activity, check enrollment, upsert)
//     // const req = { body: { course_id: TEST_COURSE_ID, pin: '000000', email: TEST_EMAIL } };
//     // const res = mockRes();

//     // await checkinAttendance(req, res);
//     // expect(res.status).toHaveBeenCalledWith(200);
//     console.log('Check-in Success Test Placeholder: Implement mocks and assertions.');
//   });

//   it('should return 400 if the PIN is invalid', async () => {
//     // Mock to force the PIN validation to fail for a known activity
//     // const req = { body: { course_id: TEST_COURSE_ID, pin: '999999', email: TEST_EMAIL } };
//     // const res = mockRes();

//     // await checkinAttendance(req, res);
//     // expect(res.status).toHaveBeenCalledWith(400);
//     // expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'invalid_pin' }));
//     console.log('Check-in Invalid PIN Test Placeholder: Implement mocks and check error.');
//   });
// });

// conductor-server/tests/unit/attendanceController.test.js
import { describe, it, beforeEach, jest, expect } from '@jest/globals';
import QRCode from 'qrcode';
import { pool } from '../../db.js';
import { makeAttendanceController } from '../../controllers/attendanceController.js';

// Helper to build mock res
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

import crypto from 'node:crypto';

// helper in test file
function computeTestPin(activityId) {
  const secret = process.env.ATTENDANCE_PIN_SECRET || 'dev-attendance-secret';
  const hmac = crypto.createHmac('sha256', secret).update(String(activityId)).digest('hex');
  const num = parseInt(hmac.slice(0, 8), 16) % 1_000_000;
  return String(num).padStart(6, '0');
}

describe('Attendance Controller Unit Tests', () => {
  const controller = makeAttendanceController();
  const {
    startAttendanceSession,
    checkinAttendance,
    manualMarkAttendance,
    getCourseAttendanceSummary,
    getCourseGroupAttendanceSummary,
    getStudentsInGroup,
    getCourseGroupAndMemberOverview,
    getStudentCourseAttendanceOverview,
  } = controller;

  beforeEach(() => {
    // Make pool.query a Jest mock for each test
    pool.query = jest.fn();
    // Make QRCode.toDataURL a Jest mock for each test
    QRCode.toDataURL = jest.fn();

    jest.clearAllMocks();
  });

  // ---------- startAttendanceSession ----------

  it('startAttendanceSession: 400 if courseId not integer', async () => {
    const req = {
      params: { courseId: 'abc' },
      body: { name: 'Lecture 1', type: 'lecture' },
    };
    const res = mockRes();

    await startAttendanceSession(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'course_id must be an integer' })
    );
  });

  it('startAttendanceSession: 400 if name missing', async () => {
    const req = {
      params: { courseId: '5' },
      body: { type: 'lecture' },
    };
    const res = mockRes();

    await startAttendanceSession(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'name is required (e.g., "Lecture 5")' })
    );
  });

  it('startAttendanceSession: 201 and returns activity + pin + qr url', async () => {
    const fakeActivity = {
      activity_id: 10,
      course_id: 5,
      name: 'Lecture 1',
      type: 'lecture',
      starts_at: new Date().toISOString(),
    };

    pool.query.mockResolvedValueOnce({ rows: [fakeActivity] });
    QRCode.toDataURL.mockResolvedValueOnce('data:image/png;base64,fakeqr');

    const req = {
      params: { courseId: '5' },
      body: { name: 'Lecture 1', type: 'lecture' },
    };
    const res = mockRes();

    await startAttendanceSession(req, res);

    expect(pool.query).toHaveBeenCalledTimes(1);
    expect(QRCode.toDataURL).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(201);
    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg).toEqual(
      expect.objectContaining({
        activity_id: fakeActivity.activity_id,
        course_id: fakeActivity.course_id,
        name: fakeActivity.name,
        type: fakeActivity.type,
        starts_at: fakeActivity.starts_at,
        pin: expect.any(String),
        checkin_url: expect.stringContaining(`activity_id=${fakeActivity.activity_id}`),
        qr_code_data_url: 'data:image/png;base64,fakeqr',
      })
    );
  });

  it('startAttendanceSession: 500 on DB error', async () => {
    pool.query.mockRejectedValueOnce(new Error('db failure'));
    const req = {
      params: { courseId: '5' },
      body: { name: 'Lecture 1', type: 'lecture' },
    };
    const res = mockRes();

    await startAttendanceSession(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'failed_to_start_attendance_session',
      })
    );
  });

  // ---------- checkinAttendance basic validation ----------

  it('checkinAttendance: 400 if email missing and no session user', async () => {
    const req = {
      body: { pin: '123456', course_id: 5 },
      session: {},
    };
    const res = mockRes();

    await checkinAttendance(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'email is required' }));
  });

  it('checkinAttendance: 400 if pin invalid format', async () => {
    // Make email lookup return some user_id
    pool.query.mockResolvedValueOnce({ rows: [{ user_id: 1 }] });

    const req = {
      body: { pin: '12345', course_id: 5, email: 'student@course.edu' },
      session: {},
    };
    const res = mockRes();

    await checkinAttendance(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'pin must be a 6-digit string' })
    );
  });

  it('checkinAttendance (manual): 404 if no active activity in window', async () => {
    // 1st query: get user_id by email
    pool.query
      .mockResolvedValueOnce({ rows: [{ user_id: 1 }] }) // users
      .mockResolvedValueOnce({ rows: [] }); // activities in window

    const req = {
      body: {
        course_id: '5',
        pin: '123456',
        email: 'student@course.edu',
      },
      session: {},
    };
    const res = mockRes();

    await checkinAttendance(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'no_active_activity_for_course_in_window',
      })
    );
  });

  it('checkinAttendance (manual): 400 if outside attendance window', async () => {
    const now = Date.now();
    const past = new Date(now - 60 * 60 * 1000).toISOString(); // 1 hour ago

    pool.query
      .mockResolvedValueOnce({ rows: [{ user_id: 1 }] }) // users
      .mockResolvedValueOnce({
        rows: [
          {
            activity_id: 10,
            course_id: 5,
            name: 'Lecture 1',
            type: 'lecture',
            starts_at: past,
          },
        ],
      }); // activities in window (logic will still call isWithinWindow with past)

    const req = {
      body: {
        course_id: '5',
        pin: '123456',
        email: 'student@course.edu',
      },
      session: {},
    };
    const res = mockRes();

    await checkinAttendance(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'outside_attendance_window' })
    );
  });

  it('checkinAttendance (QR): 400 if activity_id not integer', async () => {
    // email lookup ok
    pool.query.mockResolvedValueOnce({ rows: [{ user_id: 1 }] });

    const req = {
      body: {
        activity_id: 'abc',
        pin: '123456',
        email: 'student@course.edu',
      },
      session: {},
    };
    const res = mockRes();

    await checkinAttendance(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'activity_id must be an integer' })
    );
  });

  it('checkinAttendance: 400 if invalid PIN for resolved activity', async () => {
    const now = new Date().toISOString();

    // users
    pool.query
      .mockResolvedValueOnce({ rows: [{ user_id: 1 }] }) // getStudentUserIdByEmail
      .mockResolvedValueOnce({
        rows: [
          {
            activity_id: 10,
            course_id: 5,
            name: 'Lecture 1',
            type: 'lecture',
            starts_at: now,
          },
        ],
      }) // activities in window
      .mockResolvedValueOnce({ rows: [{ role: 'student' }] }); // assertStudentEnrolled

    const req = {
      body: {
        course_id: '5',
        pin: '000001', // will not match computed pin for activity_id 10 for default secret
        email: 'student@course.edu',
      },
      session: {},
    };
    const res = mockRes();

    await checkinAttendance(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'invalid_pin' }));
  });

  it('checkinAttendance: 200 on valid manual check-in and returns attendance', async () => {
    const now = new Date().toISOString();
    process.env.ATTENDANCE_PIN_SECRET = 'dev-attendance-secret';

    pool.query
      .mockResolvedValueOnce({ rows: [{ user_id: 1 }] }) // getStudentUserIdByEmail
      .mockResolvedValueOnce({
        rows: [
          {
            activity_id: 10,
            course_id: 5,
            name: 'Lecture 1',
            type: 'lecture',
            starts_at: now,
          },
        ],
      }) // latest activity
      .mockResolvedValueOnce({ rows: [{ role: 'student' }] }) // assertStudentEnrolled
      .mockResolvedValueOnce({
        rows: [
          {
            user_id: 1,
            activity_id: 10,
            present: true,
            checked_in_at: now,
          },
        ],
      }); // upsertAttendance

    const pin = computeTestPin(10); // exact same as controller

    const req = {
      body: {
        course_id: '5',
        pin,
        email: 'student@course.edu',
        roll_id: 'R1',
      },
      session: {},
    };
    const res = mockRes();

    await checkinAttendance(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const json = res.json.mock.calls[0][0];
    expect(json).toEqual(
      expect.objectContaining({
        message: 'checkin_success',
        attendance: expect.objectContaining({
          user_id: 1,
          activity_id: 10,
          present: true,
        }),
        activity: expect.objectContaining({
          activity_id: 10,
          course_id: 5,
        }),
        roll_id: 'R1',
      })
    );
  });

  // ---------- manualMarkAttendance ----------

  it('manualMarkAttendance: 400 if ids not integers', async () => {
    const req = {
      params: { courseId: '5' },
      body: { activity_id: 'abc', user_id: '1', present: true },
    };
    const res = mockRes();

    await manualMarkAttendance(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'activity_id and user_id must both be integers',
      })
    );
  });

  it('manualMarkAttendance: 400 if present not boolean', async () => {
    const req = {
      params: { courseId: '5' },
      body: { activity_id: 10, user_id: 1, present: 'yes' },
    };
    const res = mockRes();

    await manualMarkAttendance(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'present must be boolean' })
    );
  });

  it('manualMarkAttendance: 200 and returns updated attendance', async () => {
    const now = new Date().toISOString();
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          user_id: 2,
          activity_id: 10,
          present: false,
          checked_in_at: now,
        },
      ],
    });

    const req = {
      params: { courseId: '5' },
      body: { activity_id: 10, user_id: 2, present: false },
    };
    const res = mockRes();

    await manualMarkAttendance(req, res);

    expect(pool.query).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'attendance_updated',
        attendance: expect.objectContaining({
          user_id: 2,
          activity_id: 10,
          present: false,
        }),
      })
    );
  });

  // ---------- getStudentsInGroup ----------

  it('getStudentsInGroup: returns list of students', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        { user_id: 1, name: 'Alice' },
        { user_id: 2, name: 'Bob' },
      ],
    });

    const req = { params: { groupId: '7' } };
    const res = mockRes();

    await getStudentsInGroup(req, res);

    expect(pool.query).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith([
      { user_id: 1, name: 'Alice' },
      { user_id: 2, name: 'Bob' },
    ]);
  });

  // ---------- getCourseGroupAttendanceSummary ----------

  it('getCourseGroupAttendanceSummary: 400 if courseId not integer', async () => {
    const req = { params: { courseId: 'abc' } };
    const res = mockRes();

    await getCourseGroupAttendanceSummary(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'course_id must be an integer' })
    );
  });

  it('getCourseGroupAttendanceSummary: 200 and groups structure', async () => {
    const now = new Date().toISOString();
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          group_id: 1,
          group_name: 'Team A',
          activity_id: 10,
          activity_name: 'L1',
          starts_at: now,
          present_users: [1, 2],
        },
        {
          group_id: 1,
          group_name: 'Team A',
          activity_id: 11,
          activity_name: 'L2',
          starts_at: now,
          present_users: [2],
        },
      ],
    });

    const req = { params: { courseId: '5' } };
    const res = mockRes();

    await getCourseGroupAttendanceSummary(req, res);

    expect(pool.query).toHaveBeenCalledTimes(1);
    const json = res.json.mock.calls[0][0];
    expect(json).toEqual(
      expect.objectContaining({
        course_id: 5,
        groups: [
          expect.objectContaining({
            group_id: 1,
            name: 'Team A',
            activities: expect.arrayContaining([
              expect.objectContaining({
                activity_id: 10,
                present_users: [1, 2],
              }),
              expect.objectContaining({
                activity_id: 11,
                present_users: [2],
              }),
            ]),
          }),
        ],
      })
    );
  });

  // ---------- getCourseAttendanceSummary ----------

  it('getCourseAttendanceSummary: 400 if courseId not integer', async () => {
    const req = { params: { courseId: 'xyz' } };
    const res = mockRes();

    await getCourseAttendanceSummary(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'course_id must be an integer' })
    );
  });

  it('getCourseAttendanceSummary: 200 with computed stats', async () => {
    const now = new Date().toISOString();
    // activities
    pool.query
      .mockResolvedValueOnce({
        rows: [
          { activity_id: 10, name: 'L1', starts_at: now, type: 'lecture' },
          { activity_id: 11, name: 'L2', starts_at: now, type: 'lecture' },
        ],
      })
      // students
      .mockResolvedValueOnce({
        rows: [
          { user_id: 1, name: 'Alice' },
          { user_id: 2, name: 'Bob' },
        ],
      })
      // attendance rows
      .mockResolvedValueOnce({
        rows: [
          { user_id: 1, activity_id: 10, present: true },
          { user_id: 1, activity_id: 11, present: false },
          { user_id: 2, activity_id: 10, present: true },
          { user_id: 2, activity_id: 11, present: true },
        ],
      });

    const req = { params: { courseId: '5' } };
    const res = mockRes();

    await getCourseAttendanceSummary(req, res);

    const json = res.json.mock.calls[0][0];
    expect(json.total_sessions).toBe(2);
    expect(json.student_count).toBe(2);
    // Alice: 1/2 -> 50.0
    // Bob: 2/2 -> 100.0
    const alice = json.students.find((s) => s.user_id === 1);
    const bob = json.students.find((s) => s.user_id === 2);
    expect(alice.percent).toBe(50);
    expect(bob.percent).toBe(100);
  });

  // ---------- getCourseGroupAndMemberOverview ----------

  it('getCourseGroupAndMemberOverview: 400 if courseId not integer', async () => {
    const req = { params: { courseId: 'abc' } };
    const res = mockRes();

    await getCourseGroupAndMemberOverview(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'course_id must be an integer' })
    );
  });

  it('getCourseGroupAndMemberOverview: 200 with group + members', async () => {
    const now = new Date().toISOString();

    // fetchCourseActivities
    pool.query
      .mockResolvedValueOnce({
        rows: [{ activity_id: 10, name: 'L1', starts_at: now, type: 'lecture' }],
      })
      // groupRows
      .mockResolvedValueOnce({
        rows: [{ group_id: 1, name: 'Team A' }],
      })
      // memberRows
      .mockResolvedValueOnce({
        rows: [
          { group_id: 1, user_id: 1, name: 'Alice' },
          { group_id: 1, user_id: 2, name: 'Bob' },
        ],
      })
      // fetchAttendanceForCourse
      .mockResolvedValueOnce({
        rows: [
          { user_id: 1, activity_id: 10, present: true },
          { user_id: 2, activity_id: 10, present: false },
        ],
      });

    const req = { params: { courseId: '5' } };
    const res = mockRes();

    await getCourseGroupAndMemberOverview(req, res);

    const json = res.json.mock.calls[0][0];
    expect(json.groups).toHaveLength(1);
    expect(json.groups[0]).toEqual(
      expect.objectContaining({
        group_id: 1,
        name: 'Team A',
        members: expect.arrayContaining([
          expect.objectContaining({ user_id: 1 }),
          expect.objectContaining({ user_id: 2 }),
        ]),
      })
    );
  });

  // ---------- getStudentCourseAttendanceOverview ----------

  it('getStudentCourseAttendanceOverview: 400 if ids not integers', async () => {
    const req = { params: { courseId: 'abc', userId: 'xyz' }, session: {} };
    const res = mockRes();

    await getStudentCourseAttendanceOverview(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'course_id and user_id must be integers',
      })
    );
  });

  it('getStudentCourseAttendanceOverview: 404 if user not found', async () => {
    const now = new Date().toISOString();

    pool.query
      .mockResolvedValueOnce({
        rows: [{ activity_id: 10, name: 'L1', starts_at: now, type: 'lecture' }],
      }) // activities
      .mockResolvedValueOnce({ rows: [] }); // userRows

    const req = { params: { courseId: '5', userId: '1' }, session: {} };
    const res = mockRes();

    await getStudentCourseAttendanceOverview(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'user_not_found' }));
  });

  it('getStudentCourseAttendanceOverview: 200 with personal + group overview', async () => {
    const now = new Date().toISOString();

    // activities
    pool.query
      .mockResolvedValueOnce({
        rows: [{ activity_id: 10, name: 'L1', starts_at: now, type: 'lecture' }],
      })
      // userRows
      .mockResolvedValueOnce({
        rows: [{ user_id: 1, name: 'Alice' }],
      })
      // myAttendanceRows
      .mockResolvedValueOnce({
        rows: [{ activity_id: 10, present: true }],
      })
      // myGroups
      .mockResolvedValueOnce({
        rows: [{ group_id: 1, name: 'Team A' }],
      })
      // getCourseGroupAndMemberOverviewInternal -> fetchCourseActivities
      .mockResolvedValueOnce({
        rows: [{ activity_id: 10, name: 'L1', starts_at: now, type: 'lecture' }],
      })
      // groupRows
      .mockResolvedValueOnce({
        rows: [{ group_id: 1, name: 'Team A' }],
      })
      // memberRows
      .mockResolvedValueOnce({
        rows: [{ group_id: 1, user_id: 1, name: 'Alice' }],
      })
      // fetchAttendanceForCourse
      .mockResolvedValueOnce({
        rows: [{ user_id: 1, activity_id: 10, present: true }],
      });

    const req = { params: { courseId: '5', userId: '1' }, session: {} };
    const res = mockRes();

    await getStudentCourseAttendanceOverview(req, res);

    const json = res.json.mock.calls[0][0];
    expect(json.me).toEqual(
      expect.objectContaining({
        user_id: 1,
        name: 'Alice',
        attended: 1,
        total_sessions: 1,
        percent: 100,
      })
    );
    expect(json.groups).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          group_id: 1,
          name: 'Team A',
          overall_percent: 100,
        }),
      ])
    );
  });
});
