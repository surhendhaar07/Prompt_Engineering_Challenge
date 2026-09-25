import * as db from '../db';
import { SystemSettings } from '../types';

export async function getSettings(): Promise<SystemSettings> {
  const rows = await db.query<{ key: string; value: string }>('SELECT key, value FROM system_settings');
  const map: Record<string, string> = {};
  for (const r of rows) {
    map[r.key] = r.value;
  }

  return {
    challenge_duration_minutes: parseInt(map.challenge_duration_minutes || '30', 10),
    active_questions_count: parseInt(map.active_questions_count || '12', 10),
    random_assignment_enabled: map.random_assignment_enabled !== 'false',
    unique_questions_enabled: map.unique_questions_enabled !== 'false',
    copy_paste_monitoring_enabled: map.copy_paste_monitoring_enabled !== 'false',
    tab_switch_monitoring_enabled: map.tab_switch_monitoring_enabled !== 'false',
    fullscreen_monitoring_enabled: map.fullscreen_monitoring_enabled !== 'false',
    right_click_prevention_enabled: map.right_click_prevention_enabled !== 'false',
    allow_manual_reassign: map.allow_manual_reassign !== 'false',
  };
}

export async function updateSettings(updates: Partial<SystemSettings>): Promise<SystemSettings> {
  const now = new Date().toISOString();
  for (const [key, value] of Object.entries(updates)) {
    const stringValue = typeof value === 'boolean' ? (value ? 'true' : 'false') : String(value);
    const existing = await db.get('SELECT key FROM system_settings WHERE key = ?', [key]);
    if (existing) {
      await db.run('UPDATE system_settings SET value = ?, updated_at = ? WHERE key = ?', [stringValue, now, key]);
    } else {
      await db.run('INSERT INTO system_settings (key, value, updated_at) VALUES (?, ?, ?)', [key, stringValue, now]);
    }
  }
  return getSettings();
}
