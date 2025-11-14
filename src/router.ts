import express, { type Router } from 'express';
import authRoutes from './modules/auth/auth.routes.js';

const router: Router = express.Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'MTP Server is running' });
});

router.use('/api/auth', authRoutes);

export default router;
