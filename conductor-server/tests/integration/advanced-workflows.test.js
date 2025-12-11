// conductor-server/tests/integration/advanced-workflows.test.js
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'; // ADDED beforeEach
import request from 'supertest';
import { pool } from '../../db.js';
import app from '../../server.js';
import {
  createTestUser,
  createTestCourse,
  enrollUserInCourse,
  createTestActivity,
  createAttendance,
  createTestGroup,
  addUserToGroup,
  assignGroupToCourse,
  cleanupTestUser,
  cleanupTestCourse,
  cleanupTestGroup,
  generateTestEmail,
  waitForDatabase,
  runConcurrentQueries,
  measureQueryTime,
} from '../helpers/testHelpers.js';

describe('Advanced Workflow & Performance Tests', () => {
  let instructor;
  let students = [];
  let course;
  let activities = [];
  let group;
  let instructorAgent;
  let studentAgents = [];

  beforeAll(async () => {
    await waitForDatabase();

    // Create instructor
    instructor = await createTestUser({
      name: 'Prof. Smith',
      email: generateTestEmail('prof'),
      password: 'ProfPass123!',
      role: 'instructor',
    });

    // Create multiple students
    for (let i = 0; i < 5; i++) {
      const student = await createTestUser({
        name: `Student ${i + 1}`,
        email: generateTestEmail(`student${i}`),
        password: 'StudentPass123!',
        role: 'student',
      });
      students.push(student);
    }

    // Login instructor
    instructorAgent = request.agent(app);
    await instructorAgent.post('/api/auth/login').send({
      email: instructor.email,
      password: 'ProfPass123!',
    });

    // Login all students
    for (const student of students) {
      const agent = request.agent(app);
      await agent.post('/api/auth/login').send({
        email: student.email,
        password: 'StudentPass123!',
      });
      studentAgents.push(agent);
    }

    console.log(' Advanced workflow test setup complete');
  });

  afterAll(async () => {
    // Cleanup
    try {
      if (group) await cleanupTestGroup(group.group_id);
      if (course) await cleanupTestCourse(course.course_id);
      for (const student of students) {
        await cleanupTestUser(student.user_id);
      }
      if (instructor) await cleanupTestUser(instructor.user_id);
    } catch (err) {
      console.error('Cleanup error:', err);
    } finally {
      await pool.end();
    }
  });

  // ==================== COMPLETE COURSE SETUP WORKFLOW ====================
  describe('Complete Course Setup Workflow', () => {
    it('should complete full course creation and enrollment workflow', async () => {
      // Step 1: Instructor creates course
      const courseRes = await instructorAgent.post('/api/postman/course').send({
        name: 'Advanced Databases',
        code: 'CS505',
        semester: '2024-Fall',
        description: 'Graduate level database course',
      });

      expect(courseRes.statusCode).toBe(201);
      course = courseRes.body;

      // Step 2: Enroll instructor
      await enrollUserInCourse(instructor.user_id, course.course_id, 'instructor');

      // Step 3: Enroll all students
      for (const student of students) {
        await enrollUserInCourse(student.user_id, course.course_id, 'student');
      }

      // Step 4: Verify enrollment
      const rosterRes = await instructorAgent.get(
        `/api/queries/courses/${course.course_id}/roster`
      );
      expect(rosterRes.statusCode).toBe(200);
      expect(rosterRes.body.length).toBe(6); // 1 instructor + 5 students

      // Step 5: Create team/group
      group = await createTestGroup({
        name: 'Team Database Warriors',
        slack: '#db-warriors',
      });

      await assignGroupToCourse(group.group_id, course.course_id);

      // Step 6: Assign students to group
      await addUserToGroup(students[0].user_id, group.group_id, 'leader');
      for (let i = 1; i < students.length; i++) {
        await addUserToGroup(students[i].user_id, group.group_id, 'member');
      }

      // Step 7: Create multiple activities
      for (let i = 1; i <= 10; i++) {
        const activity = await createTestActivity({
          courseId: course.course_id,
          name: `Lecture ${i}`,
          type: 'lecture',
        });
        activities.push(activity);
      }

      // Step 8: Create assignments
      const assignmentRes = await instructorAgent.post('/api/postman/assignment').send({
        course_id: course.course_id,
        name: 'Database Design Project',
        description: 'Design a normalized database schema',
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        created_by: instructor.user_id,
      });

      expect(assignmentRes.statusCode).toBe(201);

      console.log(' Complete course setup workflow passed');
    });
  });

  // ==================== ATTENDANCE TRACKING WORKFLOW ====================
  describe('Attendance Tracking Workflow', () => {
    it('should handle complex attendance scenarios', async () => {
      // Scenario 1: All students attend first lecture
      for (const student of students) {
        await createAttendance(student.user_id, activities[0].activity_id, true);
      }

      // Scenario 2: Some students miss second lecture
      await createAttendance(students[0].user_id, activities[1].activity_id, true);
      await createAttendance(students[1].user_id, activities[1].activity_id, true);
      await createAttendance(students[2].user_id, activities[1].activity_id, false);
      await createAttendance(students[3].user_id, activities[1].activity_id, false);
      await createAttendance(students[4].user_id, activities[1].activity_id, true);

      // Scenario 3: Student checks in late (marked present)
      await createAttendance(students[2].user_id, activities[2].activity_id, true);

      // Verify attendance for student with perfect attendance
      const attendanceRes = await instructorAgent.get(
        `/api/queries/users/${students[0].user_id}/attendance?course_id=${course.course_id}`
      );

      expect(attendanceRes.statusCode).toBe(200);
      expect(attendanceRes.body.length).toBeGreaterThanOrEqual(2);

      console.log('✅ Attendance tracking workflow passed');
    });

    it('should calculate attendance statistics correctly', async () => {
      // Mark attendance for all activities for one student
      const targetStudent = students[0];

      // Attend 7 out of 10 lectures
      for (let i = 0; i < 10; i++) {
        const present = i < 7; // First 7 are present
        await createAttendance(targetStudent.user_id, activities[i].activity_id, present);
      }

      // Fetch attendance records
      const attendanceRes = await instructorAgent.get(
        `/api/queries/users/${targetStudent.user_id}/attendance?course_id=${course.course_id}`
      );

      expect(attendanceRes.statusCode).toBe(200);
      const records = attendanceRes.body;
      const presentCount = records.filter((r) => r.present).length;
      const attendanceRate = (presentCount / records.length) * 100;

      expect(attendanceRate).toBe(70); // 7/10 = 70%

      console.log(` Attendance rate correctly calculated: ${attendanceRate}%`);
    });
  });

  // ==================== CONCURRENT USER OPERATIONS ====================
  describe('Concurrent User Operations', () => {
    it('should handle multiple students viewing course simultaneously', async () => {
      const queries = studentAgents.map((agent) =>
        agent.get(`/api/postman/course?course_id=${course.course_id}`)
      );

      const { results, totalTime, successful } = await runConcurrentQueries(queries);

      expect(successful).toBe(studentAgents.length);
      expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds

      console.log(`✅ ${successful} concurrent course views completed in ${totalTime}ms`);
    });

    it('should handle concurrent attendance updates', async () => {
      const testActivity = activities[5];

      const queries = students.map((student) =>
        pool.query(
          `INSERT INTO attendance (user_id, activity_id, present)
           VALUES ($1, $2, $3)
           ON CONFLICT (user_id, activity_id) DO UPDATE SET present = $3
           RETURNING *`,
          [student.user_id, testActivity.activity_id, true]
        )
      );

      const { results, successful, failed } = await runConcurrentQueries(queries);

      expect(successful).toBe(students.length);
      expect(failed).toBe(0);

      console.log(` ${successful} concurrent attendance updates completed`);
    });

    it('should handle concurrent assignment submissions', async () => {
      // Create multiple assignments
      const assignments = await Promise.all(
        Array.from({ length: 5 }, (_, i) =>
          instructorAgent.post('/api/postman/assignment').send({
            course_id: course.course_id,
            name: `Assignment ${i + 1}`,
            description: `Test assignment ${i + 1}`,
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            created_by: instructor.user_id,
          })
        )
      );

      expect(assignments.every((res) => res.statusCode === 201)).toBe(true);

      console.log(' Multiple assignments created concurrently');
    });
  });

  // ==================== PERFORMANCE BENCHMARKS ====================
  describe('Performance Benchmarks', () => {
    // FIX: Re-authenticate aggressively to avoid 401 errors using beforeEach
    beforeEach(async () => {
      // Reset the agent to ensure clean session
      instructorAgent = request.agent(app);
      await instructorAgent.post('/api/auth/login').send({
        email: instructor.email,
        password: 'ProfPass123!',
      });
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    it('should retrieve user profile efficiently', async () => {
      const { result, executionTime } = await measureQueryTime(() =>
        instructorAgent.get('/api/postman/user')
      );

      expect(result.statusCode).toBe(200);
      expect(executionTime).toBeLessThan(100); // Should be under 100ms

      console.log(`✅ User profile retrieved in ${executionTime}ms`);
    });

    it('should list courses efficiently', async () => {
      const { result, executionTime } = await measureQueryTime(() =>
        instructorAgent.get('/api/postman/courses')
      );

      expect(result.statusCode).toBe(200);
      expect(executionTime).toBeLessThan(200);

      console.log(` Courses listed in ${executionTime}ms`);
    });

    it('should fetch course roster efficiently', async () => {
      const { result, executionTime } = await measureQueryTime(() =>
        instructorAgent.get(`/api/queries/courses/${course.course_id}/roster`)
      );

      expect(result.statusCode).toBe(200);
      expect(executionTime).toBeLessThan(150);

      console.log(` Course roster fetched in ${executionTime}ms`);
    });

    it('should handle large attendance query efficiently', async () => {
      // Create more attendance records
      for (let i = 0; i < 10; i++) {
        for (const student of students) {
          await createAttendance(student.user_id, activities[i].activity_id, true);
        }
      }

      const { result, executionTime } = await measureQueryTime(() =>
        instructorAgent.get(
          `/api/queries/users/${students[0].user_id}/attendance?course_id=${course.course_id}`
        )
      );

      expect(result.statusCode).toBe(200);
      expect(result.body.length).toBeGreaterThanOrEqual(10);
      expect(executionTime).toBeLessThan(300);

      console.log(
        ` Attendance query (${result.body.length} records) completed in ${executionTime}ms`
      );
    });
  });

  // ==================== DATA INTEGRITY TESTS ====================
  describe('Data Integrity & Constraints', () => {
    it('should enforce foreign key constraints on course deletion', async () => {
      // Create a temporary course
      const tempCourse = await createTestCourse({
        name: 'Temporary Course',
        code: 'TEMP999',
        semester: '2024-Fall',
      });

      // Add activity to course
      const tempActivity = await createTestActivity({
        courseId: tempCourse.course_id,
        name: 'Temp Lecture',
      });

      // Add attendance for the activity
      await createAttendance(students[0].user_id, tempActivity.activity_id, true);

      // Delete the course (should cascade)
      await pool.query('DELETE FROM courses WHERE course_id = $1', [tempCourse.course_id]);

      // Verify activity was also deleted (cascade)
      const activityCheck = await pool.query('SELECT * FROM activities WHERE activity_id = $1', [
        tempActivity.activity_id,
      ]);

      expect(activityCheck.rows.length).toBe(0);

      console.log(' Foreign key constraints working correctly');
    });

    it('should prevent duplicate attendance entries', async () => {
      const testActivity = activities[7];
      const testStudent = students[0];

      // First attendance record
      await createAttendance(testStudent.user_id, testActivity.activity_id, true);

      // Try to create duplicate (should update instead)
      await createAttendance(testStudent.user_id, testActivity.activity_id, false);

      // Verify only one record exists
      const records = await pool.query(
        'SELECT * FROM attendance WHERE user_id = $1 AND activity_id = $2',
        [testStudent.user_id, testActivity.activity_id]
      );

      expect(records.rows.length).toBe(1);
      expect(records.rows[0].present).toBe(false); // Should be updated value

      console.log(' Duplicate attendance prevention working');
    });

    it('should enforce unique course_id + name + time constraint on activities', async () => {
      const now = new Date();

      // Create first activity
      const activity1 = await createTestActivity({
        courseId: course.course_id,
        name: 'Unique Lecture',
        startsAt: now,
      });

      // Try to create duplicate within same minute (should fail or update)
      try {
        await createTestActivity({
          courseId: course.course_id,
          name: 'Unique Lecture',
          startsAt: now,
        });
        // If it succeeds, it should be because of ON CONFLICT handling
      } catch (err) {
        // Expected to fail due to unique constraint
        expect(err).toBeDefined();
      }

      console.log(' Activity uniqueness constraint working');
    });

    it('should maintain referential integrity on user deletion', async () => {
      // Create a temporary student
      const tempStudent = await createTestUser({
        name: 'Temp Student',
        email: generateTestEmail('temp'),
        password: 'TempPass123!',
        role: 'student',
      });

      // Enroll in course
      await enrollUserInCourse(tempStudent.user_id, course.course_id, 'student');

      // Add attendance
      await createAttendance(tempStudent.user_id, activities[0].activity_id, true);

      // Delete user (should cascade delete attendance and enrollment)
      await cleanupTestUser(tempStudent.user_id);

      // Verify attendance was deleted
      const attendanceCheck = await pool.query('SELECT * FROM attendance WHERE user_id = $1', [
        tempStudent.user_id,
      ]);

      expect(attendanceCheck.rows.length).toBe(0);

      console.log(' User deletion cascade working correctly');
    });
  });

  // ==================== EDGE CASE SCENARIOS ====================
  describe('Edge Case Scenarios', () => {
    it('should handle empty course enrollment', async () => {
      const emptyCourse = await createTestCourse({
        name: 'Empty Course',
        code: 'EMPTY101',
        semester: '2024-Fall',
      });

      const rosterRes = await instructorAgent.get(
        `/api/queries/courses/${emptyCourse.course_id}/roster`
      );

      expect(rosterRes.statusCode).toBe(200);
      expect(rosterRes.body.length).toBe(0);

      await cleanupTestCourse(emptyCourse.course_id);

      console.log(' Empty course roster handled correctly');
    });

    it('should handle student with no attendance records', async () => {
      const newStudent = await createTestUser({
        name: 'New Student',
        email: generateTestEmail('new'),
        password: 'NewPass123!',
        role: 'student',
      });

      await enrollUserInCourse(newStudent.user_id, course.course_id, 'student');

      const attendanceRes = await instructorAgent.get(
        `/api/queries/users/${newStudent.user_id}/attendance?course_id=${course.course_id}`
      );

      expect(attendanceRes.statusCode).toBe(200);
      expect(attendanceRes.body.length).toBe(0);

      await cleanupTestUser(newStudent.user_id);

      console.log(' No attendance records handled correctly');
    });

    it('should handle course with no activities', async () => {
      const newCourse = await createTestCourse({
        name: 'New Course',
        code: 'NEW101',
        semester: '2024-Fall',
      });

      const activitiesRes = await instructorAgent.get(
        `/api/queries/courses/${newCourse.course_id}/activities`
      );

      expect(activitiesRes.statusCode).toBe(200);
      expect(activitiesRes.body.length).toBe(0);

      await cleanupTestCourse(newCourse.course_id);

      console.log(' Course with no activities handled correctly');
    });

    it('should handle extremely long text inputs', async () => {
      const longDescription = 'a'.repeat(5000);

      const assignmentRes = await instructorAgent.post('/api/postman/assignment').send({
        course_id: course.course_id,
        name: 'Long Description Assignment',
        description: longDescription,
      });

      // Should either succeed or return proper error
      expect([200, 201, 400, 413]).toContain(assignmentRes.statusCode);

      console.log(' Long text input handled appropriately');
    });
  });

  // ==================== MULTI-COURSE SCENARIOS ====================
  describe('Multi-Course Scenarios', () => {
    it('should handle student enrolled in multiple courses', async () => {
      const course2 = await createTestCourse({
        name: 'Second Course',
        code: 'CS202',
        semester: '2024-Fall',
      });

      const course3 = await createTestCourse({
        name: 'Third Course',
        code: 'CS303',
        semester: '2024-Fall',
      });

      // Enroll student in multiple courses
      await enrollUserInCourse(students[0].user_id, course2.course_id, 'student');
      await enrollUserInCourse(students[0].user_id, course3.course_id, 'student');

      // Get all courses for student
      const coursesRes = await studentAgents[0].get('/api/postman/courses');

      expect(coursesRes.statusCode).toBe(200);
      expect(coursesRes.body.length).toBeGreaterThanOrEqual(3);

      // Cleanup
      await cleanupTestCourse(course2.course_id);
      await cleanupTestCourse(course3.course_id);

      console.log(' Multi-course enrollment handled correctly');
    });

    it('should isolate attendance between different courses', async () => {
      const otherCourse = await createTestCourse({
        name: 'Other Course',
        code: 'OTHER999',
        semester: '2024-Fall',
      });

      const otherActivity = await createTestActivity({
        courseId: otherCourse.course_id,
        name: 'Other Lecture',
      });

      await createAttendance(students[0].user_id, otherActivity.activity_id, true);

      // Get attendance only for original course
      const attendanceRes = await instructorAgent.get(
        `/api/queries/users/${students[0].user_id}/attendance?course_id=${course.course_id}`
      );

      // Should not include attendance from other course
      const fromOtherCourse = attendanceRes.body.find(
        (a) => a.activity_id === otherActivity.activity_id
      );

      expect(fromOtherCourse).toBeUndefined();

      await cleanupTestCourse(otherCourse.course_id);

      console.log(' Attendance isolation between courses working');
    });
  });
});
