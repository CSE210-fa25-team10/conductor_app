// attendanceService.js

import { makeQueryService } from './queryService.js';
import { pool } from '../db.js';

const queryService = makeQueryService({ pool });

/**
 * Fetches the latest attendance activities, attendance count, and total course enrollment.
 * @param {string} courseId The ID of the course.
 * @returns {Promise<{totalEnrolled: number, latestActivities: Array}>}
 */
export async function getLatestAttendanceActivities(courseId) {
  // 1. Get Total Enrollment
  const enrollmentQuery = `
        SELECT COUNT(user_id) AS total_enrolled
        FROM course_users
        WHERE course_id = $1 AND role = 'student';
    `;
  const enrollmentResult = await queryService.executeRawQuery(enrollmentQuery, [courseId]);
  const totalEnrolled = Number(enrollmentResult[0]?.total_enrolled || 0); // Safely handle 0 enrollment

  // 2. Get latest 2 activities
  const activitiesQuery = `
        SELECT activity_id, name
        FROM activities
        WHERE course_id = $1 AND type = 'lecture'
        ORDER BY starts_at DESC
        LIMIT 2;
    `;
  const latestActivities = await queryService.executeRawQuery(activitiesQuery, [courseId]);

  if (latestActivities.length === 0) {
    return { totalEnrolled, latestActivities: [] };
  }

  // 3. Get Attendance Counts for those activities
  const activityIds = latestActivities.map((a) => a.activity_id);

  // CRITICAL FIX: The placeholders must start from $1 and match the number of activity IDs.
  const placeholders = activityIds.map((_, i) => `$${i + 1}`).join(', ');

  const attendanceCountQuery = `
        SELECT activity_id, COUNT(user_id) AS attended_count
        FROM attendance
        WHERE activity_id IN (${placeholders}) AND present = TRUE
        GROUP BY activity_id;
    `;

  // CRITICAL FIX: The parameters must ONLY be the activity IDs.
  const attendanceResults = await queryService.executeRawQuery(attendanceCountQuery, activityIds);

  const attendanceMap = attendanceResults.reduce((map, row) => {
    map[row.activity_id] = Number(row.attended_count);
    return map;
  }, {});

  // 4. Combine and return data
  const finalActivities = latestActivities.map((activity) => ({
    name: activity.name,
    attended: attendanceMap[activity.activity_id] || 0,
    totalEnrolled: totalEnrolled,
  }));

  return { totalEnrolled, latestActivities: finalActivities };
}

//
/**
 * Inserts a new activity or finds the course ID for an existing activity.
 * @param {number} courseId
 * @param {string} name
 * @param {string} type
 * @returns {Promise<{activity_id: number, course_id: number, name: string, type: string, starts_at: string}>}
 */
export async function createActivitySession(courseId, name, type = 'lecture') {
  const query = `
        INSERT INTO activities (course_id, name, type, starts_at)
        VALUES ($1, $2, $3, NOW() AT TIME ZONE 'UTC')
        RETURNING activity_id, course_id, name, type, starts_at;
    `;
  const [activity] = await queryService.executeRawQuery(query, [courseId, name, type]);
  return activity;
}

/**
 * Finds the course_id for a given activity_id.
 * @param {number} activityId
 * @returns {Promise<number | null>}
 */
export async function getCourseIdForActivity(activityId) {
  const query = `
        SELECT course_id FROM activities WHERE activity_id = $1;
    `;
  const result = await queryService.executeRawQuery(query, [activityId]);
  return result.length > 0 ? result[0].course_id : null;
}

/**
 * Retrieves the student user_id by email.
 * @param {string} email
 * @returns {Promise<number | null>}
 */
export async function getStudentUserIdByEmail(email) {
  const query = `SELECT user_id FROM users WHERE email = $1`;
  const [row] = await queryService.executeRawQuery(query, [email]);
  return row?.user_id || null;
}

/**
 * Asserts if a user is enrolled as a 'student' in a course.
 * @param {number} userId
 * @param {number} courseId
 * @throws {Error} if not enrolled or not a student.
 */
