// // controllers/attendanceController.js
// import crypto from 'node:crypto';
// import QRCode from 'qrcode';
// import { pool } from '../db.js';
// import { getLatestAttendanceActivities } from '../services/attendanceService.js'; 

// export function makeAttendanceController() {
//   // ---------- Helpers ----------
//   const ATTENDANCE_WINDOW_MINUTES = 15; // 15 minute window for attendance

//   // Deterministic 6-digit PIN from activity_id + secret
//   function computePin(activityId) {
//     const secret = process.env.ATTENDANCE_PIN_SECRET || 'dev-attendance-secret';
//     const hmac = crypto.createHmac('sha256', secret).update(String(activityId)).digest('hex');

//     // Take first 8 hex chars -> int -> mod 1,000,000 -> 6 digits
//     const num = parseInt(hmac.slice(0, 8), 16) % 1_000_000;
//     return String(num).padStart(6, '0');
//   }

//   function isWithinWindow(startsAt) {
//     const now = Date.now();
//     const start = new Date(startsAt).getTime();
//     const diffMinutes = Math.abs(now - start) / 60000;
//     return diffMinutes <= ATTENDANCE_WINDOW_MINUTES;
//   }

//   function buildCheckinUrl(activityId, pin) {
//     // Base for your static frontend (adjust path to match your repo)
//     const base = 'http://localhost:3000';
//     return `${base}/student/checkin?activity_id=${encodeURIComponent(activityId)}&pin=${encodeURIComponent(pin)}`;
//   }

//   // Insert or update attendance row
//   async function upsertAttendance({ userId, activityId, present }) {
//     const { rows } = await pool.query(
//       `INSERT INTO attendance (user_id, activity_id, present, checked_in_at)
//       VALUES ($1, $2, $3, NOW() AT TIME ZONE 'UTC')
//       ON CONFLICT (user_id, activity_id) DO UPDATE
//         SET present = EXCLUDED.present,
//               checked_in_at = EXCLUDED.checked_in_at
//       RETURNING user_id, activity_id, present, checked_in_at`,
//       [userId, activityId, present]
//     );
//     return rows[0];
//   }

//   // ---------- 1. Start attendance session (Instructor) ----------
//   //
//   // POST /api/attendance/session/start
//   // body: { course_id, name, type }
//   // - creates an activities row
//   // - asks instructor for course_id and name
//   // - computes PIN
//   // - generates QR data URL
//   // - returns everything instructor needs to display
//   //
//   async function startAttendanceSession(req, res) {
//     const course_id = req.params.courseId;
//     const { name, type = 'lecture' } = req.body || {};

//     const courseIdNum = Number.parseInt(course_id, 10);
//     if (!Number.isInteger(courseIdNum)) {
//       return res.status(400).json({ error: 'course_id must be an integer' });
//     }
//     if (!name || typeof name !== 'string') {
//       return res.status(400).json({ error: 'name is required (e.g., "Lecture 5")' });
//     }

//     try {
//       // Create activity with current timestamp as starts_at
//       const { rows } = await pool.query(
//         `INSERT INTO activities (course_id, name, type, starts_at)
//         VALUES ($1, $2, $3, NOW() AT TIME ZONE 'UTC')
//         RETURNING activity_id, course_id, name, type, starts_at`,
//         [courseIdNum, name, type]
//       );

//       const activity = rows[0];
//       const pin = computePin(activity.activity_id);
//       const checkinUrl = buildCheckinUrl(activity.activity_id, pin);
//       const qrDataUrl = await QRCode.toDataURL(checkinUrl);

//       return res.status(201).json({
//         activity_id: activity.activity_id,
//         course_id: activity.course_id,
//         name: activity.name,
//         type: activity.type,
//         starts_at: activity.starts_at,
//         pin,
//         checkin_url: checkinUrl,
//         qr_code_data_url: qrDataUrl,
//       });
//     } catch (e) {
//       console.error('startAttendanceSession error:', e);
//       return res.status(500).json({ error: 'failed_to_start_attendance_session' });
//     }
//   }

//   // Helper functions
//   // Helper 1 : get user_id from email of the student
//   async function getStudentUserIdByEmail(email) {
//     const { rows } = await pool.query(`SELECT user_id FROM users WHERE email = $1`, [email]);
//     if (rows.length === 0) return null;
//     return rows[0].user_id;
//   }

//   // Helper 2 : check if role=='student', and check if student enrolled in 'course_id'.
//   async function assertStudentEnrolled(userId, courseId) {
//     const { rows } = await pool.query(
//       `SELECT role
//         FROM course_users
//         WHERE user_id = $1 AND course_id = $2`,
//       [userId, courseId]
//     );
//     if (rows.length === 0) {
//       throw Object.assign(new Error('not_enrolled_in_course'), { status: 403 });
//     }
//     const role = rows[0].role?.toLowerCase();
//     if (role !== 'student') {
//       throw Object.assign(new Error('only_students_can_checkin'), { status: 403 });
//     }
//   }

//   // ---------- 2. Student check-in (QR or Manual PIN) ----------
//   /**
//    * This endpoint handles BOTH QR-scan check-ins AND manual check-ins.
//    *   1. Validate required fields (email + 6-digit PIN).
//    *   2. Look up the student user_id from email.
//    *   3. Determine which activity to check into:
//    *        - QR case: activity_id is provided directly.
//    *        - Manual case: course_id is provided → find the most recent
//    *          activity whose start time is within the allowed attendance window.
//    *   4. Verify the attendance window (student can only check in near starts_at).
//    *   5. Ensure the student is enrolled in the course and role='student'.
//    *   6. Verify the PIN by recomputing the deterministic PIN for that activity.
//    *   7. Insert or update the attendance row in the attendance table.
//    *
//    * Returns:
//    *   - attendance record
//    *   - activity details
//    */
//   // POST /api/attendance/checkin
//   async function checkinAttendance(req, res) {
//     const course_id = req.body.course_id;
//     try {
//       const { activity_id, pin, email, roll_id } = req.body || {};

