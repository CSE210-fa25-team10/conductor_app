// conductor-server/tests/helpers/testHelpers.js
import { pool } from '../../db.js';
import bcrypt from 'bcrypt'; // <--- ADDED IMPORT

/**
 * Create a test user in the database
 */
export async function createTestUser(userData) {
  const { name, email, password, role, pronouns, phone, availability, slack } = userData;

  // HASH THE PASSWORD
  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `INSERT INTO users (name, email, password, role, pronouns, phone, availability, slack)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING user_id, name, email, role, pronouns, phone, availability, slack`,
    [name, email, hashedPassword, role, pronouns || null, phone || null, availability || null, slack || null]
  );

  return result.rows[0];
}

/**
 * Create a test course in the database
 */
export async function createTestCourse(courseData) {
  const { name, code, semester, description } = courseData;

  const result = await pool.query(
    `INSERT INTO courses (name, code, semester, description)
     VALUES ($1, $2, $3, $4)
     RETURNING course_id, name, code, semester, description`,
    [name, code, semester, description || null]
  );

  return result.rows[0];
}

/**
 * Enroll a user in a course
 */
export async function enrollUserInCourse(userId, courseId, role = 'student') {
  await pool.query(
    `INSERT INTO course_users (user_id, course_id, role)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, course_id) DO UPDATE SET role = $3`,
    [userId, courseId, role]
  );
}

/**
 * Create a test activity/lecture
 */
export async function createTestActivity(activityData) {
  const { courseId, name, startsAt, type } = activityData;

  const result = await pool.query(
    `INSERT INTO activities (course_id, name, starts_at, type)
     VALUES ($1, $2, $3, $4)
     RETURNING activity_id, course_id, name, starts_at, type`,
    [courseId, name, startsAt || new Date(), type || 'lecture']
  );

  return result.rows[0];
}

/**
 * Create attendance record
 */
export async function createAttendance(userId, activityId, present = true) {
  const result = await pool.query(
    `INSERT INTO attendance (user_id, activity_id, present)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, activity_id) 
     DO UPDATE SET present = $3
     RETURNING user_id, activity_id, present`,
    [userId, activityId, present]
  );

  return result.rows[0];
}

/**
 * Create a test group/team
 */
export async function createTestGroup(groupData) {
  const { name, mantra, slack, repositoryLink } = groupData;

  const result = await pool.query(
    `INSERT INTO groups (name, mantra, slack, repository_link)
     VALUES ($1, $2, $3, $4)
     RETURNING group_id, name, mantra, slack, repository_link`,
    [name, mantra || null, slack || null, repositoryLink || null]
  );

  return result.rows[0];
}

/**
 * Add user to a group
 */
export async function addUserToGroup(userId, groupId, role = 'member') {
  await pool.query(
    `INSERT INTO group_users (user_id, group_id, role)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, group_id) DO UPDATE SET role = $3`,
    [userId, groupId, role]
  );
}

/**
 * Assign group to course
 */
