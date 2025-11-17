import express from 'express';
import authRoutes from './authRoutes.js';
import queryRoutes from './queryRoutes.js';
import frontendRoutes from './frontendRoutes.js';
import attendanceRoutes from './attendanceRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/queries', queryRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/', frontendRoutes);

export default router;
