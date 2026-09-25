import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import * as db from '../db';
import * as teamService from '../services/teamService';
import * as questionService from '../services/questionService';
import * as challengeService from '../services/challengeService';
import * as activityService from '../services/activityService';
import * as auditService from '../services/auditService';
import * as settingsService from '../services/settingsService';
import * as exportService from '../services/exportService';
import { getOnlineTeamIds } from '../socket';

export async function getDashboardStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const teams = await teamService.getAllTeams();

    const totalTeams = teams.length;
    const activeTeams = teams.filter(t => t.is_active).length;
    const onlineTeams = teams.filter(t => t.is_online).length;
    const inProgressTeams = teams.filter(t => t.challenge_status === 'IN_PROGRESS').length;
    const completedTeams = teams.filter(t => ['SUBMITTED', 'AUTO_SUBMITTED'].includes(t.challenge_status)).length;
    const notStartedTeams = teams.filter(t => t.challenge_status === 'NOT_STARTED').length;

    let alertCount = 0;
    for (const t of teams) {
      if (t.challenge) {
        alertCount += (t.challenge.tab_switch_count || 0) +
                      (t.challenge.fullscreen_exit_count || 0) +
                      (t.challenge.copy_attempt_count || 0) +
                      (t.challenge.paste_attempt_count || 0);
      }
    }

    const { logs: recentActivity } = await activityService.getActivityLogs({ limit: 15 });

    const questions = await questionService.getAllQuestions();
    const activeQuestions = questions.filter(q => q.is_active).length;

    res.json({
      totalTeams,
      activeTeams,
      onlineTeams,
      inProgressTeams,
      completedTeams,
      notStartedTeams,
      alertCount,
      activeQuestions,
      totalQuestions: questions.length,
      recentActivity,
      teams,
    });
  } catch (err: any) {
    console.error('[Admin] Dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard telemetry' });
  }
}

// Teams CRUD
export async function getTeams(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const teams = await teamService.getAllTeams();
    res.json(teams);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
}

export async function getTeamDetails(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const details = await teamService.getTeamDetails(id);
    if (!details) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }
    res.json(details);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch team details' });
  }
}

export async function createTeam(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { team_name, password, team_number, domain } = req.body;
    if (!team_name || !password) {
      res.status(400).json({ error: 'Team name and password are required' });
      return;
    }

    const admin = { id: req.user!.userId, username: req.user!.username };
    const team = await teamService.createTeam({ team_name, password, team_number, domain }, admin);
    res.status(201).json({ message: 'Team created successfully', team });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create team' });
  }
}

export async function importTeams(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { teams } = req.body;
    if (!Array.isArray(teams) || teams.length === 0) {
      res.status(400).json({ error: 'Valid array of teams is required for import' });
      return;
    }

    const admin = { id: req.user!.userId, username: req.user!.username };
    const result = await teamService.bulkImportTeams(teams, admin);
    res.status(200).json({
      message: `Successfully imported ${result.added} teams (${result.skipped} skipped)`,
      ...result,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to import teams' });
  }
}

export async function updateTeam(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const { team_name, team_number, domain, is_active } = req.body;
    const admin = { id: req.user!.userId, username: req.user!.username };

    const updated = await teamService.updateTeam(id, { team_name, team_number, domain, is_active }, admin);
    if (!updated) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }
    res.json({ message: 'Team updated successfully', team: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update team' });
  }
}

export async function changeTeamPassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const { password } = req.body;
    if (!password || password.length < 4) {
      res.status(400).json({ error: 'Password must be at least 4 characters long' });
      return;
    }

    const admin = { id: req.user!.userId, username: req.user!.username };
    const success = await teamService.changeTeamPassword(id, password, admin);
    if (!success) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }
    res.json({ message: 'Password updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update password' });
  }
}

export async function deleteTeam(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const admin = { id: req.user!.userId, username: req.user!.username };
    const success = await teamService.deleteTeam(id, admin);
    if (!success) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }
    res.json({ message: 'Team deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete team' });
  }
}

// Question Management
export async function getQuestions(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const questions = await questionService.getAllQuestions();
    res.json(questions);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
}

export async function createQuestion(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { domain, title, situation, task, requirements, technical_requirements, submission_guideline, category, difficulty } = req.body;
    if (!title || !situation || !task) {
      res.status(400).json({ error: 'Title, situation, and task are required' });
      return;
    }

    const admin = { id: req.user!.userId, username: req.user!.username };
    const question = await questionService.createQuestion({
      domain,
      title,
      situation,
      task,
      requirements,
      technical_requirements,
      submission_guideline,
      category,
      difficulty,
    }, admin);

    res.status(201).json({ message: 'Question created successfully', question });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create question' });
  }
}

export async function updateQuestion(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const { domain, title, situation, task, requirements, technical_requirements, submission_guideline, category, difficulty, is_active } = req.body;
    const admin = { id: req.user!.userId, username: req.user!.username };

    const updated = await questionService.updateQuestion(id, {
      domain,
      title,
      situation,
      task,
      requirements,
      technical_requirements,
      submission_guideline,
      category,
      difficulty,
      is_active,
    }, admin);

    if (!updated) {
      res.status(404).json({ error: 'Question not found' });
      return;
    }
    res.json({ message: 'Question updated successfully', question: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update question' });
  }
}

export async function deleteQuestion(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const admin = { id: req.user!.userId, username: req.user!.username };
    const success = await questionService.deleteQuestion(id, admin);
    if (!success) {
      res.status(404).json({ error: 'Question not found' });
      return;
    }
    res.json({ message: 'Question deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete question' });
  }
}

