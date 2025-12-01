import { Router } from 'express';
import path from 'node:path';

export function makeCssRouter() {
  const router = Router();

  router.get('/auth.css', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'frontend/src/css/auth.css'));
  });

  return router;
}
