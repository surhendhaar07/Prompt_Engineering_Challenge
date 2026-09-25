import { v4 as uuidv4 } from 'uuid';
import * as db from '../db';
import { Team, User, Challenge, Submission, ActivityLog } from '../types';
import { hashPassword } from '../utils/security';
import { logAdminAction } from './auditService';
import { isTeamOnline } from '../socket';

export async function getAllTeams(): Promise<any[]> {
  const teams = await db.query<Team>('SELECT * FROM teams ORDER BY team_name ASC');
  const nowMs = Date.now();

  const results = [];
  for (const team of teams) {
    const challenge = await db.get<Challenge>(
      'SELECT c.*, q.question_text FROM challenges c LEFT JOIN questions q ON c.question_id = q.id WHERE c.team_id = ? ORDER BY c.started_at DESC LIMIT 1',
      [team.id]
    );

    let status = 'NOT_STARTED';
    let remainingSeconds = 0;

    if (challenge) {
      status = challenge.status;
      if (challenge.status === 'IN_PROGRESS') {
        const expiresMs = new Date(challenge.expires_at).getTime();
        remainingSeconds = Math.max(0, Math.floor((expiresMs - nowMs) / 1000));
      }
    }

    const online = isTeamOnline(team.id);

    results.push({
      ...team,
      is_online: online,
      challenge_status: status,
      challenge: challenge
        ? {
            id: challenge.id,
            question_id: challenge.question_id,
            question_text: (challenge as any).question_text,
            status: challenge.status,
            started_at: challenge.started_at,
            expires_at: challenge.expires_at,
            submitted_at: challenge.submitted_at,
            submission_type: challenge.submission_type,
            remaining_seconds: remainingSeconds,
            tab_switch_count: challenge.tab_switch_count || 0,
            fullscreen_exit_count: challenge.fullscreen_exit_count || 0,
            copy_attempt_count: challenge.copy_attempt_count || 0,
            paste_attempt_count: challenge.paste_attempt_count || 0,
          }
        : null,
    });
  }

  return results;
}

export async function getTeamDetails(id: string): Promise<any> {
  const team = await db.get<Team>('SELECT * FROM teams WHERE id = ?', [id]);
  if (!team) return null;

  const challenge = await db.get<Challenge>(
    'SELECT c.*, q.question_text, q.category, q.difficulty FROM challenges c LEFT JOIN questions q ON c.question_id = q.id WHERE c.team_id = ? ORDER BY c.started_at DESC LIMIT 1',
    [id]
  );

  let submission = null;
  if (challenge) {
    submission = await db.get<Submission>(
      'SELECT * FROM submissions WHERE challenge_id = ?',
      [challenge.id]
    );
  }

  const activityLogs = await db.query<ActivityLog>(
    'SELECT * FROM activity_logs WHERE team_id = ? ORDER BY timestamp DESC LIMIT 100',
    [id]
  );

  return {
    ...team,
    is_online: isTeamOnline(id),
    challenge,
    submission,
    activity_logs: activityLogs,
  };
}

export async function createTeam(
  data: { team_name: string; password: string; team_number?: string; domain?: string },
  admin: { id: string; username: string }
): Promise<Team> {
  const existing = await db.get('SELECT id FROM teams WHERE team_name = ?', [data.team_name.trim()]);
  if (existing) {
    throw new Error('A team with this name already exists.');
  }

  const existingUser = await db.get('SELECT id FROM users WHERE username = ?', [data.team_name.trim()]);
  if (existingUser) {
    throw new Error('Username is already taken.');
  }

  const userId = uuidv4();
  const teamId = uuidv4();
  const now = new Date().toISOString();
  const passHash = await hashPassword(data.password);
  const domain = data.domain || 'WEB DEVELOPMENT';

  await db.run(
    'INSERT INTO users (id, username, password_hash, role, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [userId, data.team_name.trim(), passHash, 'participant', 1, now, now]
  );

  await db.run(
    'INSERT INTO teams (id, user_id, team_name, team_number, domain, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [teamId, userId, data.team_name.trim(), data.team_number?.trim() || null, domain, 1, now, now]
  );

  await logAdminAction(
    admin.id,
    admin.username,
    'CREATE_TEAM',
    'TEAM',
    teamId,
    `Created team: ${data.team_name} (Domain: ${domain}, Number: ${data.team_number || 'N/A'})`
  );

  return (await db.get<Team>('SELECT * FROM teams WHERE id = ?', [teamId]))!;
}

