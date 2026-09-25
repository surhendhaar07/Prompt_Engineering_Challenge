import { v4 as uuidv4 } from 'uuid';
import * as db from '../db';
import { ActivityEventType, ActivityLog } from '../types';
import { emitToAdmins } from '../socket';

export async function logActivity(
  teamId: string,
  teamName: string,
  eventType: ActivityEventType,
  details?: string | null,
  challengeId?: string | null
): Promise<ActivityLog> {
  const id = uuidv4();
  const timestamp = new Date().toISOString();

  await db.run(
    'INSERT INTO activity_logs (id, team_id, team_name, challenge_id, event_type, details, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, teamId, teamName, challengeId || null, eventType, details || null, timestamp]
  );

  // Update challenge counters if active challenge exists
  if (challengeId) {
    if (eventType === 'TAB_SWITCH' || eventType === 'WINDOW_BLUR') {
      await db.run('UPDATE challenges SET tab_switch_count = tab_switch_count + 1 WHERE id = ?', [challengeId]);
    } else if (eventType === 'FULLSCREEN_EXIT') {
      await db.run('UPDATE challenges SET fullscreen_exit_count = fullscreen_exit_count + 1 WHERE id = ?', [challengeId]);
    } else if (eventType === 'COPY_ATTEMPT' || eventType === 'CUT_ATTEMPT') {
      await db.run('UPDATE challenges SET copy_attempt_count = copy_attempt_count + 1 WHERE id = ?', [challengeId]);
    } else if (eventType === 'PASTE_ATTEMPT') {
      await db.run('UPDATE challenges SET paste_attempt_count = paste_attempt_count + 1 WHERE id = ?', [challengeId]);
    } else if (eventType === 'SCREENSHOT_ATTEMPT' || eventType === 'EXTENSION_DETECTED' || eventType === 'DEVTOOLS_DETECTED') {
      await db.run('UPDATE challenges SET tab_switch_count = tab_switch_count + 1 WHERE id = ?', [challengeId]);
    }
  }

  const log: ActivityLog = {
    id,
    team_id: teamId,
    team_name: teamName,
    challenge_id: challengeId || null,
    event_type: eventType,
    details: details || null,
    timestamp,
  };

  // Broadcast alert to admins
  emitToAdmins('activity:alert', {
    ...log,
    isSecurityAlert: [
      'TAB_SWITCH',
      'FULLSCREEN_EXIT',
      'COPY_ATTEMPT',
      'PASTE_ATTEMPT',
      'CUT_ATTEMPT',
      'RIGHT_CLICK',
      'SCREENSHOT_ATTEMPT',
      'EXTENSION_DETECTED',
      'DEVTOOLS_DETECTED',
    ].includes(eventType)
  });

  return log;
}

export async function getActivityLogs(
  options: {
    teamId?: string;
    eventType?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ logs: ActivityLog[]; total: number }> {
  const { teamId, eventType, limit = 100, offset = 0 } = options;

  let sql = 'SELECT * FROM activity_logs WHERE 1=1';
  const params: any[] = [];

  if (teamId) {
    sql += ' AND team_id = ?';
    params.push(teamId);
  }

  if (eventType && eventType !== 'ALL') {
    sql += ' AND event_type = ?';
    params.push(eventType);
  }

  sql += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const logs = await db.query<ActivityLog>(sql, params);

  const countRes = await db.get<{ count: number }>(
    'SELECT COUNT(*) as count FROM activity_logs' + (teamId ? ' WHERE team_id = ?' : ''),
    teamId ? [teamId] : []
  );

  const total = countRes ? Number(countRes.count || (countRes as any)['COUNT(*)'] || 0) : logs.length;

  return { logs, total };
}

export async function resetActivityLogs(): Promise<void> {
  await db.run('DELETE FROM activity_logs');
}

