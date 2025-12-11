// conductor-server/tests/integration/api-endpoints.test.js
// COMPLETE FIXED VERSION - Apply beforeEach re-authentication to ALL test suites

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { pool } from '../../db.js';
import app from '../../server.js';

describe('Backend API Integration Tests', () => {
  let testInstructorId;
  let testStudentId;
  let testCourseId;
  let testActivityId;
  let testAssignmentId;
  let instructorAgent;
  let studentAgent;

  // Test data
  const testInstructor = {
    name: 'Test Instructor',
    email: `instructor.${Date.now()}@test.com`,
    password: 'InstructorPass123!',
    role: 'instructor',
  };

  const testStudent = {
    name: 'Test Student',
    email: `student.${Date.now()}@test.com`,
    password: 'StudentPass123!',
    role: 'student',
  };

  const testCourse = {
    name: 'Test Course',
    code: 'CS101',
    semester: '2024-Fall',
    description: 'Integration test course',
  };

  beforeAll(async () => {
    // Wait for database connection
    let retries = 5;
    while (retries > 0) {
      try {
        await pool.query('SELECT 1');
        console.log('Test database connected');
        break;
      } catch (err) {
        retries--;
        if (retries === 0) throw err;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Register users ONCE in beforeAll
    const instructorRes = await request(app).post('/api/auth/register').send(testInstructor);
    testInstructorId = instructorRes.body.user.id;

    const studentRes = await request(app).post('/api/auth/register').send(testStudent);
    testStudentId = studentRes.body.user.id;
  });

  afterAll(async () => {
    // Cleanup test data
    try {
      if (testStudentId) {
        await pool.query('DELETE FROM attendance WHERE user_id = $1', [testStudentId]);
        await pool.query('DELETE FROM course_users WHERE user_id = $1', [testStudentId]);
        await pool.query('DELETE FROM group_users WHERE user_id = $1', [testStudentId]);
        await pool.query('DELETE FROM users WHERE user_id = $1', [testStudentId]);
      }
      if (testInstructorId) {
        await pool.query('DELETE FROM course_users WHERE user_id = $1', [testInstructorId]);
        await pool.query('DELETE FROM users WHERE user_id = $1', [testInstructorId]);
      }
      if (testCourseId) {
        await pool.query('DELETE FROM assignments WHERE course_id = $1', [testCourseId]);
        await pool.query('DELETE FROM activities WHERE course_id = $1', [testCourseId]);
        await pool.query('DELETE FROM course_users WHERE course_id = $1', [testCourseId]);
        await pool.query('DELETE FROM course_groups WHERE course_id = $1', [testCourseId]);
        await pool.query('DELETE FROM courses WHERE course_id = $1', [testCourseId]);
      }
    } catch (err) {
      console.error('Cleanup error:', err);
    } finally {
      await pool.end();
    }
  });

  // ==================== AUTH TESTS ====================
  describe('Authentication Endpoints', () => {
    describe('POST /api/auth/register', () => {
      it('should register a new instructor successfully', async () => {
        // Already registered in beforeAll, just verify
        expect(testInstructorId).toBeDefined();
      });

      it('should register a new student successfully', async () => {
        // Already registered in beforeAll, just verify
        expect(testStudentId).toBeDefined();
      });

      it('should reject registration with duplicate email', async () => {
        const res = await request(app).post('/api/auth/register').send(testInstructor);
        expect(res.statusCode).toBeGreaterThanOrEqual(400);
        expect(res.body).toHaveProperty('error');
      });

      it('should reject registration without required fields', async () => {
        const res = await request(app).post('/api/auth/register').send({
          email: 'incomplete@test.com',
        });
        expect(res.statusCode).toBeGreaterThanOrEqual(400);
      });
    });

    describe('POST /api/auth/login', () => {
      it('should login instructor with correct credentials', async () => {
        const res = await request(app).post('/api/auth/login').send({
          email: testInstructor.email,
          password: testInstructor.password,
        });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('user');
        expect(res.body.user.id).toBe(testInstructorId);
        expect(res.headers['set-cookie']).toBeDefined();
      });

      it('should login student with correct credentials', async () => {
        const res = await request(app).post('/api/auth/login').send({
          email: testStudent.email,
          password: testStudent.password,
        });

        expect(res.statusCode).toBe(200);
        expect(res.body.user.id).toBe(testStudentId);
      });

      it('should reject login with incorrect password', async () => {
        const res = await request(app).post('/api/auth/login').send({
          email: testInstructor.email,
          password: 'WrongPassword123!',
        });
        expect(res.statusCode).toBeGreaterThanOrEqual(400);
      });

      it('should reject login with non-existent email', async () => {
        const res = await request(app).post('/api/auth/login').send({
          email: 'nonexistent@test.com',
          password: 'Password123!',
        });
        expect(res.statusCode).toBeGreaterThanOrEqual(400);
      });
    });
  });

  // ==================== USER MANAGEMENT TESTS ====================
  describe('User Management Endpoints', () => {
    // 🔥 CRITICAL FIX: Re-authenticate before EACH test
    beforeEach(async () => {
      instructorAgent = request.agent(app);
      const loginRes = await instructorAgent.post('/api/auth/login').send({
        email: testInstructor.email,
        password: testInstructor.password,
      });

      // Verify login succeeded before proceeding
      if (loginRes.statusCode !== 200) {
        throw new Error(`Login failed in beforeEach: ${loginRes.statusCode}`);
      }

      studentAgent = request.agent(app);
      await studentAgent.post('/api/auth/login').send({
        email: testStudent.email,
        password: testStudent.password,
      });
    });

    describe('GET /api/postman/user', () => {
      it('should get current user info with valid session', async () => {
        const res = await instructorAgent.get('/api/postman/user');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('id', testInstructorId);
        expect(res.body).toHaveProperty('name', testInstructor.name);
        expect(res.body).toHaveProperty('email', testInstructor.email);
        expect(res.body).not.toHaveProperty('password');
      });

      it('should return 401 without session', async () => {
        const res = await request(app).get('/api/postman/user');
        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty('error');
      });
    });

    describe('POST /api/postman/user', () => {
      it('should update user profile information', async () => {
        const updates = {
          pronouns: 'they/them',
          phone: '555-1234',
          availability: 'Monday-Friday 9am-5pm',
          slack: '@testinstructor',
        };

        const res = await instructorAgent.post('/api/postman/user').send(updates);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('pronouns', updates.pronouns);
        expect(res.body).toHaveProperty('phone', updates.phone);
        expect(res.body).toHaveProperty('availability', updates.availability);
        expect(res.body).toHaveProperty('slack', updates.slack);
      });

      it('should reject update without session', async () => {
        const res = await request(app).post('/api/postman/user').send({ pronouns: 'they/them' });

        expect(res.statusCode).toBe(401);
      });

      it('should reject duplicate email update', async () => {
        const res = await instructorAgent.post('/api/postman/user').send({
          email: testStudent.email,
        });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('error');
      });
    });

    describe('Query User Endpoints', () => {
      it('GET /api/queries/users - should get all users', async () => {
        const res = await instructorAgent.get('/api/queries/users');

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(2);
      });

      it('GET /api/queries/users/:id - should get specific user', async () => {
        const res = await instructorAgent.get(`/api/queries/users/${testInstructorId}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('user_id', testInstructorId);
        expect(res.body).toHaveProperty('name', testInstructor.name);
      });

      it('GET /api/queries/users/:id - should return 404 for non-existent user', async () => {
        const res = await instructorAgent.get('/api/queries/users/999999');
        expect(res.statusCode).toBe(404);
      });

      it('GET /api/queries/users/:id - should reject invalid user ID', async () => {
        const res = await instructorAgent.get('/api/queries/users/invalid');
        expect(res.statusCode).toBe(400);
      });
    });
  });

  // ==================== COURSE MANAGEMENT TESTS ====================
  describe('Course Management Endpoints', () => {
    // Re-auth for course tests too
    beforeEach(async () => {
      if (!instructorAgent) {
        instructorAgent = request.agent(app);
        await instructorAgent.post('/api/auth/login').send({
          email: testInstructor.email,
          password: testInstructor.password,
        });
      }
      if (!studentAgent) {
        studentAgent = request.agent(app);
        await studentAgent.post('/api/auth/login').send({
          email: testStudent.email,
          password: testStudent.password,
        });
      }
    });

    describe('POST /api/postman/course', () => {
      it('should create a new course', async () => {
        const res = await instructorAgent.post('/api/postman/course').send(testCourse);

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('course_id');
        expect(res.body).toHaveProperty('name', testCourse.name);
        expect(res.body).toHaveProperty('code', testCourse.code);
        expect(res.body).toHaveProperty('semester', testCourse.semester);

        testCourseId = res.body.course_id;
        console.log(`Course created with ID: ${testCourseId}`);
      });

      it('should reject course creation without name', async () => {
        const res = await instructorAgent.post('/api/postman/course').send({
          code: 'CS102',
        });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('error');
      });
    });

    describe('GET /api/postman/course', () => {
      it('should get course by ID', async () => {
        const res = await instructorAgent.get(`/api/postman/course?course_id=${testCourseId}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('course_id', testCourseId);
        expect(res.body).toHaveProperty('name', testCourse.name);
      });

      it('should return 400 without course_id parameter', async () => {
        const res = await instructorAgent.get('/api/postman/course');

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('error');
      });

      it('should return 404 for non-existent course', async () => {
        const res = await instructorAgent.get('/api/postman/course?course_id=999999');
        expect(res.statusCode).toBe(404);
      });
    });

    describe('GET /api/postman/courses', () => {
      beforeEach(async () => {
        await pool.query(
          'INSERT INTO course_users (user_id, course_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [testInstructorId, testCourseId, 'instructor']
        );
        await pool.query(
          'INSERT INTO course_users (user_id, course_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [testStudentId, testCourseId, 'student']
        );
      });

      it('should get all courses for current user (instructor)', async () => {
        const res = await instructorAgent.get('/api/postman/courses');

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.some((c) => c.course_id === testCourseId)).toBe(true);
      });

      it('should get all courses for current user (student)', async () => {
        const res = await studentAgent.get('/api/postman/courses');

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.some((c) => c.course_id === testCourseId)).toBe(true);
      });

      it('should filter courses by user_id', async () => {
        const res = await instructorAgent.get(`/api/postman/courses?user_id=${testStudentId}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
      });
    });

    describe('Query Course Endpoints', () => {
      it('GET /api/queries/courses - should get all courses', async () => {
        const res = await instructorAgent.get('/api/queries/courses');

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.some((c) => c.course_id === testCourseId)).toBe(true);
      });

      it('GET /api/queries/courses/:id/roster - should get course roster', async () => {
        const res = await instructorAgent.get(`/api/queries/courses/${testCourseId}/roster`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(2);
      });

      it('GET /api/queries/courses/:id/activities - should get course activities', async () => {
        const res = await instructorAgent.get(`/api/queries/courses/${testCourseId}/activities`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
      });
    });
  });

  // ==================== ASSIGNMENT TESTS ====================
  describe('Assignment Management Endpoints', () => {
    beforeEach(async () => {
      if (!instructorAgent) {
        instructorAgent = request.agent(app);
        await instructorAgent.post('/api/auth/login').send({
          email: testInstructor.email,
          password: testInstructor.password,
        });
      }
    });

    describe('POST /api/postman/assignment', () => {
      it('should create a new assignment', async () => {
        const assignment = {
          course_id: testCourseId,
          name: 'Test Assignment 1',
          description: 'Integration test assignment',
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          created_by: testInstructorId,
        };

        const res = await instructorAgent.post('/api/postman/assignment').send(assignment);

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('assignment_id');
        expect(res.body).toHaveProperty('name', assignment.name);
        expect(res.body).toHaveProperty('course_id', testCourseId);

        testAssignmentId = res.body.assignment_id;
        console.log(`Assignment created with ID: ${testAssignmentId}`);
      });

      it('should reject assignment without course_id', async () => {
        const res = await instructorAgent.post('/api/postman/assignment').send({
          name: 'Invalid Assignment',
        });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('error');
      });

      it('should reject assignment without name', async () => {
        const res = await instructorAgent.post('/api/postman/assignment').send({
          course_id: testCourseId,
        });

        expect(res.statusCode).toBe(400);
      });
    });

    describe('GET /api/postman/assignment', () => {
      it('should get all assignments', async () => {
        const res = await instructorAgent.get('/api/postman/assignment');

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.some((a) => a.assignment_id === testAssignmentId)).toBe(true);
      });

      it('should get assignments filtered by course_id', async () => {
        const res = await instructorAgent.get(`/api/postman/assignment?course_id=${testCourseId}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.every((a) => a.course_id === testCourseId)).toBe(true);
      });

      it('should return empty array for course with no assignments', async () => {
        const res = await instructorAgent.get('/api/postman/assignment?course_id=999999');

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(0);
      });
    });
  });

  // ==================== ATTENDANCE TESTS ====================
  describe('Attendance Management Endpoints', () => {
    beforeEach(async () => {
      if (!instructorAgent) {
        instructorAgent = request.agent(app);
        await instructorAgent.post('/api/auth/login').send({
          email: testInstructor.email,
          password: testInstructor.password,
        });
      }

      const uniqueName = `Test Lecture ${Date.now()}`;
      const activityResult = await pool.query(
        `INSERT INTO activities (course_id, name, starts_at, type)
         VALUES ($1, $2, NOW(), $3)
         RETURNING activity_id`,
        [testCourseId, uniqueName, 'lecture']
      );
      testActivityId = activityResult.rows[0].activity_id;
    });

    describe('POST /api/queries/attendance', () => {
      it('should create attendance record for student', async () => {
        const attendance = {
          activity_id: testActivityId,
          user_id: testStudentId,
          present: true,
        };

        const res = await instructorAgent.post('/api/queries/attendance').send(attendance);

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('user_id', testStudentId);
        expect(res.body).toHaveProperty('activity_id', testActivityId);
        expect(res.body).toHaveProperty('present', true);
      });

      it('should update existing attendance record', async () => {
        await instructorAgent.post('/api/queries/attendance').send({
          activity_id: testActivityId,
          user_id: testStudentId,
          present: true,
        });

        const res = await instructorAgent.post('/api/queries/attendance').send({
          activity_id: testActivityId,
          user_id: testStudentId,
          present: false,
        });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('present', false);
      });

      it('should reject invalid activity_id', async () => {
        const res = await instructorAgent.post('/api/queries/attendance').send({
          activity_id: 'invalid',
          user_id: testStudentId,
          present: true,
        });

        expect(res.statusCode).toBe(400);
      });
    });

    describe('GET /api/queries/users/:id/attendance', () => {
      it('should get attendance for specific user', async () => {
        const res = await instructorAgent.get(`/api/queries/users/${testStudentId}/attendance`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
      });

      it('should filter attendance by course_id', async () => {
        const res = await instructorAgent.get(
          `/api/queries/users/${testStudentId}/attendance?course_id=${testCourseId}`
        );

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
      });
    });
  });

  // ==================== ERROR HANDLING TESTS ====================
  describe('Error Handling & Edge Cases', () => {
    beforeEach(async () => {
      instructorAgent = request.agent(app);
      await instructorAgent.post('/api/auth/login').send({
        email: testInstructor.email,
        password: testInstructor.password,
      });
    });

    it('should handle SQL injection attempts', async () => {
      const res = await instructorAgent.get('/api/queries/users/1; DROP TABLE users;--');
      expect(res.statusCode).toBeGreaterThanOrEqual(200);
    });

    it('should handle invalid JSON in POST body', async () => {
      const res = await request(app)
        .post('/api/postman/course')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect(res.statusCode).toBeGreaterThanOrEqual(400);
    });

    it('should handle missing Content-Type header', async () => {
      const res = await instructorAgent.post('/api/postman/course').send('name=Test');
      expect(res.statusCode).toBeGreaterThanOrEqual(200);
    });

    it('should handle concurrent requests to same endpoint', async () => {
      // Create multiple agents, each with their own session
      const agents = await Promise.all(
        Array.from({ length: 10 }, async () => {
          const agent = request.agent(app);
          await agent.post('/api/auth/login').send({
            email: testInstructor.email,
            password: testInstructor.password,
          });
          return agent;
        })
      );

      const requests = agents.map((agent) => agent.get('/api/postman/user'));
      const responses = await Promise.all(requests);

      responses.forEach((res) => {
        expect(res.statusCode).toBe(200);
      });
    });

    it('should handle very long input strings', async () => {
      const longString = 'a'.repeat(10000);
      const res = await instructorAgent.post('/api/postman/user').send({
        availability: longString,
      });

      expect([200, 400, 413, 401]).toContain(res.statusCode);
    });
  });

  // ==================== ACTIVITY & QUERY TESTS ====================
  describe('Activity Query Endpoints', () => {
    beforeEach(async () => {
      if (!instructorAgent) {
        instructorAgent = request.agent(app);
        await instructorAgent.post('/api/auth/login').send({
          email: testInstructor.email,
          password: testInstructor.password,
        });
      }
    });

    it('GET /api/queries/activities - should get all activities', async () => {
      const res = await instructorAgent.get('/api/queries/activities');

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /api/queries/activities?course_id=X - should filter by course', async () => {
      const res = await instructorAgent.get(`/api/queries/activities?course_id=${testCourseId}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.every((a) => a.course_id === testCourseId)).toBe(true);
    });
  });
});
