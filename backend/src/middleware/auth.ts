import type { Request, Response, NextFunction } from 'express';
import { getDb } from '../database/connection.ts';

export interface AuthenticatedUser {
  id: string;
  email: string | null;
  mobile: string | null;
  fullName: string;
  role: 'user' | 'super_admin' | 'admin' | 'support_admin';
  status: 'active' | 'suspended' | 'deactivated';
}

export interface AuthenticatedSession {
  id: string;
  sessionToken: string;
  userId: string;
  deviceInfo: string | null;
  ipAddress: string | null;
  createdAt: string;
  expiresAt: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      session?: AuthenticatedSession;
    }
  }
}

/**
 * Authentication Middleware:
 * 1. Reads Bearer token from Authorization header (or x-session-token).
 * 2. Validates session in database.
 * 3. Enforces Single-Device Login: checks if is_active = 1. If revoked by another login, rejects.
 * 4. Enforces 30-Day Maximum Lifetime: checks if current time > expires_at. Rejects without extension.
 * 5. Validates user account status (active).
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization || (req.headers['x-session-token'] as string);
  if (!authHeader) {
    res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Authentication required. No session token provided.',
    });
    return;
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
  if (!token) {
    res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Malformed session token.',
    });
    return;
  }

  const db = getDb();
  const sessionRow = db.prepare(`
    SELECT id, user_id, session_token, device_info, ip_address, is_active, created_at, expires_at, revoked_at, revoked_reason
    FROM auth_sessions
    WHERE session_token = ?
  `).get(token) as {
    id: string;
    user_id: string;
    session_token: string;
    device_info: string | null;
    ip_address: string | null;
    is_active: number;
    created_at: string;
    expires_at: string;
    revoked_at: string | null;
    revoked_reason: string | null;
  } | undefined;

  if (!sessionRow) {
    res.status(401).json({
      error: 'INVALID_SESSION',
      message: 'Session not found. Please log in.',
    });
    return;
  }

  // 1. Single-device login enforcement check:
  if (sessionRow.is_active === 0) {
    res.status(401).json({
      error: 'SESSION_REVOKED',
      message: sessionRow.revoked_reason === 'logged_in_on_another_device'
        ? 'Your account was logged in on another device. For your security, this previous session was terminated.'
        : 'Your session has been terminated. Please log in again.',
    });
    return;
  }

  // 2. 30-Day strict expiry check:
  const now = new Date();
  const expiresAt = new Date(sessionRow.expires_at);
  if (now > expiresAt) {
    // Revoke expired session in DB
    db.prepare(`
      UPDATE auth_sessions
      SET is_active = 0, revoked_at = ?, revoked_reason = 'expired_30_days'
      WHERE id = ?
    `).run(now.toISOString(), sessionRow.id);

    res.status(401).json({
      error: 'SESSION_EXPIRED',
      message: 'Your session has exceeded its maximum 30-day lifetime. Please verify your OTP to log in again.',
    });
    return;
  }

  // 3. User lookup & status check:
  const userRow = db.prepare(`
    SELECT id, email, mobile, full_name, role, status
    FROM users
    WHERE id = ?
  `).get(sessionRow.user_id) as {
    id: string;
    email: string | null;
    mobile: string | null;
    full_name: string;
    role: 'user' | 'super_admin' | 'admin' | 'support_admin';
    status: 'active' | 'suspended' | 'deactivated';
  } | undefined;

  if (!userRow || userRow.status !== 'active') {
    res.status(403).json({
      error: 'ACCOUNT_INACTIVE',
      message: 'Your account is inactive, suspended, or does not exist.',
    });
    return;
  }

  req.user = {
    id: userRow.id,
    email: userRow.email,
    mobile: userRow.mobile,
    fullName: userRow.full_name,
    role: userRow.role,
    status: userRow.status,
  };

  req.session = {
    id: sessionRow.id,
    sessionToken: sessionRow.session_token,
    userId: sessionRow.user_id,
    deviceInfo: sessionRow.device_info,
    ipAddress: sessionRow.ip_address,
    createdAt: sessionRow.created_at,
    expiresAt: sessionRow.expires_at,
  };

  next();
}

/**
 * Role-Based Access Control (RBAC) Middleware:
 * Verifies that the authenticated user possesses one of the allowed administrative roles.
 */
export function requireRoles(...allowedRoles: Array<'user' | 'super_admin' | 'admin' | 'support_admin'>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Access denied. You do not have the required permissions to access this administrative resource.',
      });
      return;
    }

    next();
  };
}
