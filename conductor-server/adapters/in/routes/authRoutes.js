import express from 'express';
import {
  googleLogin,
  callback,
  login,
  register,
  logout,
} from '../../../controllers/authController.js';

const router = express.Router();

router.get('/googlelogin', googleLogin);
router.post('/login', login);
router.post('/register', register);
router.get('/google/callback', callback);
router.get('/logout', logout);

export default router;
