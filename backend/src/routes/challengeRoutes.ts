import { Router } from 'express';
import {
  startChallenge,
  getCurrentChallenge,
  saveDraft,
  submitChallenge,
  logActivity,
  getServerTime
} from '../controllers/challengeController';
import { authenticateToken, requireTeam } from '../middleware/auth';

const router = Router();

// Server time is accessible to any authenticated user for synchronization
router.get('/time', authenticateToken, getServerTime);

// Participant challenge actions
router.post('/start', authenticateToken, requireTeam, startChallenge);
router.get('/current', authenticateToken, requireTeam, getCurrentChallenge);
router.post('/draft', authenticateToken, requireTeam, saveDraft);
router.post('/submit', authenticateToken, requireTeam, submitChallenge);
router.post('/activity', authenticateToken, requireTeam, logActivity);

export default router;
