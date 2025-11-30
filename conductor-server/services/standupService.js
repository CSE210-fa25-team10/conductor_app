import { makeQueryService } from './queryService.js';
import { StandupEntry } from '../domain/entities/StandupEntry.js';
import { pool } from '../db.js';

const queryService = makeQueryService({ pool });

export async function getUserStandupEntries(userId) {
  // We use a clean query to fetch only the necessary columns
    const sql = `
      SELECT standup_id, user_id, name, time, content, sentiment_personal, sentiment_team, sentiment_course
      FROM standup_entries
      WHERE user_id = $1
      ORDER BY time DESC;
    `;
    const rows = await queryService.executeRawQuery(sql, [userId]);
//   const rows = await pool.query(sql, [userId]);
  return rows.map((row) => StandupEntry(row));
}

export async function createAnonymousFeedback({ course_id, type, message }) {
    const sql = `
      INSERT INTO standup_feedback (course_id, type, message)
      VALUES ($1, $2, $3)
      RETURNING feedback_id, course_id, type, message, created_at;
    `;
    const result = await queryService.executeRawQuery(sql, [course_id, type, message]);
    return result[0]|| null;
  }

export async function createStandupEntry({
  user_id,
  name,
  content,
  sentiment_personal, 
  sentiment_team,     
  sentiment_course,  
}) {

    if (!user_id || !name || !content) {
    throw new Error(
      'Missing required standup fields: user_id, name, content.'
    );
  }

  const rows = await queryService.executeRawQuery(
    `INSERT INTO standup_entries (user_id, name, content, sentiment_personal, sentiment_team, sentiment_course, time)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *;`,
    [user_id, name, content, sentiment_personal, sentiment_team, sentiment_course]
  );
  return StandupEntry(rows[0]);
}

// Optional: Get all entries for a course for instructor view
export async function getCourseStandupEntries(courseId) {
  const rows = await queryService.executeRawQuery(
    `SELECT se.standup_id, se.user_id, se.name, se.time, se.content, 
          se.sentiment_personal, se.sentiment_team, se.sentiment_course,
          u.name AS user_name
     FROM standup_entries se
     JOIN users u ON u.user_id = se.user_id
     JOIN course_users cu ON cu.user_id = u.user_id
     WHERE cu.course_id = $1
     ORDER BY se.time DESC;`,
    [courseId]
  );
  return rows.map((row) => StandupEntry(row));
}