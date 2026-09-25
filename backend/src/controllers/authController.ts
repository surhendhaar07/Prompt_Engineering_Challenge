import { Request, Response } from 'express';
import * as db from '../db';
import { User, Team } from '../types';
import { comparePassword, generateToken } from '../utils/security';
import { logActivity } from '../services/activityService';
import { AuthenticatedRequest } from '../middleware/auth';

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Username/Team Name and password are required.' });
      return;
    }

    const trimmedUsername = String(username).trim();
    const user = await db.get<User>('SELECT * FROM users WHERE username = ?', [trimmedUsername]);

    // Constant-time check mitigation
    if (!user) {
      res.status(401).json({ error: 'Invalid team name or password.' });
      return;
    }

    if (!user.is_active) {
      res.status(403).json({ error: 'This team account has been disabled. Please contact the event coordinator.' });
      return;
    }

    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid team name or password.' });
      return;
    }

    let teamId: string | undefined;
    let teamName: string | undefined;

    if (user.role === 'participant') {
      const team = await db.get<Team>('SELECT * FROM teams WHERE user_id = ?', [user.id]);
      if (!team || !team.is_active) {
        res.status(403).json({ error: 'This team account has been disabled. Please contact the event coordinator.' });
        return;
      }
      teamId = team.id;
      teamName = team.team_name;

      // Log login activity
      await logActivity(team.id, team.team_name, 'LOGIN', 'Team logged in successfully.');
    }

    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role,
      teamId,
      teamName,
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        teamId,
        teamName,
      },
    });
  } catch (err: any) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ error: 'An error occurred during authentication.' });
  }
}

export async function me(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await db.get<User>('SELECT id, username, role, is_active FROM users WHERE id = ?', [req.user.userId]);
    if (!user || !user.is_active) {
      res.status(401).json({ error: 'User account is inactive or not found.' });
      return;
    }

    let team = null;
    if (user.role === 'participant') {
      team = await db.get<Team>('SELECT * FROM teams WHERE user_id = ?', [user.id]);
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        teamId: team?.id,
        teamName: team?.team_name,
        teamNumber: team?.team_number,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch user session' });
  }
}

export async function logout(req: AuthenticatedRequest, res: Response): Promise<void> {
  res.json({ message: 'Logged out successfully' });
}
