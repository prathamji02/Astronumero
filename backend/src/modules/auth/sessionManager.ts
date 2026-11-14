import { getDb } from '../../database/connection.ts';
import { generateId, generateSessionToken } from '../../utils/security.ts';
import { env } from '../../config/environment.ts';

export interface CreateSessionResult {
  sessionToken: string;
  expiresAt: string;
  revokedPreviousSessionsCount: number;
}

export class SessionManager {
  /**
   * Creates an authenticated session with single-device login enforcement:
   * 1. Terminates and revokes ALL prior active sessions for this user.
   * 2. Sets expires_at strictly to now + 30 days.
   * 3. Stores device info and IP address.
   */
  static createSession(userId: string, deviceInfo?: string, ipAddress?: string): CreateSessionResult {
    const db = getDb();
    const now = new Date();
    const nowIso = now.toISOString();

    // 1. Single-device enforcement: revoke all previous active sessions
    const activeSessions = db.prepare(`
      SELECT id FROM auth_sessions WHERE user_id = ? AND is_active = 1
    `).all(userId) as Array<{ id: string }>;

    if (activeSessions.length > 0) {
      db.prepare(`
        UPDATE auth_sessions
        SET is_active = 0, revoked_at = ?, revoked_reason = 'logged_in_on_another_device'
        WHERE user_id = ? AND is_active = 1
      `).run(nowIso, userId);
    }

    // 2. Strict 30-day session maximum lifetime
    const expiresAt = new Date(now.getTime() + env.SESSION_MAX_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const sessionToken = generateSessionToken();
    const sessionId = generateId();

    db.prepare(`
      INSERT INTO auth_sessions (
        id, user_id, session_token, device_info, ip_address, is_active, created_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, 1, ?, ?)
    `).run(sessionId, userId, sessionToken, deviceInfo || 'Unknown Device', ipAddress || 'Unknown IP', nowIso, expiresAt);

    return {
      sessionToken,
      expiresAt,
      revokedPreviousSessionsCount: activeSessions.length,
    };
  }

  /**
   * Terminates a specific active session.
   */
  static revokeSession(sessionToken: string, reason = 'user_logged_out'): boolean {
    const db = getDb();
    const nowIso = new Date().toISOString();
    const result = db.prepare(`
      UPDATE auth_sessions
      SET is_active = 0, revoked_at = ?, revoked_reason = ?
      WHERE session_token = ? AND is_active = 1
    `).run(nowIso, reason, sessionToken);

    return (result.changes ?? 0) > 0;
  }

  /**
   * Terminates all sessions for a user (Admin operation).
   */
  static revokeAllUserSessions(userId: string, reason = 'admin_revocation'): number {
    const db = getDb();
    const nowIso = new Date().toISOString();
    const result = db.prepare(`
      UPDATE auth_sessions
      SET is_active = 0, revoked_at = ?, revoked_reason = ?
      WHERE user_id = ? AND is_active = 1
    `).run(nowIso, reason, userId);

    return result.changes ?? 0;
  }
}
