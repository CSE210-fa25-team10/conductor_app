import { makeQueryService } from './queryService.js';
import { StandupEntry } from '../domain/entities/StandupEntry.js';
import { AnonymousFeedback } from '../domain/entities/AnonymousFeedback.js'; // NEW IMPORT
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
  return result[0] || null;
}

export async function createStandupEntry({
  user_id,
  name,
  content,
  sentiment_personal,
  sentiment_team,
  sentiment_course,
}) {
  if (!user_id || !content) {
    throw new Error('Missing required standup fields: user_id, content.');
  }

  const rows = await queryService.executeRawQuery(
    `INSERT INTO standup_entries (user_id, name, content, sentiment_personal, sentiment_team, sentiment_course, time)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *;`,
    [user_id, name, content, sentiment_personal, sentiment_team, sentiment_course]
  );
  return StandupEntry(rows[0]);
}

// Get all anonymous feedback entries for a course for instructor view
export async function getAnonymousFeedbackEntries(courseId) {
  const rows = await queryService.executeRawQuery(
    `SELECT feedback_id, course_id, type, message, created_at
        FROM standup_feedback
        WHERE course_id = $1 AND type = 'COURSE'
        ORDER BY created_at DESC;`,
    [courseId]
  );
  return rows.map((row) => AnonymousFeedback(row));
}

// Get all anonymous feedback entries for a course for team lead view
export async function getAnonymousFeedbackEntriesTeamLead(courseId) {
  const rows = await queryService.executeRawQuery(
    `SELECT feedback_id, course_id, type, message, created_at
        FROM standup_feedback
        WHERE course_id = $1 AND type = 'TEAM'
        ORDER BY created_at DESC;`,
    [courseId]
  );
  return rows.map((row) => AnonymousFeedback(row));
}
