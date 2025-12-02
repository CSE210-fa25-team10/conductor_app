import {
  generateAuthUrl,
  getUserFromCode,
  login as loginService,
  register as registerService,
} from '../services/authService.js';

export function makeAuthController() {
  return {
    googleLogin(req, res) {
      const url = generateAuthUrl();
      res.redirect(url);
    },

    async login(req, res) {
      try {
        const response = await loginService(req.body);

        if (!response) {
          // probably redundant
          return res.status(401).send({ error: 'invalid_password' });
        }

        // Save minimal info in the session
        req.session.user = {
          id: response.id,
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
        if (err.message == 'Invalid password') {
          return res.status(401).json({ error: 'invalid_password' });
        }

        return res.status(400).json({ error: 'login_failed' });
      }
    },

    async register(req, res) {
      try {
        const response = await registerService(req.body);
        res.status(201).json({ user: response });
      } catch (err) {
        console.error(err);
        res.send('Register failed');
      }
    },

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

    logout(req, res) {
      req.session.destroy((err) => {
        if (err) console.error(err);
        res.redirect('/api/auth/login');
      });
    },
  };
}