export async function updateTeam(
  id: string,
  data: { team_name?: string; team_number?: string; domain?: string; is_active?: boolean | number },
  admin: { id: string; username: string }
): Promise<Team | null> {
  const existing = await db.get<Team>('SELECT * FROM teams WHERE id = ?', [id]);
  if (!existing) return null;

  const now = new Date().toISOString();
  const team_name = data.team_name !== undefined ? data.team_name.trim() : existing.team_name;
  const team_number = data.team_number !== undefined ? data.team_number.trim() : existing.team_number;
  const domain = data.domain !== undefined ? data.domain : (existing.domain || 'WEB DEVELOPMENT');
  const is_active = data.is_active !== undefined ? (data.is_active ? 1 : 0) : existing.is_active;

  // Check unique name if changed
  if (team_name !== existing.team_name) {
    const dup = await db.get('SELECT id FROM teams WHERE team_name = ? AND id != ?', [team_name, id]);
    if (dup) throw new Error('Team name already in use by another team.');
    await db.run('UPDATE users SET username = ?, updated_at = ? WHERE id = ?', [team_name, now, existing.user_id]);
  }

  await db.run(
    'UPDATE users SET is_active = ?, updated_at = ? WHERE id = ?',
    [is_active, now, existing.user_id]
  );

  await db.run(
    'UPDATE teams SET team_name = ?, team_number = ?, domain = ?, is_active = ?, updated_at = ? WHERE id = ?',
    [team_name, team_number, domain, is_active, now, id]
  );

  await logAdminAction(
    admin.id,
    admin.username,
    'UPDATE_TEAM',
    'TEAM',
    id,
    `Updated team: ${team_name} (Domain: ${domain}, Active: ${is_active ? 'Yes' : 'No'})`
  );

  return db.get<Team>('SELECT * FROM teams WHERE id = ?', [id]);
}

export async function changeTeamPassword(
  id: string,
  newPassword: string,
  admin: { id: string; username: string }
): Promise<boolean> {
  const team = await db.get<Team>('SELECT * FROM teams WHERE id = ?', [id]);
  if (!team) return false;

  const passHash = await hashPassword(newPassword);
  const now = new Date().toISOString();

  await db.run('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', [passHash, now, team.user_id]);

  await logAdminAction(
    admin.id,
    admin.username,
    'CHANGE_PASSWORD',
    'TEAM',
    id,
    `Reset password for team: ${team.team_name}`
  );

  return true;
}

export async function deleteTeam(
  id: string,
  admin: { id: string; username: string }
): Promise<boolean> {
  const team = await db.get<Team>('SELECT * FROM teams WHERE id = ?', [id]);
  if (!team) return false;

  await db.run('DELETE FROM submissions WHERE team_id = ?', [id]);
  await db.run('DELETE FROM challenges WHERE team_id = ?', [id]);
  await db.run('DELETE FROM activity_logs WHERE team_id = ?', [id]);
  await db.run('DELETE FROM teams WHERE id = ?', [id]);
  await db.run('DELETE FROM users WHERE id = ?', [team.user_id]);

  await logAdminAction(
    admin.id,
    admin.username,
    'DELETE_TEAM',
    'TEAM',
    id,
    `Deleted team: ${team.team_name}`
  );

  return true;
}