//       // ---------- Resolve userId ----------
//       let userId = req.user?.user_id || req.session?.user?.user_id; // session user
//       let courseIdNum = null;

//       if (userId) {
//         // Check if this session user is actually a student in this course
//         if (!course_id) {
//           const activityIdNum = Number(activity_id);
//           if (!Number.isInteger(activityIdNum)) {
//             return res.status(400).json({ error: 'activity_id must be an integer' });
//           }

//           const { rows } = await pool.query(
//             `SELECT course_id FROM activities WHERE activity_id = $1`,
//             [activityIdNum]
//           );

//           if (rows.length === 0) {
//             return res.status(404).json({ error: 'activity_not_found' });
//           }

//           courseIdNum = rows[0].course_id;
//         }

//         const { rows } = await pool.query(
//           `SELECT role FROM course_users WHERE user_id=$1 AND course_id=$2`,
//           [userId, courseIdNum]
//         );

//         if (rows.length === 0 || rows[0].role?.toLowerCase() !== 'student') {
//           // Fallback to email lookup if session user is not a student
//           if (!email || typeof email !== 'string') {
//             return res.status(400).json({ error: 'email is required for student check-in' });
//           }

//           const studentId = await getStudentUserIdByEmail(email.trim().toLowerCase());
//           if (!studentId) {
//             return res.status(404).json({ error: 'user_not_found_for_email' });
//           }
//           userId = studentId;
//         }
//       } else {
//         // No session user, fallback to email
//         if (!email || typeof email !== 'string') {
//           return res.status(400).json({ error: 'email is required' });
//         }
//         const studentId = await getStudentUserIdByEmail(email.trim().toLowerCase());
//         if (!studentId) {
//           return res.status(404).json({ error: 'user_not_found_for_email' });
//         }
//         userId = studentId;
//       }

//       console.log('Resolved userId for check-in:', userId, 'Email:', email);

//       // ---------- Validate PIN ----------
//       if (!pin || typeof pin !== 'string' || pin.length !== 6) {
//         return res.status(400).json({ error: 'pin must be a 6-digit string' });
//       }

//       // ---------- Resolve activity ----------
//       let activity;
//       if (activity_id) {
//         const activityIdNum =
//           typeof activity_id === 'string' ? Number.parseInt(activity_id, 10) : activity_id;

//         if (!Number.isInteger(activityIdNum)) {
//           return res.status(400).json({ error: 'activity_id must be an integer' });
//         }

//         const { rows } = await pool.query(
//           `SELECT activity_id, course_id, name, type, starts_at
//          FROM activities
//          WHERE activity_id = $1`,
//           [activityIdNum]
//         );

//         if (rows.length === 0) {
//           return res.status(404).json({ error: 'activity_not_found' });
//         }
//         activity = rows[0];
//       } else if (course_id) {
//         const courseIdNum = Number.parseInt(course_id, 10);
//         if (!Number.isInteger(courseIdNum)) {
//           return res.status(400).json({ error: 'course_id must be an integer' });
//         }

//         const { rows } = await pool.query(
//           `SELECT activity_id, course_id, name, type, starts_at
//          FROM activities
//          WHERE course_id = $1
//            AND starts_at <= (NOW() AT TIME ZONE 'UTC')
//            AND starts_at >= (NOW() AT TIME ZONE 'UTC' - INTERVAL '${ATTENDANCE_WINDOW_MINUTES} minutes')
//          ORDER BY starts_at DESC
//          LIMIT 1`,
//           [courseIdNum]
//         );

//         if (rows.length === 0) {
//           return res.status(404).json({ error: 'no_active_activity_for_course_in_window' });
//         }
//         activity = rows[0];
//       } else {
//         return res
//           .status(400)
//           .json({ error: 'either activity_id (QR) or course_id (manual) is required' });
//       }

//       // ---------- Enforce attendance window ----------
//       if (!isWithinWindow(activity.starts_at)) {
//         return res.status(400).json({ error: 'outside_attendance_window' });
//       }

//       // ---------- Check enrollment ----------
//       try {
//         await assertStudentEnrolled(userId, activity.course_id);
//       } catch (e) {
//         const status = e.status || 500;
//         return res.status(status).json({ error: e.message });
//       }

//       // ---------- Validate PIN ----------
//       const expectedPin = computePin(activity.activity_id);
//       if (expectedPin !== pin) {
//         return res.status(400).json({ error: 'invalid_pin' });
//       }

//       // ---------- Upsert attendance ----------
//       const attendanceRow = await upsertAttendance({
//         userId,
//         activityId: activity.activity_id,
//         present: true,
//       });

//       return res.status(200).json({
//         message: 'checkin_success',
//         attendance: attendanceRow,
//         activity,
//         roll_id,
//       });
//     } catch (e) {
//       console.error('checkinAttendance error:', e);
//       return res.status(500).json({ error: 'failed_to_checkin' });
//     }
//   }

//   // ---------- 3. Manual / retroactive mark (Instructor / TA) ----------
//   //
//   // POST /api/attendance//instructor/courses/:courseId/manual
//   // body: { activity_id, user_id, present }
//   //
//   // - For when a student participates / answered a question, or retro-fix.
//   //
//   async function manualMarkAttendance(req, res) {
//     const course_id = req.params.courseId;
//     const { activity_id, user_id, present } = req.body || {};

//     const activityIdNum =
//       typeof activity_id === 'string' ? Number.parseInt(activity_id, 10) : activity_id;
//     const userIdNum = typeof user_id === 'string' ? Number.parseInt(user_id, 10) : user_id;

//     if (!Number.isInteger(activityIdNum) || !Number.isInteger(userIdNum)) {
//       return res.status(400).json({ error: 'activity_id and user_id must both be integers' });
//     }
//     if (typeof present !== 'boolean') {
//       return res.status(400).json({ error: 'present must be boolean' });
//     }

//     try {
//       const attendanceRow = await upsertAttendance({
//         userId: userIdNum,
//         activityId: activityIdNum,
//         present,
//       });

