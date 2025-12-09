// PgClassRepository.js

// No more readFileSync — SQL is inline
export function makePgClassRepository({ pool }) {
  // SQL logic: search in name, code, semester; optional limit
  const searchClassesSql = `
    SELECT
      c.course_id,
      c.name,
      c.code,
      c.semester,
      c.description
    FROM courses c
    WHERE
      -- if filter is null or empty, return all courses
      ($1 IS NULL OR $1 = '')
      OR (
        c.name ILIKE $1
        OR c.code ILIKE $1
        OR c.semester ILIKE $1
      )
    ORDER BY
      c.code,
      c.semester,
      c.name
    LIMIT COALESCE($2, 100);
  `;

  async function search({ filter, limit }) {
    const pattern = filter ? `%${filter}%` : '';
    const lim = limit ?? 100;

    const res = await pool.query(searchClassesSql, [pattern, lim]);
    return res.rows; // app layer will map entities
  }

  return Object.freeze({ search });
}
