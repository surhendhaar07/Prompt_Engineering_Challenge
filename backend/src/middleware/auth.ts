import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { verifyToken } from '../utils/security';
import { AuthTokenPayload } from '../types';
import * as db from '../db';

export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) {
    res.status(401).json({ error: 'Authentication required. No token provided.' });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(403).json({ error: 'Invalid or expired session token.' });
    return;
  }

  req.user = payload;
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    return;
  }
  next();
}

export async function requireTeam(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  if (!req.user || req.user.role !== 'participant' || !req.user.teamId) {
    res.status(403).json({ error: 'Access denied. Participant team account required.' });
    return;
  }

  // Verify team is active
  const team = await db.get('SELECT is_active FROM teams WHERE id = ?', [req.user.teamId]);
  if (!team || !team.is_active) {
    res.status(403).json({ error: 'This team account has been disabled. Please contact the event coordinator.' });
    return;
  }

  next();
}

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 attempts per 15 minutes per IP
  message: { error: 'Too many login attempts from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
