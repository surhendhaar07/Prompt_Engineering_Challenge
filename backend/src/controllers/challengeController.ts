import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import * as challengeService from '../services/challengeService';
import * as activityService from '../services/activityService';
import { ActivityEventType } from '../types';

export async function startChallenge(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const teamId = req.user!.teamId!;
    const user = {
      id: req.user!.userId,
      username: req.user!.username,
      teamName: req.user!.teamName,
    };

    const result = await challengeService.startChallenge(teamId, user);
    res.json(result);
  } catch (err: any) {
    console.error('[Challenge] Start error:', err);
    res.status(400).json({ error: err.message || 'Failed to start challenge' });
  }
}

export async function getCurrentChallenge(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const teamId = req.user!.teamId!;
    const challengeData = await challengeService.getActiveChallengeForTeam(teamId);

    if (!challengeData) {
      res.json({ challenge: null, question: null, status: 'NOT_STARTED' });
      return;
    }

    res.json({
      challenge: challengeData,
      question: challengeData.question,
      remaining_seconds: challengeData.remaining_seconds,
      server_time: challengeData.server_time,
      status: challengeData.status,
    });
  } catch (err: any) {
    console.error('[Challenge] Get current error:', err);
    res.status(500).json({ error: 'Failed to retrieve challenge details' });
  }
}

export async function saveDraft(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const teamId = req.user!.teamId!;
    const { draft } = req.body;
    await challengeService.saveDraft(teamId, draft || '');
    res.json({ success: true, saved_at: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save draft' });
  }
}

export async function submitChallenge(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const teamId = req.user!.teamId!;
    const { answer, submissionType } = req.body;

    const submission = await challengeService.submitChallenge(
      teamId,
      answer || '',
      submissionType === 'AUTO' ? 'AUTO' : 'MANUAL'
    );

    res.json({
      success: true,
      message: 'Submission successful',
      submission,
    });
  } catch (err: any) {
    console.error('[Challenge] Submit error:', err);
    res.status(400).json({ error: err.message || 'Failed to submit challenge' });
  }
}

export async function logActivity(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const teamId = req.user!.teamId!;
    const teamName = req.user!.teamName || req.user!.username;
    const { eventType, details, challengeId } = req.body;

    if (!eventType) {
      res.status(400).json({ error: 'eventType is required' });
      return;
    }

    const log = await activityService.logActivity(
      teamId,
      teamName,
      eventType as ActivityEventType,
      details,
      challengeId
    );

    res.json({ success: true, log });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to log activity' });
  }
}

export async function getServerTime(req: AuthenticatedRequest, res: Response): Promise<void> {
  res.json({
    server_time: new Date().toISOString(),
    timestamp_ms: Date.now(),
  });
}
