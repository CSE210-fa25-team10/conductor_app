/**
 * @fileoverview Course controller handling HTTP requests for course-related operations.
 * This controller acts as the HTTP layer between routes and the course service.
 * It handles request validation, extracts data from Express request objects,
 * and delegates business logic to the course service.
 *
 * @module controllers/courseController
 */

/**
 * Factory function that creates a course controller instance.
 * The controller provides HTTP request handlers for course creation, enrollment, and retrieval.
 *
 * @param {Object} dependencies - Dependency injection object
 * @param {Object} dependencies.courseService - Course service instance (from makeCourseService)
 * @returns {Object} Controller object with Express route handler methods:
 *   - create: POST handler for creating courses
 *   - join: POST handler for joining courses
 *   - myCourses: GET handler for retrieving user's courses
 */
export function makeCourseController({ courseService }) {
  /**
   * HTTP POST handler for creating a new course.
   * Creates a course and automatically enrolls the creator as an instructor.
   * Route: POST /api/courses
   *
   * @param {import('express').Request} req - Express request object
   * @param {number} [req.user?.user_id] - User ID from authentication session (preferred)
   * @param {number} [req.body.userId] - User ID from request body (temporary fallback)
   * @param {string} req.body.name - Course name (required)
   * @param {string} req.body.code - Course code (required)
   * @param {string} req.body.semester - Semester identifier (required)
   * @param {string} [req.body.description] - Optional course description
   * @param {import('express').Response} res - Express response object
   * @param {Function} next - Express error handler middleware
   * @returns {Promise<void>} Sends JSON response with created course or error
   * @throws {Error} If userId is missing or course creation fails
   * @example
   * POST /api/courses
   * Body: { userId: 1, name: "CS101", code: "CS101", semester: "Fall 2024", description: "Intro course" }
   * Response: 201 { course_id: 5, name: "CS101", code: "CS101", ... }
   */
  async function create(req, res, next) {
    try {
      // TEMP: until auth is wired, allow userId from body
      const userIdFromAuth = req.session?.user?.user_id;
      const userIdFromBody = req.body.userId;
      const userId = userIdFromAuth ?? userIdFromBody;

      if (!userId) {
        return res.status(400).json({ error: 'userId is required (body or auth)' });
      }

      const { name, code, semester, description } = req.body;

      const course = await courseService.createCourseForUser({
        userId,
        name,
        code,
        semester,
        description,
      });

      res.status(201).json(course);
    } catch (err) {
      next(err);
    }
  }

  /**
   * HTTP POST handler for enrolling a user as a student in a course.
   * Route: POST /api/courses/:courseId/join
   *
   * @param {import('express').Request} req - Express request object
   * @param {number} req.params.courseId - Course ID from URL parameter
   * @param {number} [req.user?.user_id] - User ID from authentication session (preferred)
   * @param {number} [req.body.userId] - User ID from request body (temporary fallback)
   * @param {import('express').Response} res - Express response object
   * @param {Function} next - Express error handler middleware
   * @returns {Promise<void>} Sends JSON response with success message or error
   * @throws {Error} If userId or courseId is missing, or enrollment fails (e.g., user/course doesn't exist)
   * @example
   * POST /api/courses/5/join
   * Body: { userId: 2 }
   * Response: 200 { message: "Joined course successfully" }
   */
  async function join(req, res, next) {
    try {
      const userIdFromAuth = req.session?.user?.user_id;
      const userIdFromBody = req.body.userId;
      const userId = userIdFromAuth ?? userIdFromBody;

      if (!userId) {
        return res.status(400).json({ error: 'userId is required (body or auth)' });
      }

      const courseId = Number(req.params.courseId);

      await courseService.joinCourse({ userId, courseId });

      res.status(200).json({ message: 'Joined course successfully' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * HTTP GET handler for retrieving all courses for the current user.
   * Returns courses where the user is enrolled (as instructor, student, or TA),
   * including their role in each course.
   * Route: GET /api/courses/me
   *
   * @param {import('express').Request} req - Express request object
   * @param {number} [req.user?.user_id] - User ID from authentication session (preferred)
   * @param {number} [req.query.userId] - User ID from query parameter (temporary fallback)
   * @param {import('express').Response} res - Express response object
   * @param {Function} next - Express error handler middleware
   * @returns {Promise<void>} Sends JSON array of course objects with role information
   * @throws {Error} If userId is missing or query fails
   * @example
   * GET /api/courses/me?userId=1
   * Response: 200 [{ course_id: 5, name: "CS101", role: "instructor", ... }, ...]
   */
  async function myCourses(req, res, next) {
    try {
      const userIdFromAuth = req.session?.user?.user_id;
      const userIdFromQuery = req.query.userId && Number(req.query.userId);
      const userId = userIdFromAuth ?? userIdFromQuery;

      if (!userId) {
        return res.status(400).json({ error: 'userId is required (query or auth)' });
      }

      const courses = await courseService.getCoursesForUser({ userId });
      res.json(courses);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Returns a frozen controller object with all course-related HTTP handlers.
   * The object is frozen to prevent accidental modification of the controller interface.
   *
   * @returns {Object} Frozen controller object containing:
   *   - create: POST handler for course creation
   *   - join: POST handler for course enrollment
   *   - myCourses: GET handler for retrieving user's courses
   */
  return Object.freeze({
    create,
    join,
    myCourses,
  });
}