export async function assertStudentEnrolled(userId, courseId) {
  const query = `
        SELECT role
        FROM course_users
        WHERE user_id = $1 AND course_id = $2;
    `;
  const rows = await queryService.executeRawQuery(query, [userId, courseId]);

  if (rows.length === 0) {
    throw Object.assign(new Error('not_enrolled_in_course'), { status: 403 });
  }
  const role = rows[0].role?.toLowerCase();
  if (role !== 'student') {
    throw Object.assign(new Error('only_students_can_checkin'), { status: 403 });
  }
}

/**
 * Finds the most recent active activity for a course within the attendance window.
 * @param {number} courseId
 * @param {number} windowMinutes
 * @returns {Promise<{activity_id: number, course_id: number, name: string, type: string, starts_at: string} | null>}
 */
export async function findActiveActivityForCourse(courseId, windowMinutes) {
  // Note: windowMinutes is interpolated for the interval string, assuming trusted input
  const query = `
        SELECT activity_id, course_id, name, type, starts_at
        FROM activities
        WHERE course_id = $1
          AND starts_at <= (NOW() AT TIME ZONE 'UTC')
          AND starts_at >= (NOW() AT TIME ZONE 'UTC' - INTERVAL '${windowMinutes} minutes')
        ORDER BY starts_at DESC
        LIMIT 1;
    `;
  const [activity] = await queryService.executeRawQuery(query, [courseId]);
  return activity || null;
}

/**
 * Inserts or updates an attendance row.
 * @param {{userId: number, activityId: number, present: boolean}} data
 * @returns {Promise<any>} The upserted row.
 */
export async function upsertAttendance({ userId, activityId, present }) {
  const query = `
        INSERT INTO attendance (user_id, activity_id, present, checked_in_at)
        VALUES ($1, $2, $3, NOW() AT TIME ZONE 'UTC')
        ON CONFLICT (user_id, activity_id) DO UPDATE
          SET present = EXCLUDED.present,
              checked_in_at = EXCLUDED.checked_in_at
        RETURNING user_id, activity_id, present, checked_in_at;
    `;
  const [row] = await queryService.executeRawQuery(query, [userId, activityId, present]);
  return row;
}

/**
 * Fetches all groups and activities for a course for a group attendance summary.
 * @param {number} courseId
 * @returns {Promise<Array<any>>} Raw rows from the join query.
 */
export async function getRawGroupAttendanceSummary(courseId) {
  const query = `
        SELECT
          g.group_id,
          g.name AS group_name,
          a.activity_id,
          a.name AS activity_name,
          a.starts_at,
          ARRAY_AGG(
            CASE WHEN att.present THEN att.user_id END
          ) FILTER (WHERE att.present IS TRUE) AS present_users
        FROM course_groups cg
        JOIN groups g ON g.group_id = cg.group_id
        JOIN activities a ON a.course_id = cg.course_id
        LEFT JOIN group_users gu
          ON gu.group_id = g.group_id
        LEFT JOIN attendance att
          ON att.activity_id = a.activity_id
        AND att.user_id = gu.user_id
        WHERE cg.course_id = $1
        GROUP BY g.group_id, g.name, a.activity_id, a.name, a.starts_at
        ORDER BY g.group_id, a.starts_at;
    `;
  return queryService.executeRawQuery(query, [courseId]);
}

/**
 * Gets all students in a group.
 * @param {number} groupId
 * @returns {Promise<Array<{user_id: number, name: string}>>}
 */
export async function getStudentsInGroup(groupId) {
  const query = `
        SELECT u.user_id, u.name
        FROM group_users gu
        JOIN users u ON u.user_id = gu.user_id
        WHERE gu.group_id = $1
        ORDER BY u.name;
    `;
  return queryService.executeRawQuery(query, [groupId]);
}

/**
 * Fetches all activities for a course.
 * @param {number} courseId
 * @returns {Promise<Array<{activity_id: number, name: string, starts_at: string, type: string}>>}
 */