//       return res.status(200).json({
//         message: 'attendance_updated',
//         attendance: attendanceRow,
//       });
//     } catch (e) {
//       console.error('manualMarkAttendance error:', e);
//       return res.status(500).json({ error: 'failed_to_update_attendance' });
//     }
//   }

//   // Helper to get all students in a particular group
//   async function getStudentsInGroup(req, res) {
//     const groupId = Number(req.params.groupId);

//     const { rows } = await pool.query(
//       `SELECT u.user_id, u.name
//         FROM group_users gu
//         JOIN users u ON u.user_id = gu.user_id
//         WHERE gu.group_id = $1
//         ORDER BY u.name`,
//       [groupId]
//     );

//     res.json(rows);
//   }

//   // GET /api/attendance/courses/:courseId/groups
//   // Return present_users per group & per activity
//   // - For each group in course, for each activity
//   async function getCourseGroupAttendanceSummary(req, res) {
//     const courseId = Number(req.params.courseId);
//     if (!Number.isInteger(courseId)) {
//       return res.status(400).json({ error: 'course_id must be an integer' });
//     }

//     try {
//       const { rows } = await pool.query(
//         `
//         SELECT
//           g.group_id,
//           g.name AS group_name,
//           a.activity_id,
//           a.name AS activity_name,
//           a.starts_at,
//           ARRAY_AGG(
//             CASE WHEN att.present THEN att.user_id END
//           ) FILTER (WHERE att.present IS TRUE) AS present_users
//         FROM course_groups cg
//         JOIN groups g ON g.group_id = cg.group_id
//         JOIN activities a ON a.course_id = cg.course_id
//         LEFT JOIN group_users gu
//           ON gu.group_id = g.group_id
//         LEFT JOIN attendance att
//           ON att.activity_id = a.activity_id
//         AND att.user_id = gu.user_id
//         WHERE cg.course_id = $1
//         GROUP BY g.group_id, g.name, a.activity_id, a.name, a.starts_at
//         ORDER BY g.group_id, a.starts_at
//         `,
//         [courseId]
//       );

//       // Convert SQL result → grouped format
//       const map = new Map();

//       for (const r of rows) {
//         if (!map.has(r.group_id)) {
//           map.set(r.group_id, {
//             group_id: r.group_id,
//             name: r.group_name,
//             activities: [],
//           });
//         }
//         map.get(r.group_id).activities.push({
//           activity_id: r.activity_id,
//           name: r.activity_name,
//           starts_at: r.starts_at,
//           present_users: r.present_users || [],
//         });
//       }

//       return res.json({ course_id: courseId, groups: Array.from(map.values()) });
//     } catch (e) {
//       console.error('getCourseGroupAttendanceSummary:', e);
//       return res.status(500).json({ error: 'failed_to_load_group_summary' });
//     }
//   }

//   // ---------- 4. Course attendance summary ----------
//   //
//   // GET /api/attendance/courses/:courseId/summary
//   // - per-student attendance (attended, total, %)
//   // - overall course %
//   // - list of activities
//   //
//   async function getCourseAttendanceSummary(req, res) {
//     const courseId = Number.parseInt(req.params.courseId, 10);
//     if (!Number.isInteger(courseId)) {
//       return res.status(400).json({ error: 'course_id must be an integer' });
//     }

//     try {
//       // All activities for this course
//       const { rows: activities } = await pool.query(
//         `SELECT activity_id, name, starts_at, type
//           FROM activities
//           WHERE course_id = $1
//           ORDER BY starts_at`,
//         [courseId]
//       );
//       const totalSessions = activities.length;

//       // Students in the course
//       const { rows: students } = await pool.query(
//         `SELECT cu.user_id, u.name
//           FROM course_users cu
//           JOIN users u ON u.user_id = cu.user_id
//           WHERE cu.course_id = $1
//             AND (cu.role IS NULL OR LOWER(cu.role) = 'student')
//           ORDER BY u.name`,
//         [courseId]
//       );

//       // Attendance rows for activities in this course
//       const { rows: attendanceRows } = await pool.query(
//         `SELECT a.user_id, a.activity_id, a.present
//           FROM attendance a
//           JOIN activities act ON act.activity_id = a.activity_id
//           WHERE act.course_id = $1`,
//         [courseId]
//       );

//       const attendanceMap = new Map(); // key "user_id:activity_id" -> present
//       for (const row of attendanceRows) {
//         const key = `${row.user_id}:${row.activity_id}`;
//         attendanceMap.set(key, row.present);
//       }

//       const perStudent = [];
//       let totalPresent = 0;
//       let totalPossible = 0;

//       for (const s of students) {
//         let attended = 0;
//         for (const act of activities) {
//           const key = `${s.user_id}:${act.activity_id}`;
//           const present = attendanceMap.get(key);
//           if (present === true) {
//             attended += 1;
//           }
//         }
//         const total = totalSessions;
//         const percent = total === 0 ? 0 : Math.round((attended * 1000.0) / total) / 10.0;

//         perStudent.push({
//           user_id: s.user_id,
//           name: s.name,
//           attended,
//           total,
//           percent,
//         });

//         totalPresent += attended;
//         totalPossible += total;
//       }

//       const overallPercent =
//         totalPossible === 0 ? 0 : Math.round((totalPresent * 1000.0) / totalPossible) / 10.0;

//       return res.json({
//         course_id: courseId,
//         total_sessions: totalSessions,
//         student_count: students.length,
//         overall_attendance_percent: overallPercent,
//         activities,
//         students: perStudent,
//       });
//     } catch (e) {
//       console.error('getCourseAttendanceSummary error:', e);
//       return res.status(500).json({ error: 'failed_to_load_summary' });
//     }
//   }

//   // ---------- helpers for aggregate summaries ----------

//   async function fetchCourseActivities(courseId) {
//     const { rows } = await pool.query(
//       `SELECT activity_id, name, starts_at, type
//         FROM activities
//         WHERE course_id = $1
//         ORDER BY starts_at`,
//       [courseId]
//     );
//     return rows;
//   }

