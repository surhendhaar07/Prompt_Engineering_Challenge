import { Router } from 'express';
import {
  getDashboardStats,
  getTeams,
  getTeamDetails,
  createTeam,
  importTeams,
  updateTeam,
  changeTeamPassword,
  deleteTeam,
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  toggleQuestion,
  getSubmissions,
  getSubmissionById,
  getActivityLogs,
  resetActivityLogs,
  getAuditLogs,
  getSettings,
  updateSettings,
  reassignChallenge,
  resetChallenge,
  exportReport
} from '../controllers/adminController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// All admin routes require valid admin authentication
router.use(authenticateToken, requireAdmin);

// Dashboard
router.get('/dashboard', getDashboardStats);

// Teams
router.get('/teams', getTeams);
router.post('/teams', createTeam);
router.post('/teams/import', importTeams);
router.get('/teams/:id', getTeamDetails);
router.put('/teams/:id', updateTeam);
router.put('/teams/:id/password', changeTeamPassword);
router.delete('/teams/:id', deleteTeam);
router.post('/teams/:teamId/reassign', reassignChallenge);
router.post('/teams/:teamId/reset', resetChallenge);

// Questions
router.get('/questions', getQuestions);
router.post('/questions', createQuestion);
router.put('/questions/:id', updateQuestion);
router.put('/questions/:id/toggle', toggleQuestion);
router.delete('/questions/:id', deleteQuestion);

// Submissions
router.get('/submissions', getSubmissions);
router.get('/submissions/:id', getSubmissionById);

// Activity and Audit
router.get('/activity', getActivityLogs);
router.delete('/activity', resetActivityLogs);
router.get('/audit', getAuditLogs);

// Settings
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

// Multi-Format Export: Word, Excel, PDF, CSV
router.get('/export/:format', exportReport);
router.get('/export', exportReport);

export default router;
