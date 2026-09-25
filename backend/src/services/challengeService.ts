import { v4 as uuidv4 } from 'uuid';
import * as db from '../db';
import { Challenge, Submission, Question, ChallengeStatus, SubmissionType } from '../types';
import { getSettings } from './settingsService';
import { logActivity } from './activityService';
import { logAdminAction } from './auditService';
import { emitToAdmins, emitToTeam } from '../socket';

export async function getActiveChallengeForTeam(teamId: string): Promise<(Challenge & { question: Question; remaining_seconds: number; server_time: string }) | null> {
  const challenge = await db.get<Challenge>(
    'SELECT * FROM challenges WHERE team_id = ? ORDER BY started_at DESC LIMIT 1',
    [teamId]
  );

  if (!challenge) return null;

  const question = await db.get<Question>('SELECT * FROM questions WHERE id = ?', [challenge.question_id]);
  if (!question) return null;

  const nowMs = Date.now();
  const expiresMs = new Date(challenge.expires_at).getTime();
  const remainingSeconds = Math.max(0, Math.floor((expiresMs - nowMs) / 1000));

  return {
    ...challenge,
    question,
    remaining_seconds: remainingSeconds,
    server_time: new Date().toISOString(),
  };
}

export async function startChallenge(
  teamId: string,
  user: { id: string; username: string; teamName?: string }
): Promise<{ challenge: Challenge; question: Question; remaining_seconds: number; server_time: string }> {
  // Check if team already has a challenge
  const existing = await getActiveChallengeForTeam(teamId);
  if (existing) {
    if (existing.status === 'IN_PROGRESS') {
      // Return existing in-progress challenge with accurate remaining timer
      return {
        challenge: existing,
        question: existing.question,
        remaining_seconds: existing.remaining_seconds,
        server_time: existing.server_time,
      };
    } else if (['SUBMITTED', 'AUTO_SUBMITTED', 'EXPIRED'].includes(existing.status)) {
      throw new Error('Your response has already been submitted for this challenge.');
    }
  }

  const settings = await getSettings();
  const durationMinutes = settings.challenge_duration_minutes || 30;

  // Look up team domain
  const team = await db.get<{ domain: string }>('SELECT domain FROM teams WHERE id = ?', [teamId]);
  const teamDomain = team?.domain || 'WEB DEVELOPMENT';

  // Question selection logic filtered by domain
  let allActiveQuestions: Question[] = [];
  if (teamDomain === 'ANY') {
    allActiveQuestions = await db.query<Question>(
      'SELECT * FROM questions WHERE is_active = 1'
    );
  } else {
    allActiveQuestions = await db.query<Question>(
      'SELECT * FROM questions WHERE is_active = 1 AND domain = ?',
      [teamDomain]
    );
    // Fallback if no questions in specific domain
    if (allActiveQuestions.length === 0) {
      allActiveQuestions = await db.query<Question>(
        'SELECT * FROM questions WHERE is_active = 1'
      );
    }
  }

  if (allActiveQuestions.length === 0) {
    throw new Error(`No active questions available for domain: ${teamDomain}. Please contact the administrator.`);
  }

  // Limit pool according to active_questions_count setting
  const activePool = allActiveQuestions.slice(0, settings.active_questions_count || allActiveQuestions.length);

  let selectedQuestion: Question;

  if (settings.unique_questions_enabled) {
    // Check assigned questions to active/completed challenges
    const assignedIds = await db.query<{ question_id: string }>(
      "SELECT DISTINCT question_id FROM challenges WHERE status IN ('IN_PROGRESS', 'SUBMITTED', 'AUTO_SUBMITTED')"
    );
    const usedSet = new Set(assignedIds.map(a => a.question_id));
    const availableUnused = activePool.filter(q => !usedSet.has(q.id));

    if (availableUnused.length > 0) {
      if (settings.random_assignment_enabled) {
        selectedQuestion = availableUnused[Math.floor(Math.random() * availableUnused.length)];
      } else {
        selectedQuestion = availableUnused[0];
      }
    } else {
      // All used, fallback to random from pool
      selectedQuestion = activePool[Math.floor(Math.random() * activePool.length)];
    }
  } else {
    if (settings.random_assignment_enabled) {
      selectedQuestion = activePool[Math.floor(Math.random() * activePool.length)];
    } else {
      selectedQuestion = activePool[0];
    }
  }

  const challengeId = uuidv4();
  const now = new Date();
  const startedAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + durationMinutes * 60 * 1000).toISOString();

  await db.run(
    `INSERT INTO challenges (
      id, team_id, question_id, started_at, duration_minutes, expires_at,
      status, current_draft, tab_switch_count, fullscreen_exit_count,
      copy_attempt_count, paste_attempt_count, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      challengeId,
      teamId,
      selectedQuestion.id,
      startedAt,
      durationMinutes,
      expiresAt,
      'IN_PROGRESS',
      '',
      0,
      0,
      0,
      0,
      startedAt,
      startedAt,
    ]
  );

  const teamName = user.teamName || user.username;
  await logActivity(teamId, teamName, 'START', `Challenge started. Assigned Question ID: ${selectedQuestion.id}`, challengeId);

  // Notify admins
  emitToAdmins('challenge:started', {
    teamId,
    teamName,
    challengeId,
    questionId: selectedQuestion.id,
    questionText: selectedQuestion.question_text,
    startedAt,
    expiresAt,
    durationMinutes,
  });

  const remainingSeconds = durationMinutes * 60;

  const challenge: Challenge = {
    id: challengeId,
    team_id: teamId,
    question_id: selectedQuestion.id,
    started_at: startedAt,
    duration_minutes: durationMinutes,
    expires_at: expiresAt,
    status: 'IN_PROGRESS',
    current_draft: '',
    tab_switch_count: 0,
    fullscreen_exit_count: 0,
    copy_attempt_count: 0,
    paste_attempt_count: 0,
    created_at: startedAt,
    updated_at: startedAt,
  };

  return {
    challenge,
    question: selectedQuestion,
    remaining_seconds: remainingSeconds,
    server_time: startedAt,
  };
}

export async function saveDraft(teamId: string, draft: string): Promise<void> {
  const challenge = await db.get<Challenge>(
    "SELECT id, status FROM challenges WHERE team_id = ? AND status = 'IN_PROGRESS' ORDER BY started_at DESC LIMIT 1",
    [teamId]
  );

  if (!challenge) return;

  const now = new Date().toISOString();
  await db.run('UPDATE challenges SET current_draft = ?, updated_at = ? WHERE id = ?', [draft, now, challenge.id]);
}

export async function submitChallenge(
  teamId: string,
  answer: string,
  requestedType: SubmissionType = 'MANUAL'
): Promise<Submission> {
  const challenge = await db.get<Challenge>(
    "SELECT * FROM challenges WHERE team_id = ? ORDER BY started_at DESC LIMIT 1",
    [teamId]
  );

  if (!challenge) {
    throw new Error('No active challenge found to submit.');
  }

  if (['SUBMITTED', 'AUTO_SUBMITTED'].includes(challenge.status)) {
    const existingSub = await db.get<Submission>(
      'SELECT * FROM submissions WHERE challenge_id = ?',
      [challenge.id]
    );
    if (existingSub) return existingSub;
    throw new Error('Your response has already been submitted.');
  }

  const team = await db.get<{ team_name: string }>('SELECT team_name FROM teams WHERE id = ?', [teamId]);
  const teamName = team ? team.team_name : 'Unknown Team';

  const now = new Date();
  const submittedAt = now.toISOString();
  const expiresMs = new Date(challenge.expires_at).getTime();
  const nowMs = now.getTime();

  // Server-side verification of timer
  let finalSubmissionType: SubmissionType = requestedType;
  // If submitted after expires_at + 10s grace period, classify as AUTO
  if (nowMs > expiresMs + 10000) {
    finalSubmissionType = 'AUTO';
  }

  const startedMs = new Date(challenge.started_at).getTime();
  const durationUsedSeconds = Math.max(1, Math.min(challenge.duration_minutes * 60, Math.floor((nowMs - startedMs) / 1000)));

  const submissionId = uuidv4();
  const status = finalSubmissionType === 'AUTO' ? 'AUTO_SUBMITTED' : 'SUBMITTED';

  // 1. Create submission record
  await db.run(
    `INSERT INTO submissions (
      id, challenge_id, team_id, question_id, answer, started_at,
      submitted_at, expires_at, submission_type, duration_used_seconds,
      tab_switch_count, fullscreen_exit_count, copy_attempt_count,
      paste_attempt_count, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      submissionId,
      challenge.id,
      teamId,
      challenge.question_id,
      answer || challenge.current_draft || '',
      challenge.started_at,
      submittedAt,
      challenge.expires_at,
      finalSubmissionType,
      durationUsedSeconds,
      challenge.tab_switch_count,
      challenge.fullscreen_exit_count,
      challenge.copy_attempt_count,
      challenge.paste_attempt_count,
      status,
      submittedAt,
    ]
  );

  // 2. Update challenge record
  await db.run(
    `UPDATE challenges SET
      status = ?,
      submission_type = ?,
      submitted_at = ?,
      current_draft = ?,
      updated_at = ?
     WHERE id = ?`,
    [status, finalSubmissionType, submittedAt, answer || challenge.current_draft || '', submittedAt, challenge.id]
  );

  // 3. Log activity
  await logActivity(
    teamId,
    teamName,
    finalSubmissionType === 'AUTO' ? 'SUBMIT_AUTO' : 'SUBMIT_MANUAL',
    `Answer submitted (${finalSubmissionType}). Words: ${(answer || '').trim().split(/\s+/).filter(Boolean).length}`,
    challenge.id
  );

  const submission: Submission = {
    id: submissionId,
    challenge_id: challenge.id,
    team_id: teamId,
    question_id: challenge.question_id,
    answer: answer || challenge.current_draft || '',
    started_at: challenge.started_at,
    submitted_at: submittedAt,
    expires_at: challenge.expires_at,
    submission_type: finalSubmissionType,
    duration_used_seconds: durationUsedSeconds,
    tab_switch_count: challenge.tab_switch_count,
    fullscreen_exit_count: challenge.fullscreen_exit_count,
    copy_attempt_count: challenge.copy_attempt_count,
    paste_attempt_count: challenge.paste_attempt_count,
    status,
    created_at: submittedAt,
  };

  // 4. Real-time notifications
  emitToAdmins('challenge:submitted', {
    ...submission,
    teamName,
  });

  emitToTeam(teamId, 'challenge:submitted_confirmed', {
    ...submission,
    teamName,
  });

  return submission;
}