export async function toggleQuestion(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const admin = { id: req.user!.userId, username: req.user!.username };
    const question = await questionService.toggleQuestionActive(id, admin);
    if (!question) {
      res.status(404).json({ error: 'Question not found' });
      return;
    }
    res.json({ message: 'Question status updated', question });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to toggle question status' });
  }
}

// Submissions
export async function getSubmissions(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const sql = `
      SELECT 
        s.*, 
        t.team_name, 
        t.team_number, 
        t.domain as team_domain,
        q.title as question_title,
        q.domain as question_domain,
        q.question_text, 
        q.category as question_category
      FROM submissions s
      JOIN teams t ON s.team_id = t.id
      JOIN questions q ON s.question_id = q.id
      ORDER BY s.submitted_at DESC
    `;
    const submissions = await db.query(sql);
    res.json(submissions);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
}

export async function getSubmissionById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const sql = `
      SELECT 
        s.*, 
        t.team_name, 
        t.team_number, 
        t.domain as team_domain,
        q.title as question_title,
        q.domain as question_domain,
        q.situation as question_situation,
        q.task as question_task,
        q.requirements as question_requirements,
        q.technical_requirements as question_technical_requirements,
        q.submission_guideline as question_submission_guideline,
        q.question_text, 
        q.category as question_category,
        q.difficulty as question_difficulty
      FROM submissions s
      JOIN teams t ON s.team_id = t.id
      JOIN questions q ON s.question_id = q.id
      WHERE s.id = ?
    `;
    const submission = await db.get(sql, [id]);
    if (!submission) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }
    res.json(submission);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch submission' });
  }
}

// Activity & Audit Logs
export async function getActivityLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const teamId = req.query.teamId as string | undefined;
    const eventType = req.query.eventType as string | undefined;
    const limit = parseInt(req.query.limit as string || '100', 10);
    const offset = parseInt(req.query.offset as string || '0', 10);

    const result = await activityService.getActivityLogs({ teamId, eventType, limit, offset });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
}

export async function resetActivityLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const admin = { id: req.user!.userId, username: req.user!.username };
    await activityService.resetActivityLogs();
    await auditService.logAdminAction(
      admin.id,
      admin.username,
      'RESET_ACTIVITY_LOGS',
      'SYSTEM',
      'ALL',
      'Cleared/Reset all Live Activity Stream logs'
    );
    res.json({ message: 'Live Activity Stream reset successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to reset activity logs' });
  }
}

export async function getAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string || '100', 10);
    const logs = await auditService.getAdminAuditLogs(limit);
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
}

// System Settings
export async function getSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const settings = await settingsService.getSettings();
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
}

export async function updateSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const updates = req.body;
    const admin = { id: req.user!.userId, username: req.user!.username };

    const newSettings = await settingsService.updateSettings(updates);
    await auditService.logAdminAction(
      admin.id,
      admin.username,
      'UPDATE_SETTINGS',
      'SYSTEM_SETTINGS',
      null,
      `Updated settings: ${JSON.stringify(updates)}`
    );

    res.json({ message: 'Settings updated successfully', settings: newSettings });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
}

// Reassign / Reset Challenge
export async function reassignChallenge(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const teamId = String(req.params.teamId);
    const { questionId, durationMinutes } = req.body;
    const admin = { id: req.user!.userId, username: req.user!.username };

    const challenge = await challengeService.reassignChallenge(teamId, { questionId, durationMinutes }, admin);
    res.json({ message: 'Challenge successfully reassigned', challenge });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to reassign challenge' });
  }
}

export async function resetChallenge(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const teamId = String(req.params.teamId);
    const admin = { id: req.user!.userId, username: req.user!.username };

    await challengeService.resetChallenge(teamId, admin);
    res.json({ message: 'Challenge reset to NOT_STARTED successfully' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to reset challenge' });
  }
}

// Multi-Format Export Endpoint: Word, Excel, PDF, CSV
export async function exportReport(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const format = (String(req.params.format || req.query.format || 'excel')).toLowerCase();
    const dateStr = new Date().toISOString().slice(0, 10);

    if (format === 'word' || format === 'docx') {
      const buffer = await exportService.generateWordBuffer();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="xentrix26_results_${dateStr}.docx"`);
      res.send(buffer);
    } else if (format === 'excel' || format === 'xlsx') {
      const buffer = await exportService.generateExcelBuffer();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="xentrix26_results_${dateStr}.xlsx"`);
      res.send(buffer);
    } else if (format === 'pdf') {
      const buffer = await exportService.generatePDFBuffer();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="xentrix26_results_${dateStr}.pdf"`);
      res.send(buffer);
    } else {
      // Default CSV
      const csvData = await exportService.generateResultsCSV();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="xentrix26_results_${dateStr}.csv"`);
      res.send(csvData);
    }
  } catch (err: any) {
    console.error('[Admin] Export error:', err);
    res.status(500).json({ error: 'Failed to export validation report' });
  }
}
