// middleware/auth.js

/**
 * A user is considered authenticated if req.session.user exists
 * AND has at least an id field populated.
 */
export function requireAuth(requiredRole = null) {
  return (req, res, next) => {
    const user = req.session?.user;
    if (!user) {
      return res.redirect('/login');
    }

    if (requiredRole && user.role !== requiredRole) {
      return res.status(403).send('Forbidden');
    }

    // Optionally attach user to req for controllers
    req.user = user;
    next();
  };
}

/**
 * Role-based instructor/TA auth
 * Requires course_users.role to be 'instructor' or 'ta'
 * (You can use this later for instructor-only actions)
 */
import { pool } from '../db.js';

export function requireInstructorOrTA(req, res, next) {
  const user = req.session?.user;
  console.log("user in auth middleware", user);
  const courseId = Number(req.params.courseId || req.body.course_id);

  if (!user || !user.id) {
    return res.status(401).json({ error: 'not_authenticated' });
  }
  if (!Number.isInteger(courseId)) {
    return res.status(400).json({ error: 'invalid_course_id' });
  }

  pool
    .query(
      `SELECT role
       FROM course_users
      WHERE user_id = $1 AND course_id = $2`,
      [user.id, courseId]
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
