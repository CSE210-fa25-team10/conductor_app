import {
  generateAuthUrl,
  getUserFromCode,
  login as loginService,
  register as registerService,
} from '../services/authService.js';
import { pool } from '../db.js';

export function makeAuthController() {
  return {
    /**
     * Redirect to Google OAuth authorization URL.
     * @param {import('express').Request} req - Express request object
     * @param {import('express').Response} res - Express response object
     */
    googleLogin(req, res) {
      const url = generateAuthUrl();
      res.redirect(url);
    },

    /**
     * Handle local login. Validates credentials and sets session user.
     * @param {import('express').Request} req - Express request object
     * @param {import('express').Response} res - Express response object
     */
    async login(req, res) {
      try {
        const response = await loginService(req.body);

        if (!response) {
          // probably redundant
          return res.status(401).send({ error: 'invalid_password' });
        }

        // Save minimal info in the session
        req.session.user = {
          user_id: response.id,
          name: response.name,
          role: response.role,
          email: response.email,
        };

        return res.status(200).json({ user: response });

        // FIXME: Temporary, we handle redirects elsewhere. This shouldn't be needed.
        // // Redirect based on role
        // if (response.role === 'instructor') {
        //   return res.redirect('/instructor');
        // } else if (response.role === 'student') {
        //   return res.redirect('/student');
        // }
        // return res.redirect('/');
      } catch (err) {
        console.error(err);
        if (err.message === 'Invalid password') {
          return res.status(401).json({ error: 'invalid_password' });
        }
        return res.status(400).json({ error: 'login_failed' });
      }
    },

    /**
     * Register a new user.
     * @param {import('express').Request} req - Express request object
     * @param {import('express').Response} res - Express response object
     */
    async register(req, res) {
      try {
        const response = await registerService(req.body);
        res.status(201).json({ user: response });
      } catch (err) {
        console.error(err);
        if (err.message === 'Email already exists') {
          return res.status(409).json({ error: 'email_exists' });
        }
        return res.status(400).json({ error: 'register_failed' });
      }
    },

    /**
     * OAuth callback handler for Google sign-in.
     * Exchanges code for user info and sets session.
     * @param {import('express').Request} req - Express request object
     * @param {import('express').Response} res - Express response object
     */
    async callback(req, res) {
      const code = req.query.code;
      if (!code) return res.redirect('/api/auth/login');

      try {
        const user = await getUserFromCode(code);
        req.session.user = user;
        res.redirect('/');
      } catch (err) {
        console.error(err);
        res.send('Authentication failed');
      }
    },

    /**
     * Log the user out by destroying the session.
     * @param {import('express').Request} req - Express request object
     * @param {import('express').Response} res - Express response object
     */
    logout(req, res) {
      req.session.destroy((err) => {
        if (err) console.error(err);
        res.redirect('/api/auth/login');
      });
    },

    /**
     * Return the current authenticated user's full profile from the DB.
     * Requires an active session.
     * @param {import('express').Request} req - Express request object
     * @param {import('express').Response} res - Express response object
     */
    async getMe(req, res) {
      try {
        const user = req.session?.user;
        if (!user || !user.id) {
          return res.status(401).json({ error: 'Not authenticated' });
        }

        // Get full user data from database
        const query =
          'SELECT user_id, name, email, phone, pronunciation, pronouns, role, availability, slack FROM users WHERE user_id = $1';
        const result = await pool.query(query, [user.id]);

        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'User not found' });
        }

        const userData = result.rows[0];
        return res.json({
          user: {
            id: userData.user_id,
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            pronunciation: userData.pronunciation,
            pronouns: userData.pronouns,
            role: userData.role,
            availability: userData.availability,
            slack: userData.slack,
          },
        });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to get user data' });
      }
    },
  };
}
