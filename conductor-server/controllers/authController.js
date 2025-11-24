import {
  generateAuthUrl,
  getUserFromCode,
  login as loginService,
  register as registerService,
} from '../services/authService.js';

export function makeAuthController() {
  return {
    showLoginPage(req, res) {
      res.sendFile('login.html', { root: 'frontend/src/pages/auth' });
    },

    googleLogin(req, res) {
      const url = generateAuthUrl();
      res.redirect(url);
    },

    async login(req, res) {
      try {
        const response = await loginService(req.body);
        res.status(200).json({ user: response });
      } catch (err) {
        console.error(err);
        res.send('Login failed');
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
      if (!code) return res.redirect('/login');

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
        res.redirect('/users');
      });
    },
  };
}
