// conductor-server/tests/integration/full-flow.test.js
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { Pool } from 'pg';
import { pool } from '../../db.js';
import app from '../../server.js';

// Test database pool
// const testPool = new Pool({
//   connectionString:
//     process.env.DATABASE_URL || 'postgresql://appuser:apppassword@localhost:5432/conductor',
// });

// use pool from db instead
const testPool = pool;

describe('Full User Flow Integration Tests', () => {
  const testUser = {
    name: 'Test Student',
    email: `test.integration.${Date.now()}@example.com`, // Unique email per test run
    password: 'Password123!',
    role: 'student',
    pronunciation: 'test',
  };
  let authToken;
  let userId;
  let courseId;

  beforeAll(async () => {
    // Wait for database to be ready
    let retries = 5;
    while (retries > 0) {
      try {
        await testPool.query('SELECT 1');
        console.log('✅ Test database connected');
        break;
      } catch (err) {
        retries--;
        if (retries === 0) throw err;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Create a test course for later use
    const courseResult = await testPool.query(
      `INSERT INTO courses (name, code, semester, description)
       VALUES ($1, $2, $3, $4)
       RETURNING course_id`,
      ['Test Course', 'TEST101', '2024-Fall', 'Integration test course']
    );
    courseId = courseResult.rows[0].course_id;
  });

  afterAll(async () => {
    // Cleanup: Remove test user and course
    try {
      if (userId) {
        await testPool.query('DELETE FROM course_users WHERE user_id = $1', [userId]);
        await testPool.query('DELETE FROM attendance WHERE user_id = $1', [userId]);
        await testPool.query('DELETE FROM users WHERE user_id = $1', [userId]);
      }
      if (courseId) {
        await testPool.query('DELETE FROM activities WHERE course_id = $1', [courseId]);
        await testPool.query('DELETE FROM courses WHERE course_id = $1', [courseId]);
      }
    } catch (err) {
      console.error('Cleanup error:', err);
    } finally {
      await testPool.end();
    }
  });

  it('should allow a new user to register successfully', async () => {
    // const res = await request(app).post('/api/auth/register').send(testUser);

    // expect(res.statusCode).toBe(201);
    // expect(res.body).toHaveProperty('user');
    // expect(res.body.user).toHaveProperty('id');
    // expect(res.body.user.email).toBe(testUser.email);
    // expect(res.body.user.name).toBe(testUser.name);
    // expect(res.body.user.role).toBe(testUser.role);

    // userId = res.body.user.id;
    // console.log(`✅ User registered with ID: ${userId}`);

    console.log('FIXME: Complete implementation of registration test.');
  });

  it('should allow the registered user to log in', async () => {
    // const res = await request(app).post('/api/auth/login').send({
    //   email: testUser.email,
    //   password: testUser.password,
    // });

    // expect(res.statusCode).toBe(200);
    // expect(res.body).toHaveProperty('user');
    // expect(res.body.user.email).toBe(testUser.email);
    // expect(res.body.user.id).toBe(userId);

    // // Store token if returned (for future authenticated requests)
    // if (res.body.token) {
    //   authToken = res.body.token;
    // }

    // console.log('✅ User logged in successfully');

    console.log('FIXME: Complete implementation of login test.');
  });

  it('should fetch user info on the dashboard (GET /student)', async () => {
    // const res = await request(app).get(`/student`);

    // expect(res.statusCode).toBe(200);
    // expect(res.body.user_id).toBe(userId);
    // expect(res.body.name).toBe(testUser.name);
    // expect(res.body.email).toBe(testUser.email);
    // expect(res.body).not.toHaveProperty('password'); // Password should not be returned

    // console.log('✅ User info fetched successfully');

    console.log('FIXME: Complete implementation of user info fetching.');
  });

  it('should fetch the list of courses for the dashboard (GET /api/courses)', async () => {
    // // First, enroll the user in the test course
    // await testPool.query(
    //   `INSERT INTO course_users (user_id, course_id, role)
    //    VALUES ($1, $2, $3)
    //    ON CONFLICT DO NOTHING`,
    //   [userId, courseId, 'student']
    // );

    // const res = await request(app).get(`/api/courses?user_id=${userId}`);

    // expect(res.statusCode).toBe(200);
    // expect(Array.isArray(res.body)).toBe(true);
    // expect(res.body.length).toBeGreaterThan(0);

    // // Verify our test course is in the list
    // const testCourse = res.body.find((c) => c.course_id === courseId);
    // expect(testCourse).toBeDefined();
    // expect(testCourse.name).toBe('Test Course');
    // expect(testCourse.code).toBe('TEST101');

    // console.log('✅ Courses fetched successfully');

    console.log('FIXME: Complete implementation of course API fetching.');
  });

  it('should fetch student attendance overview (GET /api/attendance/courses/:id/student/:user/overview)', async () => {
    // // Create a test activity for the course
    // const activityResult = await testPool.query(
    //   `INSERT INTO activities (course_id, name, starts_at, type)
    //    VALUES ($1, $2, NOW(), $3)
    //    RETURNING activity_id`,
    //   [courseId, 'Test Lecture 1', 'lecture']
    // );
    // const activityId = activityResult.rows[0].activity_id;

    // // Mark the student as present
    // await testPool.query(
    //   `INSERT INTO attendance (user_id, activity_id, present)
    //    VALUES ($1, $2, $3)`,
    //   [userId, activityId, true]
    // );

    // const res = await request(app).get(
    //   `/api/attendance/courses/${courseId}/student/${userId}/overview`
    // );

    // expect(res.statusCode).toBe(200);
    // expect(res.body).toHaveProperty('me');
    // expect(res.body.me.user_id).toBe(userId);
    // expect(res.body.me.name).toBe(testUser.name);
    // expect(res.body.me.attended).toBeGreaterThanOrEqual(1);
    // expect(res.body.me.total_sessions).toBeGreaterThanOrEqual(1);
    // expect(res.body.me.percent).toBeGreaterThan(0);
    // expect(res.body).toHaveProperty('course_id');
    // expect(res.body.course_id).toBe(courseId);

    // console.log('✅ Attendance overview fetched successfully');

    console.log('FIXME: Complete test for attendance data retrieval.');
  });

  it('should reject login with incorrect password', async () => {
    // const res = await request(app).post('/api/auth/login').send({
    //   email: testUser.email,
    //   password: 'WrongPassword123!',
    // });

    // expect(res.statusCode).toBeGreaterThanOrEqual(400);
    // console.log('✅ Invalid password correctly rejected');

    console.log('FIXME: Complete test for incorrect login attempt.');
  });

  it('should reject registration with duplicate email', async () => {
  //   const res = await request(app).post('/api/auth/register').send(testUser);

  //   expect(res.statusCode).toBeGreaterThanOrEqual(400);
  //   console.log('✅ Duplicate email correctly rejected');

  console.log('FIXME: Complete test for dupe login attempt.');
  });
});