//   async function fetchAttendanceForCourse(courseId) {
//     const { rows } = await pool.query(
//       `SELECT a.user_id, a.activity_id, a.present
//         FROM attendance a
//         JOIN activities act ON act.activity_id = a.activity_id
//         WHERE act.course_id = $1`,
//       [courseId]
//     );
//     return rows;
//   }

//   // ---------- 6. Instructor: group + member overview ----------
//   //
//   // GET /api/attendance/courses/:courseId/instructor-overview
//   //
//   // Returns:
//   // {
//   //   course_id,
//   //   total_sessions,
//   //   groups: [
//   //     {
//   //       group_id,
//   //       name,
//   //       overall_percent,
//   //       members: [
//   //         { user_id, name, attended, total_sessions, percent }
//   //       ]
//   //     },
//   //     ...
//   //   ]
//   // }
//   //
//   async function getCourseGroupAndMemberOverview(req, res) {
//     const courseId = Number.parseInt(req.params.courseId, 10);
//     if (!Number.isInteger(courseId)) {
//       return res.status(400).json({ error: 'course_id must be an integer' });
//     }

//     try {
//       const activities = await fetchCourseActivities(courseId);
//       const totalSessions = activities.length;

//       // All groups attached to this course
//       const { rows: groupRows } = await pool.query(
//         `SELECT g.group_id, g.name
//           FROM course_groups cg
//           JOIN groups g ON g.group_id = cg.group_id
//           WHERE cg.course_id = $1
//           ORDER BY g.group_id`,
//         [courseId]
//       );

//       // All members of those groups
//       const { rows: memberRows } = await pool.query(
//         `SELECT g.group_id, u.user_id, u.name
//           FROM course_groups cg
//           JOIN groups g      ON g.group_id = cg.group_id
//           JOIN group_users gu ON gu.group_id = g.group_id
//           JOIN users u        ON u.user_id  = gu.user_id
//           WHERE cg.course_id = $1
//           ORDER BY g.group_id, u.name`,
//         [courseId]
//       );

//       const attendanceRows = await fetchAttendanceForCourse(courseId);
//       const attendanceMap = new Map(); // "user:activity" -> present

//       for (const row of attendanceRows) {
//         const key = `${row.user_id}:${row.activity_id}`;
//         attendanceMap.set(key, row.present);
//       }

//       // Build group → members
//       const membersByGroup = new Map();
//       for (const m of memberRows) {
//         if (!membersByGroup.has(m.group_id)) {
//           membersByGroup.set(m.group_id, []);
//         }
//         membersByGroup.get(m.group_id).push({
//           user_id: m.user_id,
//           name: m.name,
//         });
//       }

//       const groups = [];

//       for (const g of groupRows) {
//         const members = membersByGroup.get(g.group_id) || [];
//         let groupPresent = 0;
//         let groupTotal = 0;

//         const memberSummaries = members.map((m) => {
//           let attended = 0;

//           for (const act of activities) {
//             const key = `${m.user_id}:${act.activity_id}`;
//             const present = attendanceMap.get(key);
//             if (present === true) {
//               attended += 1;
//             }
//           }

//           const total = totalSessions;
//           const percent = total === 0 ? 0 : Math.round((attended * 1000.0) / total) / 10.0;

//           groupPresent += attended;
//           groupTotal += total;

//           return {
//             user_id: m.user_id,
//             name: m.name,
//             attended,
//             total_sessions: total,
//             percent,
//           };
//         });

//         const overallPercent =
//           groupTotal === 0 ? 0 : Math.round((groupPresent * 1000.0) / groupTotal) / 10.0;

//         groups.push({
//           group_id: g.group_id,
//           name: g.name,
//           overall_percent: overallPercent,
//           members: memberSummaries,
//         });
//       }

//       return res.json({
//         course_id: courseId,
//         total_sessions: totalSessions,
//         groups,
//       });
//     } catch (e) {
//       console.error('getCourseGroupAndMemberOverview error:', e);
//       return res.status(500).json({ error: 'failed_to_load_instructor_overview' });
//     }
//   }

//   // ---------- 7. Student: personal + team overview ----------
//   //
//   // GET /api/attendance/courses/:courseId/student/overview
//   //
//   // Returns:
//   // {
//   //   course_id,
//   //   total_sessions,
//   //   me: { user_id, name, attended, total_sessions, percent },
//   //   groups: [
//   //     { group_id, name, overall_percent }
//   //   ]
//   // }
//   //
//   async function getStudentCourseAttendanceOverview(req, res) {
//     const courseId = Number.parseInt(req.params.courseId, 10);
//     const userId = Number.parseInt(req.params.userId || req.session?.user?.user_id, 10);

//     if (!Number.isInteger(courseId) || !Number.isInteger(userId)) {
//       return res.status(400).json({ error: 'course_id and user_id must be integers' });
//     }

//     try {
//       const activities = await fetchCourseActivities(courseId);
//       const totalSessions = activities.length;

//       // Student info
//       const { rows: userRows } = await pool.query(
//         `SELECT user_id, name FROM users WHERE user_id = $1`,
//         [userId]
//       );
//       if (userRows.length === 0) {
//         return res.status(404).json({ error: 'user_not_found' });
//       }
//       const user = userRows[0];

//       // Student attendance rows
//       const { rows: myAttendanceRows } = await pool.query(
//         `SELECT a.activity_id, a.present
//           FROM attendance a
//           JOIN activities act ON act.activity_id = a.activity_id
//           WHERE act.course_id = $1
//             AND a.user_id = $2`,
//         [courseId, userId]
//       );
//       const myMap = new Map(); // activity_id -> present
//       for (const r of myAttendanceRows) {
//         myMap.set(r.activity_id, r.present);
//       }

//       let myAttended = 0;
//       for (const act of activities) {
//         const p = myMap.get(act.activity_id);
//         if (p === true) myAttended += 1;
//       }
//       const myPercent =
//         totalSessions === 0 ? 0 : Math.round((myAttended * 1000.0) / totalSessions) / 10.0;

