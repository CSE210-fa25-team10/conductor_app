import {
  generateAuthUrl,
  getUserFromCode,
  login as loginService,
  register as registerService,
} from '../services/authService.js';

export const googleLogin = (req, res) => {
  const url = generateAuthUrl();
  res.redirect(url);
};

export const login = async (req, res) => {
  try {
    const response = await loginService(req.body);
    // response now includes token from authService
    const { token, ...user } = response;
    res.status(200).json({
      user,
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: err.message || 'Login failed' });
  }
};

export const register = async (req, res) => {
  try {
    const response = await registerService(req.body);
    // response now includes token from authService
    const { token, ...user } = response;
    res.status(201).json({
      user,
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message || 'Register failed' });
  }
};

export const callback = async (req, res) => {
  const code = req.query.code;
  if (!code) return res.redirect('/login');

  try {
    const response = await getUserFromCode(code);
    // response now includes token from authService
    const { token, ...user } = response;

    // For OAuth callback, we can either:
    // 1. Redirect with token in query (less secure but works for web)
    // 2. Return JSON with token (better for API)
    // 3. Set token in session and redirect (hybrid approach)

    // Option: Redirect to frontend with token
    // In production, use a more secure method like httpOnly cookies or state parameter
    const redirectUrl = process.env.FRONTEND_URL || 'http://localhost:5500';
    res.redirect(`${redirectUrl}/auth/callback?token=${token}`);
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: err.message || 'Authentication failed' });
  }
};

export const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error(err);
    res.redirect('/users');
  });
};
