// middleware/auth.js

import { verifyToken } from '../services/authService.js';
import { pool } from '../db.js';

/**
 * JWT Token-based authentication middleware
 * Expects token in Authorization header: "Bearer <token>"
 * or in query parameter: ?token=<token>
 *
 * Sets req.user with decoded token payload if valid
 */
export function requireAuth(req, res, next) {
  // Try to get token from Authorization header first
  let token = null;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim(); // Remove 'Bearer ' prefix and trim whitespace
  }

  // Check if token is missing or empty
  if (!token || token.trim() === '') {
    return res.status(401).json({ error: 'no_token_provided' });
  }

  try {
    const decoded = verifyToken(token);
    // Attach user info to request object
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'invalid_or_expired_token' });
  }
}

/**
 * Role-based instructor/TA auth
 * Requires course_users.role to be 'instructor' or 'ta'
 * Must be used after requireAuth middleware
 */
export function requireInstructorOrTA(req, res, next) {
  // First ensure user is authenticated (from requireAuth)
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'not_authenticated' });
  }

  const courseId = Number(req.params.courseId || req.body.course_id);

  if (!Number.isInteger(courseId)) {
    return res.status(400).json({ error: 'invalid_course_id' });
  }

  pool
    .query(
      `SELECT role
       FROM course_users
      WHERE user_id = $1 AND course_id = $2`,
      [req.user.id, courseId]
    )
    .then((result) => {
      const row = result.rows[0];
      if (!row) return res.status(403).json({ error: 'not_enrolled' });

      const role = row.role?.toLowerCase();
      if (role === 'instructor' || role === 'ta') {
        return next();
      }
      return res.status(403).json({ error: 'insufficient_permissions' });
    })
    .catch((err) => {
      console.error('requireInstructorOrTA error:', err);
      return res.status(500).json({ error: 'internal_error' });
    });
}
