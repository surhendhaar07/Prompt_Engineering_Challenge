import { Router } from 'express';
import { login, me, logout } from '../controllers/authController';
import { authenticateToken, loginLimiter } from '../middleware/auth';

const router = Router();

router.post('/login', loginLimiter, login);
router.get('/me', authenticateToken, me);
router.post('/logout', authenticateToken, logout);

export default router;
