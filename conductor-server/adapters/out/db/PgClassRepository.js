// PgClassRepository.js

// No more readFileSync — SQL is inline
export function makePgClassRepository({ pool }) {
  // 1. Search classes by filter (name/code/semester)
  const searchClassesSql = `
    SELECT
      c.course_id,
      c.name,
      c.code,
      c.semester,
      c.description
    FROM courses c
    WHERE
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

  // 2. Create a course
  const createCourseSql = `
    INSERT INTO courses (name, code, semester, description)
    VALUES ($1, $2, $3, $4)
    RETURNING course_id, name, code, semester, description;
  `;

  async function createCourse({ name, code, semester, description }) {
    const { rows } = await pool.query(createCourseSql, [
      name,
      code,
      semester,
      description ?? null,
    ]);
    return rows[0];
  }

  // 3. Add a user to a course with a specific role (instructor / student)
  const addCourseUserSql = `
    INSERT INTO course_users (user_id, course_id, role)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id, course_id) DO NOTHING
    RETURNING user_id, course_id, role;
  `;

  async function addCourseUser({ userId, courseId, role }) {
    const { rows } = await pool.query(addCourseUserSql, [
      userId,
      courseId,
      role,
    ]);
    // rows might be empty if conflict; that's fine
    return rows[0] ?? { user_id: userId, course_id: courseId, role };
  }

  // 4. Convenience: "joinCourse" just delegates to addCourseUser
  async function joinCourse({ userId, courseId, role }) {
    return addCourseUser({ userId, courseId, role });
  }

  // 5. Get all courses for a user (for dashboard)
  const getUserCoursesSql = `
    SELECT
      c.course_id,
      c.name,
      c.code,
      c.semester,
      c.description,
      cu.role
    FROM course_users cu
    JOIN courses c ON c.course_id = cu.course_id
    WHERE cu.user_id = $1
    ORDER BY c.code, c.semester, c.name;
  `;

  async function getUserCourses({ userId }) {
    const { rows } = await pool.query(getUserCoursesSql, [userId]);
    return rows;
  }

  // 6. Find a course by its code (e.g. "CSE210")
  const getCourseByCodeSql = `
    SELECT
      course_id,
      name,
      code,
      semester,
      description
    FROM courses
    WHERE code = $1
    LIMIT 1;
  `;

  async function getCourseByCode({ courseCode }) {
    const { rows } = await pool.query(getCourseByCodeSql, [courseCode]);
    return rows[0] ?? null;
  }

  return Object.freeze({
    search,
    createCourse,
    addCourseUser,
    joinCourse,
    getUserCourses,
    getCourseByCode,
  });
}
