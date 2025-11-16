import express, { type Router } from 'express';
import authRoutes from './modules/auth/auth.routes.js';
import leaveRequestRoutes from './modules/leave-request/leave-request.routes.js';
import adminRoutes from './modules/leave-request/admin.routes.js';
import holidaysRoutes from './modules/holidays/holidays.routes.js';

const router: Router = express.Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'MTP Server is running' });
});

router.use('/api/auth', authRoutes);
router.use('/api/leave-requests', leaveRequestRoutes);
router.use('/api/admin', adminRoutes);
router.use('/api/holidays', holidaysRoutes);

export default router;
