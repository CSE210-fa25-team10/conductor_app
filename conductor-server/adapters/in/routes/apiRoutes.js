import express from 'express';
import authRoutes from './authRoutes.js';
import queryRoutes from './queryRoutes.js';
import frontendRoutes from './frontendRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/queries', queryRoutes);
// Frontend API routes matching frontend team specifications
router.use('/', frontendRoutes);

export default router;