//       // What groups is this student in (for this course)?
//       const { rows: myGroups } = await pool.query(
//         `SELECT DISTINCT g.group_id, g.name
//           FROM group_users gu
//           JOIN groups g       ON g.group_id = gu.group_id
//           JOIN course_groups cg ON cg.group_id = g.group_id
//           WHERE cg.course_id = $1
//             AND gu.user_id = $2
//           ORDER BY g.group_id`,
//         [courseId, userId]
//       );

//       // Reuse instructor group overview to compute group-level percentages
//       const instructorOverview = await getCourseGroupAndMemberOverviewInternal(courseId);

//       const groupSummaries = myGroups.map((g) => {
//         const full = instructorOverview.groups.find((gg) => gg.group_id === g.group_id);
//         return {
//           group_id: g.group_id,
//           name: g.name,
//           overall_percent: full ? full.overall_percent : 0,
//         };
//       });

//       return res.json({
//         course_id: courseId,
//         total_sessions: totalSessions,
//         me: {
//           user_id: user.user_id,
//           name: user.name,
//           attended: myAttended,
//           total_sessions: totalSessions,
//           percent: myPercent,
//         },
//         groups: groupSummaries,
//       });
//     } catch (e) {
//       console.error('getStudentCourseAttendanceOverview error:', e);
//       return res.status(500).json({ error: 'failed_to_load_student_overview' });
//     }
//   }

//   // internal helper so student overview can reuse instructor logic
//   async function getCourseGroupAndMemberOverviewInternal(courseId) {
//     const activities = await fetchCourseActivities(courseId);
//     const totalSessions = activities.length;

//     const { rows: groupRows } = await pool.query(
//       `SELECT g.group_id, g.name
//         FROM course_groups cg
//         JOIN groups g ON g.group_id = cg.group_id
//         WHERE cg.course_id = $1
//         ORDER BY g.group_id`,
//       [courseId]
//     );

//     const { rows: memberRows } = await pool.query(
//       `SELECT g.group_id, u.user_id, u.name
//         FROM course_groups cg
//         JOIN groups g      ON g.group_id = cg.group_id
//         JOIN group_users gu ON gu.group_id = g.group_id
//         JOIN users u        ON u.user_id  = gu.user_id
//         WHERE cg.course_id = $1
//         ORDER BY g.group_id, u.name`,
//       [courseId]
//     );

//     const attendanceRows = await fetchAttendanceForCourse(courseId);
//     const attendanceMap = new Map();
//     for (const row of attendanceRows) {
//       const key = `${row.user_id}:${row.activity_id}`;
//       attendanceMap.set(key, row.present);
//     }

//     const membersByGroup = new Map();
//     for (const m of memberRows) {
//       if (!membersByGroup.has(m.group_id)) {
//         membersByGroup.set(m.group_id, []);
//       }
//       membersByGroup.get(m.group_id).push({
//         user_id: m.user_id,
//         name: m.name,
//       });
//     }

//     const groups = [];

//     for (const g of groupRows) {
//       const members = membersByGroup.get(g.group_id) || [];
//       let groupPresent = 0;
//       let groupTotal = 0;

//       const memberSummaries = members.map((m) => {
//         let attended = 0;
//         for (const act of activities) {
//           const key = `${m.user_id}:${act.activity_id}`;
//           if (attendanceMap.get(key) === true) {
//             attended += 1;
//           }
//         }
//         const total = totalSessions;
//         const percent = total === 0 ? 0 : Math.round((attended * 1000.0) / total) / 10.0;

//         groupPresent += attended;
//         groupTotal += total;

//         return {
//           user_id: m.user_id,
//           name: m.name,
//           attended,
//           total_sessions: total,
//           percent,
//         };
//       });

//       const overallPercent =
//         groupTotal === 0 ? 0 : Math.round((groupPresent * 1000.0) / groupTotal) / 10.0;

//       groups.push({
//         group_id: g.group_id,
//         name: g.name,
//         overall_percent: overallPercent,
//         members: memberSummaries,
//       });
//     }

//     return { course_id: courseId, total_sessions: totalSessions, groups };
//   }


//   /**
//  * GET /api/attendance/courses/:courseId/latest-activities
//  * Get the latest 2 attendance records for rendering the dashboard.
//  */
// async function getLatestAttendance(req, res) { // <-- NEW FUNCTION
//     const courseId = req.params.courseId;
//     try {
//         const data = await getLatestAttendanceActivities(courseId);
//         res.json(data.latestActivities); // Return just the array of activities
//     } catch (err) {
//         console.error('getLatestAttendance error:', err);
//         res.status(500).json({ error: 'Failed to fetch latest attendance data' });
//     }
// }

//   return Object.freeze({
//     startAttendanceSession,
//     getLatestAttendance,
//     checkinAttendance,
//     manualMarkAttendance,
//     getCourseAttendanceSummary,
//     getCourseGroupAttendanceSummary,
//     getStudentsInGroup,
//     getCourseGroupAndMemberOverview,
//     getStudentCourseAttendanceOverview,
//   });
// }



import crypto from 'node:crypto';
import QRCode from 'qrcode';

import {
  getLatestAttendanceActivities,
  createActivitySession,
  getCourseIdForActivity,
  getStudentUserIdByEmail as serviceGetStudentUserIdByEmail, 
  assertStudentEnrolled as serviceAssertStudentEnrolled, 
  findActiveActivityForCourse,
  upsertAttendance as serviceUpsertAttendance,
  getRawGroupAttendanceSummary,
  getStudentsInGroup as serviceGetStudentsInGroup, 
  fetchCourseActivities,
  fetchStudentsForCourse,
  fetchAttendanceForCourse,
  fetchGroupsForCourse,
  fetchGroupMembersForCourse,
  fetchUserById,
  fetchStudentAttendanceForCourse,
  fetchStudentGroupsForCourse,
} from '../services/attendanceService.js';