export async function checkAndExpireChallenges(): Promise<void> {
  const now = new Date();
  const nowIso = now.toISOString();

  // Find all in-progress challenges where expires_at <= current server time
  const expiredChallenges = await db.query<Challenge>(
    "SELECT * FROM challenges WHERE status = 'IN_PROGRESS' AND expires_at <= ?",
    [nowIso]
  );

  for (const ch of expiredChallenges) {
    console.log(`[Timer Engine] Challenge ${ch.id} for team ${ch.team_id} expired. Auto-submitting...`);
    try {
      await submitChallenge(ch.team_id, ch.current_draft || '', 'AUTO');
      emitToTeam(ch.team_id, 'challenge:autoSubmitted', {
        challengeId: ch.id,
        message: "Time's up! Your response has been automatically submitted.",
      });
    } catch (err) {
      console.error(`[Timer Engine] Error auto-submitting challenge ${ch.id}:`, err);
    }
  }
}

export async function reassignChallenge(
  teamId: string,
  options: { questionId?: string; durationMinutes?: number },
  admin: { id: string; username: string }
): Promise<any> {
  const team = await db.get<{ team_name: string }>('SELECT team_name FROM teams WHERE id = ?', [teamId]);
  if (!team) throw new Error('Team not found.');

  // Clean old submissions and challenge
  const oldChallenge = await db.get<Challenge>('SELECT * FROM challenges WHERE team_id = ? ORDER BY started_at DESC LIMIT 1', [teamId]);
  if (oldChallenge) {
    await db.run('DELETE FROM submissions WHERE challenge_id = ?', [oldChallenge.id]);
    await db.run('DELETE FROM challenges WHERE id = ?', [oldChallenge.id]);
  }

  // Assign new question if specified, otherwise pick random
  let newQuestionId = options.questionId;
  if (!newQuestionId) {
    const questions = await db.query<Question>('SELECT id FROM questions WHERE is_active = 1');
    if (questions.length > 0) {
      newQuestionId = questions[Math.floor(Math.random() * questions.length)].id;
    }
  }

  if (!newQuestionId) throw new Error('No active questions found for assignment.');

  const settings = await getSettings();
  const durationMinutes = options.durationMinutes || settings.challenge_duration_minutes || 30;

  const newChallengeId = uuidv4();
  const now = new Date();
  const startedAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + durationMinutes * 60 * 1000).toISOString();

  await db.run(
    `INSERT INTO challenges (
      id, team_id, question_id, started_at, duration_minutes, expires_at,
      status, current_draft, tab_switch_count, fullscreen_exit_count,
      copy_attempt_count, paste_attempt_count, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      newChallengeId,
      teamId,
      newQuestionId,
      startedAt,
      durationMinutes,
      expiresAt,
      'IN_PROGRESS',
      '',
      0,
      0,
      0,
      0,
      startedAt,
      startedAt,
    ]
  );

  await logAdminAction(
    admin.id,
    admin.username,
    'REASSIGN_CHALLENGE',
    'TEAM',
    teamId,
    `Reassigned challenge for ${team.team_name} with new Question ID: ${newQuestionId}`
  );

  emitToTeam(teamId, 'challenge:reassigned', {
    challengeId: newChallengeId,
    message: 'Your challenge has been reassigned by the event administrator.',
  });

  return getActiveChallengeForTeam(teamId);
}

export async function resetChallenge(
  teamId: string,
  admin: { id: string; username: string }
): Promise<void> {
  const team = await db.get<{ team_name: string }>('SELECT team_name FROM teams WHERE id = ?', [teamId]);
  if (!team) throw new Error('Team not found.');

  const oldChallenge = await db.get<Challenge>('SELECT * FROM challenges WHERE team_id = ? ORDER BY started_at DESC LIMIT 1', [teamId]);
  if (oldChallenge) {
    await db.run('DELETE FROM submissions WHERE challenge_id = ?', [oldChallenge.id]);
    await db.run('DELETE FROM challenges WHERE id = ?', [oldChallenge.id]);
  }

  await logAdminAction(
    admin.id,
    admin.username,
    'RESET_CHALLENGE',
    'TEAM',
    teamId,
    `Reset challenge state for ${team.team_name} back to NOT_STARTED`
  );

  emitToTeam(teamId, 'challenge:reset', {
    message: 'Your challenge has been reset by the event administrator.',
  });
}
