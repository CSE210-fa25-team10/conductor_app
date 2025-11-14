import express from 'express';
import authRoutes from './authRoutes.js';
import attendanceRoutes from './attendanceRoutes.js';
const router = express.Router();

router.use("/auth", authRoutes);
router.use('/attendance', attendanceRoutes);

export default router;