export async function fetchCourseActivities(courseId) {
  const query = `
        SELECT activity_id, name, starts_at, type
        FROM activities
        WHERE course_id = $1
        ORDER BY starts_at;
    `;
  return queryService.executeRawQuery(query, [courseId]);
}

/**
 * Fetches all 'student' users for a course.
 * @param {number} courseId
 * @returns {Promise<Array<{user_id: number, name: string}>>}
 */
export async function fetchStudentsForCourse(courseId) {
  const query = `
        SELECT cu.user_id, u.name
        FROM course_users cu
        JOIN users u ON u.user_id = cu.user_id
        WHERE cu.course_id = $1
          AND (cu.role IS NULL OR LOWER(cu.role) = 'student')
        ORDER BY u.name;
    `;
  return queryService.executeRawQuery(query, [courseId]);
}

/**
 * Fetches all attendance records for a course.
 * @param {number} courseId
 * @returns {Promise<Array<{user_id: number, activity_id: number, present: boolean}>>}
 */
export async function fetchAttendanceForCourse(courseId) {
  const query = `
        SELECT a.user_id, a.activity_id, a.present
        FROM attendance a
        JOIN activities act ON act.activity_id = a.activity_id
        WHERE act.course_id = $1;
    `;
  return queryService.executeRawQuery(query, [courseId]);
}

/**
 * Fetches all groups attached to a course.
 * @param {number} courseId
 * @returns {Promise<Array<{group_id: number, name: string}>>}
 */
export async function fetchGroupsForCourse(courseId) {
  const query = `
        SELECT g.group_id, g.name
        FROM course_groups cg
        JOIN groups g ON g.group_id = cg.group_id
        WHERE cg.course_id = $1
        ORDER BY g.group_id;
    `;
  return queryService.executeRawQuery(query, [courseId]);
}

/**
 * Fetches all members for all groups in a course.
 * @param {number} courseId
 * @returns {Promise<Array<{group_id: number, user_id: number, name: string}>>}
 */
export async function fetchGroupMembersForCourse(courseId) {
  const query = `
        SELECT g.group_id, u.user_id, u.name
        FROM course_groups cg
        JOIN groups g ON g.group_id = cg.group_id
        JOIN group_users gu ON gu.group_id = g.group_id
        JOIN users u ON u.user_id = gu.user_id
        WHERE cg.course_id = $1
        ORDER BY g.group_id, u.name;
    `;
  return queryService.executeRawQuery(query, [courseId]);
}

/**
 * Fetches a single user by ID.
 * @param {number} userId
 * @returns {Promise<{user_id: number, name: string} | null>}
 */
export async function fetchUserById(userId) {
  const query = `SELECT user_id, name FROM users WHERE user_id = $1`;
  const [user] = await queryService.executeRawQuery(query, [userId]);
  return user || null;
}

/**
 * Fetches a single student's attendance records for a course.
 * @param {number} courseId
 * @param {number} userId
 * @returns {Promise<Array<{activity_id: number, present: boolean}>>}
 */
export async function fetchStudentAttendanceForCourse(courseId, userId) {
  const query = `
        SELECT a.activity_id, a.present
        FROM attendance a
        JOIN activities act ON act.activity_id = a.activity_id
        WHERE act.course_id = $1
          AND a.user_id = $2;
    `;
  return queryService.executeRawQuery(query, [courseId, userId]);
}

/**
 * Fetches all groups a student belongs to for a specific course.
 * @param {number} courseId
 * @param {number} userId
 * @returns {Promise<Array<{group_id: number, name: string}>>}
 */
export async function fetchStudentGroupsForCourse(courseId, userId) {
  const query = `
        SELECT DISTINCT g.group_id, g.name
        FROM group_users gu
        JOIN groups g ON g.group_id = gu.group_id
        JOIN course_groups cg ON cg.group_id = g.group_id
        WHERE cg.course_id = $1
          AND gu.user_id = $2
        ORDER BY g.group_id;
    `;
  return queryService.executeRawQuery(query, [courseId, userId]);
}
