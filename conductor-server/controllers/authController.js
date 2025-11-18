import { generateAuthUrl, getUserFromCode, login as loginService, register as registerService } from '../services/authService.js';

export const googleLogin = (req, res) => {
  const url = generateAuthUrl();
  res.redirect(url);
};

export const login = async (req, res) => {
  try {
    const response = await loginService(req.body);
    res.status(200).json({ user: response });
  } catch (err) {
    console.error(err);
    res.send('Login failed');
  }
};

export const register = async (req, res) => {
  try {
    const response = await registerService(req.body);
    res.status(201).json({ user: response });
  } catch (err) {
    console.error(err);
    res.send('Register failed');
  }
};

export const callback = async (req, res) => {
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
};

export const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error(err);
    res.redirect('/users');
  });
};
