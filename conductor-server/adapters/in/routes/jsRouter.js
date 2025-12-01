import { Router } from 'express';
import path from 'node:path';

export function makeJsRouter() {
  const router = Router();

  router.get('/login.js', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'frontend/src/js/login.js'));
  });

  router.get('/register.js', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'frontend/src/js/register.js'));
  });

  router.get('/dashboard.js', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'frontend/src/js/dashboard.js'));
  })

  return router;
}
