import { Router } from 'express';
import authRoutes from './authRoutes';
import challengeRoutes from './challengeRoutes';
import adminRoutes from './adminRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/challenges', challengeRoutes);
router.use('/admin', adminRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    event: "XenTriX'26 - Prompt Engineering Challenge",
    server_time: new Date().toISOString(),
  });
});

export default router;
