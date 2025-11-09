import { generateAuthUrl, getUserFromCode } from '../services/authService.js';

export const login = (req, res) => {
  const url = generateAuthUrl();
  res.redirect(url);
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
  req.session.destroy(err => {
    if (err) console.error(err);
    res.redirect('/users');
  });
};
