import { Router } from 'express';

export function makeAuthRouter({ authController }) {
  const router = Router();

  router.get('/googlelogin', authController.googleLogin);
  router.post('/login', authController.login);
  router.post('/register', authController.register);
  router.get('/google/callback', authController.callback);
  router.get('/logout', authController.logout);

  return router;
}
