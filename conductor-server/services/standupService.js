import { makeQueryService } from './queryService.js';
import { StandupEntry } from '../domain/entities/StandupEntry.js';
import { pool } from '../db.js';

const queryService = makeQueryService({ pool });

export async function getUserStandupEntries(userId) {
  const rows = await queryService.executeQuery('standupQueries', [userId]);
  return rows.map((row) => StandupEntry(row));
}

export async function createStandupEntry({
  user_id,
  name,
  content,
  sentiment,
}) {
  const rows = await queryService.executeRawQuery(
    `INSERT INTO standup_entries
      (user_id, name, content, sentiment)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [user_id, name, content, sentiment]
  );
  return StandupEntry(rows[0]);
}

// Optional: Get all entries for a course for instructor view
export async function getCourseStandupEntries(courseId) {
  const rows = await queryService.executeRawQuery(
    `SELECT se.*, u.name AS user_name
     FROM standup_entries se
     JOIN users u ON u.user_id = se.user_id
     JOIN course_users cu ON cu.user_id = u.user_id
     WHERE cu.course_id = $1
     ORDER BY se.time DESC`,
    [courseId]
  );
  return rows.map((row) => StandupEntry(row));
}