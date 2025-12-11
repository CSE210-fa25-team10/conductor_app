/**
 * @fileoverview Course service layer providing business logic for course operations.
 * This service orchestrates course creation, enrollment, and retrieval operations.
 * It acts as an intermediary between controllers and the repository layer.
 *
 * @module services/courseService
 */

export function makeCourseService({ classRepository }) {
  /**
   * Creates a new course and automatically enrolls the creator as an instructor.
   */
  async function createCourseForUser({ userId, name, code, semester, description }) {
    const course = await classRepository.createCourse({
      name,
      code,
      semester,
      description,
    });

    // creator becomes instructor
    await classRepository.addCourseUser({
      userId,
      courseId: course.course_id,
      role: 'instructor',
    });

    return course;
  }

  /**
   * Enrolls a user in a course with the given role.
   *
   * @param {Object} args
   * @param {number} args.userId
   * @param {number} args.courseId
   * @param {string} [args.role='student'] - 'student' or 'instructor'
   */
  async function joinCourse({ userId, courseId, role = 'student' }) {
    await classRepository.joinCourse({ userId, courseId, role });
    return { success: true };
  }

  /**
   * Retrieves all courses for a given user (for dashboard display).
   */
  async function getCoursesForUser({ userId }) {
    return classRepository.getUserCourses({ userId });
  }

  /**
   * Looks up a course by its code (e.g., "CS101").
   *
   * @param {Object} args
   * @param {string} args.courseCode
   */
  async function getCourseByCode({ courseCode }) {
    return classRepository.getCourseByCode({ courseCode });
  }

  return Object.freeze({
    createCourseForUser,
    joinCourse,
    getCoursesForUser,
    getCourseByCode,
  });
}
