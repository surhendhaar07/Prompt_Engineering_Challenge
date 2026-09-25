import { v4 as uuidv4 } from 'uuid';
import * as db from '../db';
import { AdminAuditLog } from '../types';
import { emitToAdmins } from '../socket';

export async function logAdminAction(
  adminId: string,
  adminUsername: string,
  action: string,
  targetType: string,
  targetId?: string | null,
  details?: string | null
): Promise<AdminAuditLog> {
  const id = uuidv4();
  const timestamp = new Date().toISOString();

  await db.run(
    'INSERT INTO admin_audit_logs (id, admin_id, admin_username, action, target_type, target_id, details, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, adminId, adminUsername, action, targetType, targetId || null, details || null, timestamp]
  );

  const logEntry: AdminAuditLog = {
    id,
    admin_id: adminId,
    admin_username: adminUsername,
    action,
    target_type: targetType,
    target_id: targetId || null,
    details: details || null,
    timestamp,
  };

  emitToAdmins('admin:audit_logged', logEntry);
  return logEntry;
}

export async function getAdminAuditLogs(limit = 100): Promise<AdminAuditLog[]> {
  return db.query<AdminAuditLog>(
    'SELECT * FROM admin_audit_logs ORDER BY timestamp DESC LIMIT ?',
    [limit]
  );
}