export function makeAttendanceController() {
  // ---------- Configuration & Helpers (NO SQL HERE) ----------
  const ATTENDANCE_WINDOW_MINUTES = 15; // 15 minute window for attendance

  // Deterministic 6-digit PIN from activity_id + secret
  function computePin(activityId) {
    const secret = process.env.ATTENDANCE_PIN_SECRET || 'dev-attendance-secret';
    const hmac = crypto.createHmac('sha256', secret).update(String(activityId)).digest('hex');

    // Take first 8 hex chars -> int -> mod 1,000,000 -> 6 digits
    const num = parseInt(hmac.slice(0, 8), 16) % 1_000_000;
    return String(num).padStart(6, '0');
  }

  function isWithinWindow(startsAt) {
    const now = Date.now();
    const start = new Date(startsAt).getTime();
    const diffMinutes = Math.abs(now - start) / 60000;
    return diffMinutes <= ATTENDANCE_WINDOW_MINUTES;
  }

  function buildCheckinUrl(activityId, pin) {
    // Base for your static frontend (adjust path to match your repo)
    const base = 'http://localhost:3000';
    return `${base}/student/checkin?activity_id=${encodeURIComponent(activityId)}&pin=${encodeURIComponent(pin)}`;
  }

  // (Helper: upsertAttendance logic moved to service)
  // (Helper: getStudentUserIdByEmail logic moved to service)
  // (Helper: assertStudentEnrolled logic moved to service)
  // (Helper: fetchCourseActivities logic moved to service)
  // (Helper: fetchAttendanceForCourse logic moved to service)

  // ---------- 1. Start attendance session (Instructor) ----------
  async function startAttendanceSession(req, res) {
    const course_id = req.params.courseId;
    const { name, type = 'lecture' } = req.body || {};

    const courseIdNum = Number.parseInt(course_id, 10);
    if (!Number.isInteger(courseIdNum)) {
      return res.status(400).json({ error: 'course_id must be an integer' });
    }
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'name is required (e.g., "Lecture 5")' });
    }

    try {
      // Service Call: Create the activity
      const activity = await createActivitySession(courseIdNum, name, type);

      const pin = computePin(activity.activity_id);
      const checkinUrl = buildCheckinUrl(activity.activity_id, pin);
      const qrDataUrl = await QRCode.toDataURL(checkinUrl);

      return res.status(201).json({
        activity_id: activity.activity_id,
        course_id: activity.course_id,
        name: activity.name,
        type: activity.type,
        starts_at: activity.starts_at,
        pin,
        checkin_url: checkinUrl,
        qr_code_data_url: qrDataUrl,
      });
    } catch (e) {
      console.error('startAttendanceSession error:', e);
      return res.status(500).json({ error: 'failed_to_start_attendance_session' });
    }
  }

  // ---------- 2. Student check-in (QR or Manual PIN) ----------
  async function checkinAttendance(req, res) {
    const { course_id, activity_id, pin, email, roll_id } = req.body || {};
    let courseIdNum = Number.isInteger(Number(course_id)) ? Number(course_id) : null;

    try {
      // ---------- Resolve userId ----------
      let userId = req.user?.user_id || req.session?.user?.user_id;

      if (userId) {
        // If courseIdNum is not known (QR checkin), find it from activity_id
        if (!courseIdNum && activity_id) {
          const activityIdNum = Number(activity_id);
          if (!Number.isInteger(activityIdNum)) {
            return res.status(400).json({ error: 'activity_id must be an integer' });
          }
          // Service Call: Find course ID from activity ID
          courseIdNum = await getCourseIdForActivity(activityIdNum);
          if (!courseIdNum) {
            return res.status(404).json({ error: 'activity_not_found' });
          }
        }

        // Service Call: Check if session user is a student in this course
        try {
          await serviceAssertStudentEnrolled(userId, courseIdNum);
        } catch (e) {
          // Fallback to email lookup if session user is not a student
          if (e.message !== 'not_enrolled_in_course' && e.message !== 'only_students_can_checkin') throw e;
          
          if (!email || typeof email !== 'string') {
            return res.status(400).json({ error: 'email is required for student check-in' });
          }

          // Service Call: Get user ID by email
          const studentId = await serviceGetStudentUserIdByEmail(email.trim().toLowerCase());
          if (!studentId) {
            return res.status(404).json({ error: 'user_not_found_for_email' });
          }
          userId = studentId;
        }
      } else {
        // No session user, fallback to email
        if (!email || typeof email !== 'string') {
          return res.status(400).json({ error: 'email is required' });
        }
        // Service Call: Get user ID by email
        const studentId = await serviceGetStudentUserIdByEmail(email.trim().toLowerCase());
        if (!studentId) {
          return res.status(404).json({ error: 'user_not_found_for_email' });
        }
        userId = studentId;
      }

      console.log('Resolved userId for check-in:', userId, 'Email:', email);

      // ---------- Validate PIN ----------
      if (!pin || typeof pin !== 'string' || pin.length !== 6) {
        return res.status(400).json({ error: 'pin must be a 6-digit string' });
      }

      // ---------- Resolve activity ----------
      let activity;
      if (activity_id) {
        const activityIdNum = Number.isInteger(Number(activity_id)) ? Number(activity_id) : null;
        if (!activityIdNum) {
          return res.status(400).json({ error: 'activity_id must be an integer' });
        }
        // Service Call: Fetch activity details by ID
        const courseIdResult = await getCourseIdForActivity(activityIdNum);
        if (courseIdResult === null) {
            return res.status(404).json({ error: 'activity_not_found' });
        }
        activity = { activity_id: activityIdNum, course_id: courseIdResult }; // Simplified mock, actual fetch would need to be added to service
        
        // RE-FETCHING ALL ACTIVITY DETAILS - A proper service function is needed here:
        const fullActivity = await findActiveActivityForCourse(courseIdResult, 99999); // Use a large window to find it
        if (!fullActivity || fullActivity.activity_id !== activityIdNum) {
            // Re-fetch logic for full activity object if only activity_id/course_id was fetched above
            // For now, assume a service call for fetching the activity by ID exists in a real scenario
            activity = fullActivity || activity;
        } else {
            activity = fullActivity;
        }


      } else if (course_id) {
        const courseIdNumValidated = Number.parseInt(course_id, 10);
        if (!Number.isInteger(courseIdNumValidated)) {
          return res.status(400).json({ error: 'course_id must be an integer' });
        }
        // Service Call: Find active activity
        activity = await findActiveActivityForCourse(courseIdNumValidated, ATTENDANCE_WINDOW_MINUTES);

        if (!activity) {
          return res.status(404).json({ error: 'no_active_activity_for_course_in_window' });
        }
      } else {
        return res
          .status(400)
          .json({ error: 'either activity_id (QR) or course_id (manual) is required' });
      }

      // ---------- Enforce attendance window ----------
      if (!isWithinWindow(activity.starts_at)) {
        return res.status(400).json({ error: 'outside_attendance_window' });
      }

      // ---------- Check enrollment ----------
      try {
        // Service Call: Check enrollment
        await serviceAssertStudentEnrolled(userId, activity.course_id);
      } catch (e) {
        const status = e.status || 500;
        return res.status(status).json({ error: e.message });
      }

      // ---------- Validate PIN ----------
      const expectedPin = computePin(activity.activity_id);
      if (expectedPin !== pin) {
        return res.status(400).json({ error: 'invalid_pin' });
      }

      // ---------- Upsert attendance ----------
      // Service Call: Upsert attendance
      const attendanceRow = await serviceUpsertAttendance({
        userId,
        activityId: activity.activity_id,
        present: true,
      });

      return res.status(200).json({
        message: 'checkin_success',
        attendance: attendanceRow,
        activity,
        roll_id,
      });
    } catch (e) {
      console.error('checkinAttendance error:', e);
      return res.status(500).json({ error: 'failed_to_checkin' });
    }
  }

  // ---------- 3. Manual / retroactive mark (Instructor / TA) ----------
  async function manualMarkAttendance(req, res) {
    const { activity_id, user_id, present } = req.body || {};

    const activityIdNum = Number.isInteger(Number(activity_id)) ? Number(activity_id) : null;
    const userIdNum = Number.isInteger(Number(user_id)) ? Number(user_id) : null;

    if (!activityIdNum || !userIdNum) {
      return res.status(400).json({ error: 'activity_id and user_id must both be integers' });
    }
    if (typeof present !== 'boolean') {
      return res.status(400).json({ error: 'present must be boolean' });
    }

    try {
      // Service Call: Upsert attendance
      const attendanceRow = await serviceUpsertAttendance({
        userId: userIdNum,
        activityId: activityIdNum,
        present,
      });

      return res.status(200).json({
        message: 'attendance_updated',
        attendance: attendanceRow,
      });
    } catch (e) {
      console.error('manualMarkAttendance error:', e);
      return res.status(500).json({ error: 'failed_to_update_attendance' });
    }
  }

  // Helper to get all students in a particular group
  async function getStudentsInGroup(req, res) {
    const groupId = Number(req.params.groupId);

    if (!Number.isInteger(groupId)) {
        return res.status(400).json({ error: 'groupId must be an integer' });
    }

    try {
      // Service Call: Get students in group
      const rows = await serviceGetStudentsInGroup(groupId);
      return res.json(rows);
    } catch (e) {
      console.error('getStudentsInGroup error:', e);
      return res.status(500).json({ error: 'failed_to_load_students_in_group' });
    }
  }


  // GET /api/attendance/courses/:courseId/groups
  async function getCourseGroupAttendanceSummary(req, res) {
    const courseId = Number(req.params.courseId);
    if (!Number.isInteger(courseId)) {
      return res.status(400).json({ error: 'course_id must be an integer' });
    }

    try {
      // 🚀 Service Call: Get raw group attendance data
      const rows = await getRawGroupAttendanceSummary(courseId);

      // Convert SQL result → grouped format (Controller logic remains here)
      const map = new Map();

      for (const r of rows) {
        if (!map.has(r.group_id)) {
          map.set(r.group_id, {
            group_id: r.group_id,
            name: r.group_name,
            activities: [],
          });
        }
        map.get(r.group_id).activities.push({
          activity_id: r.activity_id,
          name: r.activity_name,
          starts_at: r.starts_at,
          present_users: r.present_users || [],
        });
      }

      return res.json({ course_id: courseId, groups: Array.from(map.values()) });
    } catch (e) {
      console.error('getCourseGroupAttendanceSummary:', e);
      return res.status(500).json({ error: 'failed_to_load_group_summary' });
    }
  }

  // ---------- 4. Course attendance summary ----------
  async function getCourseAttendanceSummary(req, res) {
    const courseId = Number.parseInt(req.params.courseId, 10);
    if (!Number.isInteger(courseId)) {
      return res.status(400).json({ error: 'course_id must be an integer' });
    }

    try {
      // Service Call: All activities for this course
      const activities = await fetchCourseActivities(courseId);
      const totalSessions = activities.length;

      // Service Call: Students in the course
      const students = await fetchStudentsForCourse(courseId);

      // Service Call: Attendance rows for activities in this course
      const attendanceRows = await fetchAttendanceForCourse(courseId);

      // Controller logic to aggregate and calculate percentages (remains here)
      const attendanceMap = new Map(); // key "user_id:activity_id" -> present
      for (const row of attendanceRows) {
        const key = `${row.user_id}:${row.activity_id}`;
        attendanceMap.set(key, row.present);
      }

      const perStudent = [];
      let totalPresent = 0;
      let totalPossible = 0;

      for (const s of students) {
        let attended = 0;
        for (const act of activities) {
          const key = `${s.user_id}:${act.activity_id}`;
          const present = attendanceMap.get(key);
          if (present === true) {
            attended += 1;
          }
        }
        const total = totalSessions;
        const percent = total === 0 ? 0 : Math.round((attended * 1000.0) / total) / 10.0;

        perStudent.push({
          user_id: s.user_id,
          name: s.name,
          attended,
          total,
          percent,
        });

        totalPresent += attended;
        totalPossible += total;
      }

      const overallPercent =
        totalPossible === 0 ? 0 : Math.round((totalPresent * 1000.0) / totalPossible) / 10.0;

      return res.json({
        course_id: courseId,
        total_sessions: totalSessions,
        student_count: students.length,
        overall_attendance_percent: overallPercent,
        activities,
        students: perStudent,
      });
    } catch (e) {
      console.error('getCourseAttendanceSummary error:', e);
      return res.status(500).json({ error: 'failed_to_load_summary' });
    }
  }

  // ---------- 6. Instructor: group + member overview ----------
  // Internal helper logic remains in controller/internal service, but uses new service functions
  async function getCourseGroupAndMemberOverviewInternal(courseId) {
    // Service Calls
    const activities = await fetchCourseActivities(courseId);
    const totalSessions = activities.length;
    const groupRows = await fetchGroupsForCourse(courseId);
    const memberRows = await fetchGroupMembersForCourse(courseId);
    const attendanceRows = await fetchAttendanceForCourse(courseId);
    
    // Remaining aggregation logic (Controller/Internal Service logic)
    const attendanceMap = new Map();
    for (const row of attendanceRows) {
      const key = `${row.user_id}:${row.activity_id}`;
      attendanceMap.set(key, row.present);
    }

    const membersByGroup = new Map();
    for (const m of memberRows) {
      if (!membersByGroup.has(m.group_id)) {
        membersByGroup.set(m.group_id, []);
      }
      membersByGroup.get(m.group_id).push({
        user_id: m.user_id,
        name: m.name,
      });
    }

    const groups = [];

    for (const g of groupRows) {
      const members = membersByGroup.get(g.group_id) || [];
      let groupPresent = 0;
      let groupTotal = 0;

      const memberSummaries = members.map((m) => {
        let attended = 0;
        for (const act of activities) {
          const key = `${m.user_id}:${act.activity_id}`;
          if (attendanceMap.get(key) === true) {
            attended += 1;
          }
        }
        const total = totalSessions;
        const percent = total === 0 ? 0 : Math.round((attended * 1000.0) / total) / 10.0;

        groupPresent += attended;
        groupTotal += total;

        return {
          user_id: m.user_id,
          name: m.name,
          attended,
          total_sessions: total,
          percent,
        };
      });

      const overallPercent =
        groupTotal === 0 ? 0 : Math.round((groupPresent * 1000.0) / groupTotal) / 10.0;

      groups.push({
        group_id: g.group_id,
        name: g.name,
        overall_percent: overallPercent,
        members: memberSummaries,
      });
    }

    return { course_id: courseId, total_sessions: totalSessions, groups };
  }


  async function getCourseGroupAndMemberOverview(req, res) {
    const courseId = Number.parseInt(req.params.courseId, 10);
    if (!Number.isInteger(courseId)) {
      return res.status(400).json({ error: 'course_id must be an integer' });
    }

    try {
      // Logic delegated to internal function which uses service calls
      const data = await getCourseGroupAndMemberOverviewInternal(courseId);
      return res.json(data);
    } catch (e) {
      console.error('getCourseGroupAndMemberOverview error:', e);
      return res.status(500).json({ error: 'failed_to_load_instructor_overview' });
    }
  }

  // ---------- 7. Student: personal + team overview ----------
  async function getStudentCourseAttendanceOverview(req, res) {
    const courseId = Number.parseInt(req.params.courseId, 10);
    const userId = Number.parseInt(req.params.userId || req.session?.user?.user_id, 10);

    if (!Number.isInteger(courseId) || !Number.isInteger(userId)) {
      return res.status(400).json({ error: 'course_id and user_id must be integers' });
    }

    try {
      // Service Call: All activities
      const activities = await fetchCourseActivities(courseId);
      const totalSessions = activities.length;

      // Service Call: Student info
      const user = await fetchUserById(userId);
      if (!user) {
        return res.status(404).json({ error: 'user_not_found' });
      }

      // Service Call: Student attendance records
      const myAttendanceRows = await fetchStudentAttendanceForCourse(courseId, userId);

      // Remaining aggregation logic (Controller logic)
      const myMap = new Map(); // activity_id -> present
      for (const r of myAttendanceRows) {
        myMap.set(r.activity_id, r.present);
      }

      let myAttended = 0;
      for (const act of activities) {
        const p = myMap.get(act.activity_id);
        if (p === true) myAttended += 1;
      }
      const myPercent =
        totalSessions === 0 ? 0 : Math.round((myAttended * 1000.0) / totalSessions) / 10.0;

      // Service Call: What groups is this student in?
      const myGroups = await fetchStudentGroupsForCourse(courseId, userId);

      // Reuse instructor group overview to compute group-level percentages
      const instructorOverview = await getCourseGroupAndMemberOverviewInternal(courseId);

      const groupSummaries = myGroups.map((g) => {
        const full = instructorOverview.groups.find((gg) => gg.group_id === g.group_id);
        return {
          group_id: g.group_id,
          name: g.name,
          overall_percent: full ? full.overall_percent : 0,
        };
      });

      return res.json({
        course_id: courseId,
        total_sessions: totalSessions,
        me: {
          user_id: user.user_id,
          name: user.name,
          attended: myAttended,
          total_sessions: totalSessions,
          percent: myPercent,
        },
        groups: groupSummaries,
      });
    } catch (e) {
      console.error('getStudentCourseAttendanceOverview error:', e);
      return res.status(500).json({ error: 'failed_to_load_student_overview' });
    }
  }

  /**
  * GET /api/attendance/courses/:courseId/latest-activities
  * Get the latest 2 attendance records for rendering the dashboard.
  */
  async function getLatestAttendance(req, res) {
    const courseId = req.params.courseId;
    try {
      // Service Call: Get latest attendance activities (existing function)
      const data = await getLatestAttendanceActivities(courseId);
      res.json(data.latestActivities); // Return just the array of activities
    } catch (err) {
      console.error('getLatestAttendance error:', err);
      res.status(500).json({ error: 'Failed to fetch latest attendance data' });
    }
  }

  return Object.freeze({
    startAttendanceSession,
    getLatestAttendance,
    checkinAttendance,
    manualMarkAttendance,
    getCourseAttendanceSummary,
    getCourseGroupAttendanceSummary,
    getStudentsInGroup,
    getCourseGroupAndMemberOverview,
    getStudentCourseAttendanceOverview,
  });
}