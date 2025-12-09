/**
 * @fileoverview Course service layer providing business logic for course operations.
 * This service orchestrates course creation, enrollment, and retrieval operations.
 * It acts as an intermediary between controllers and the repository layer.
 *
 * @module services/courseService
 */

/**
 * Factory function that creates a course service instance.
 * The service provides high-level business logic for course management.
 *
 * @param {Object} dependencies - Dependency injection object
 * @param {Object} dependencies.classRepository - Course repository instance (from makePgClassRepository)
 * @returns {Object} Service object with course-related business logic methods
 */
export function makeCourseService({ classRepository }) {
  /**
   * Creates a new course and automatically enrolls the creator as an instructor.
   * This is a business logic operation that combines course creation with enrollment.
   *
   * @param {Object} args - Course creation arguments
   * @param {number} args.userId - The user ID creating the course (becomes instructor)
   * @param {string} args.name - Course name (e.g., "Introduction to Computer Science")
   * @param {string} args.code - Course code (e.g., "CS101")
   * @param {string} args.semester - Semester identifier (e.g., "Fall 2024")
   * @param {string} [args.description] - Optional course description
   * @returns {Promise<Object>} Promise resolving to the created course object
   * @throws {Error} If course creation or enrollment fails
   * @example
   * const course = await createCourseForUser({
   *   userId: 1,
   *   name: 'CS101',
   *   code: 'CS101',
   *   semester: 'Fall 2024',
   *   description: 'Intro course'
   * });
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
   * Enrolls a user as a student in a course.
   * This is a convenience method that delegates to the repository's joinCourse method.
   *
   * @param {Object} args - Enrollment arguments
   * @param {number} args.userId - ID of the user joining the course
   * @param {number} args.courseId - ID of the course to join
   * @returns {Promise<Object>} Promise resolving to a success status object: { success: true }
   * @throws {Error} If enrollment fails (e.g., user or course doesn't exist)
   * @example
   * await joinCourse({ userId: 2, courseId: 5 });
   */
  async function joinCourse({ userId, courseId }) {
    await classRepository.joinCourse({ userId, courseId });
    return { success: true };
  }

  /**
   * Retrieves all courses for a given user (for dashboard display).
   * Delegates to the repository's getUserCourses method.
   *
   * @param {Object} args - Query arguments
   * @param {number} args.userId - ID of the user to fetch courses for
   * @returns {Promise<Array<Object>>} Promise resolving to an array of course objects with role information
   * @example
   * const courses = await getCoursesForUser({ userId: 1 });
   */
  async function getCoursesForUser({ userId }) {
    return classRepository.getUserCourses({ userId });
  }

  return Object.freeze({
    createCourseForUser,
    joinCourse,
    getCoursesForUser,
  });
}