export async function assignGroupToCourse(groupId, courseId) {
  await pool.query(
    `INSERT INTO course_groups (group_id, course_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [groupId, courseId]
  );
}

/**
 * Create a test assignment
 */
export async function createTestAssignment(assignmentData) {
  const { courseId, name, description, dueDate, createdBy } = assignmentData;

  const result = await pool.query(
    `INSERT INTO assignments (course_id, name, description, due_date, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING assignment_id, course_id, name, description, due_date, created_by`,
    [courseId, name, description || null, dueDate || null, createdBy || null]
  );

  return result.rows[0];
}

/**
 * Clean up test user and all related data
 */
export async function cleanupTestUser(userId) {
  await pool.query('DELETE FROM attendance WHERE user_id = $1', [userId]);
  await pool.query('DELETE FROM course_users WHERE user_id = $1', [userId]);
  await pool.query('DELETE FROM group_users WHERE user_id = $1', [userId]);
  await pool.query('DELETE FROM standup_entries WHERE user_id = $1', [userId]);
  await pool.query('DELETE FROM assignments WHERE created_by = $1', [userId]);
  await pool.query('DELETE FROM users WHERE user_id = $1', [userId]);
}

/**
 * Clean up test course and all related data
 */
export async function cleanupTestCourse(courseId) {
  await pool.query('DELETE FROM assignments WHERE course_id = $1', [courseId]);
  await pool.query('DELETE FROM attendance WHERE activity_id IN (SELECT activity_id FROM activities WHERE course_id = $1)', [courseId]);
  await pool.query('DELETE FROM activities WHERE course_id = $1', [courseId]);
  await pool.query('DELETE FROM course_users WHERE course_id = $1', [courseId]);
  await pool.query('DELETE FROM course_groups WHERE course_id = $1', [courseId]);
  await pool.query('DELETE FROM courses WHERE course_id = $1', [courseId]);
}

/**
 * Clean up test group and all related data
 */
export async function cleanupTestGroup(groupId) {
  await pool.query('DELETE FROM group_users WHERE group_id = $1', [groupId]);
  await pool.query('DELETE FROM course_groups WHERE group_id = $1', [groupId]);
  await pool.query('DELETE FROM groups WHERE group_id = $1', [groupId]);
}

/**
 * Generate unique email for testing
 */
export function generateTestEmail(prefix = 'test') {
  return `${prefix}.${Date.now()}.${Math.random().toString(36).substring(7)}@test.com`;
}

/**
 * Wait for database connection to be ready
 */
export async function waitForDatabase(maxRetries = 10) {
  let retries = maxRetries;
  while (retries > 0) {
    try {
      await pool.query('SELECT 1');
      return true;
    } catch (err) {
      retries--;
      if (retries === 0) throw new Error('Database connection failed');
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

/**
 * Create a test session cookie for authenticated requests
 */
export function createSessionCookie(sessionData) {
  return `conductor.sid=${encodeURIComponent(JSON.stringify(sessionData))}`;
}

/**
 * Assert database constraints
 */
export async function assertUserExists(userId) {
  const result = await pool.query('SELECT user_id FROM users WHERE user_id = $1', [userId]);
  if (result.rows.length === 0) {
    throw new Error(`User ${userId} does not exist`);
  }
  return true;
}

export async function assertCourseExists(courseId) {
  const result = await pool.query('SELECT course_id FROM courses WHERE course_id = $1', [courseId]);
  if (result.rows.length === 0) {
    throw new Error(`Course ${courseId} does not exist`);
  }
  return true;
}

/**
 * Get random item from array
 */
export function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generate random test data
 */
export function generateRandomUser() {
  const roles = ['student', 'instructor'];
  const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'];

  const firstName = getRandomItem(names);
  const lastName = getRandomItem(lastNames);

  return {
    name: `${firstName} ${lastName}`,
    email: generateTestEmail(firstName.toLowerCase()),
    password: 'TestPassword123!',
    role: getRandomItem(roles),
    pronouns: getRandomItem(['he/him', 'she/her', 'they/them']),
    phone: `555-${Math.floor(1000 + Math.random() * 9000)}`,
  };
}

export function generateRandomCourse() {
  const subjects = ['CS', 'MATH', 'PHYS', 'CHEM', 'BIO'];
  const numbers = [101, 201, 301, 401];
  const semesters = ['2024-Fall', '2024-Spring', '2025-Fall', '2025-Spring'];

  const code = `${getRandomItem(subjects)}${getRandomItem(numbers)}`;

  return {
    name: `Introduction to ${code}`,
    code,
    semester: getRandomItem(semesters),
    description: `Test course for ${code}`,
  };
}

/**
 * Measure query execution time
 */
export async function measureQueryTime(queryFn) {
  const start = Date.now();
  const result = await queryFn();
  const end = Date.now();
  return {
    result,
    executionTime: end - start,
  };
}

/**
 * Run multiple concurrent queries and return results
 */
export async function runConcurrentQueries(queries) {
  const startTime = Date.now();
  const results = await Promise.allSettled(queries);
  const endTime = Date.now();

  return {
    results,
    totalTime: endTime - startTime,
    successful: results.filter((r) => r.status === 'fulfilled').length,
    failed: results.filter((r) => r.status === 'rejected').length,
  };
}

export async function setupTestDatabase() {
  const users = await Promise.all([
    createTestUser({
      name: 'John Instructor',
      email: generateTestEmail('instructor'),
      password: 'InstructorPass123!',
      role: 'instructor',
    }),
    createTestUser({
      name: 'Jane Student',
      email: generateTestEmail('student1'),
      password: 'StudentPass123!',
      role: 'student',
    }),
    createTestUser({
      name: 'Jack Student',
      email: generateTestEmail('student2'),
      password: 'StudentPass123!',
      role: 'student',
    }),
  ]);

  const course = await createTestCourse({
    name: 'Software Engineering',
    code: 'CS401',
    semester: '2024-Fall',
    description: 'Advanced software engineering course',
  });

  await enrollUserInCourse(users[0].user_id, course.course_id, 'instructor');
  await enrollUserInCourse(users[1].user_id, course.course_id, 'student');
  await enrollUserInCourse(users[2].user_id, course.course_id, 'student');

  const activities = await Promise.all([
    createTestActivity({
      courseId: course.course_id,
      name: 'Lecture 1',
      type: 'lecture',
    }),
    createTestActivity({
      courseId: course.course_id,
      name: 'Office Hours',
      type: 'oh',
    }),
  ]);

  const group = await createTestGroup({
    name: 'Team Alpha',
    slack: '#team-alpha',
  });

  await assignGroupToCourse(group.group_id, course.course_id);
  await addUserToGroup(users[1].user_id, group.group_id, 'leader');
  await addUserToGroup(users[2].user_id, group.group_id, 'member');

  return {
    users,
    course,
    activities,
    group,
  };
}

export async function teardownTestDatabase(testData) {
  const { users, course, group } = testData;

  if (group) await cleanupTestGroup(group.group_id);
  if (course) await cleanupTestCourse(course.course_id);
  if (users) {
    for (const user of users) {
      await cleanupTestUser(user.user_id);
    }
  }
}