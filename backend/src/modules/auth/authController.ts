import { Router } from 'express';
import type { Request, Response } from 'express';
import { getDb } from '../../database/connection.ts';
import { OtpService } from './otpService.ts';
import { SessionManager } from './sessionManager.ts';
import { generateId, verifyPassword } from '../../utils/security.ts';
import { requireAuth } from '../../middleware/auth.ts';
import { getUserActiveSubscription } from '../../middleware/entitlements.ts';

export const authRouter = Router();

/**
 * POST /api/auth/otp/request
 * Initiates OTP login for normal users (email or mobile SMS).
 */
authRouter.post('/otp/request', async (req: Request, res: Response): Promise<void> => {
  const { identifier, channel } = req.body;

  if (!identifier || typeof identifier !== 'string') {
    res.status(400).json({ error: 'INVALID_INPUT', message: 'Identifier (email or mobile number) is required.' });
    return;
  }

  const selectedChannel = channel === 'sms' ? 'sms' : 'email';
  const result = await OtpService.requestOtp(identifier, selectedChannel);

  if (!result.success) {
    res.status(429).json({ error: 'RATE_LIMITED', message: result.message });
    return;
  }

  res.json({
    success: true,
    message: result.message,
    channel: result.channel,
    identifier: result.identifier,
    deliveredLive: result.deliveredLive,
    devCode: result.devCode,
  });
});

/**
 * POST /api/auth/otp/verify
 * Verifies OTP, provisions or retrieves user, and creates a single-device session.
 */
authRouter.post('/otp/verify', (req: Request, res: Response): Promise<void> => {
  const { identifier, code, deviceInfo, fullName } = req.body;

  if (!identifier || !code) {
    res.status(400).json({ error: 'INVALID_INPUT', message: 'Identifier and OTP code are required.' });
    return;
  }

  const verifyResult = OtpService.verifyOtp(identifier, code);
  if (!verifyResult.success) {
    res.status(400).json({ error: 'OTP_VERIFICATION_FAILED', message: verifyResult.message });
    return;
  }

  const cleanIdentifier = identifier.trim().toLowerCase();
  const db = getDb();
  const nowIso = new Date().toISOString();

  const isEmail = cleanIdentifier.includes('@');
  let user = db.prepare(
    isEmail ? 'SELECT * FROM users WHERE email = ?' : 'SELECT * FROM users WHERE mobile = ?'
  ).get(cleanIdentifier) as any;

  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    const userId = generateId();
    const displayName = fullName?.trim() || (isEmail ? cleanIdentifier.split('@')[0] : 'Numerology Member');

    db.prepare(`
      INSERT INTO users (id, email, mobile, full_name, role, status, is_verified, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'user', 'active', 1, ?, ?)
    `).run(
      userId,
      isEmail ? cleanIdentifier : null,
      isEmail ? null : cleanIdentifier,
      displayName,
      nowIso,
      nowIso
    );

    db.prepare(`
      INSERT INTO user_profiles (user_id, updated_at)
      VALUES (?, ?)
    `).run(userId, nowIso);

    // Auto-grant 7-day Free Starter Trial
    const freePlan = db.prepare('SELECT id, duration_days FROM subscription_plans WHERE slug = ?').get('free-starter') as { id: string; duration_days: number } | undefined;
    if (freePlan) {
      const trialEndDate = new Date(Date.now() + freePlan.duration_days * 24 * 60 * 60 * 1000).toISOString();
      db.prepare(`
        INSERT INTO user_subscriptions (id, user_id, plan_id, status, start_date, end_date, created_at, updated_at)
        VALUES (?, ?, ?, 'trial', ?, ?, ?, ?)
      `).run(generateId(), userId, freePlan.id, nowIso, trialEndDate, nowIso, nowIso);
    }

    user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  }

  // Enforce single-device session
  const session = SessionManager.createSession(user.id, deviceInfo || req.headers['user-agent'], req.ip);

  // Return user info and session token
  const sub = getUserActiveSubscription(user.id);

  res.json({
    success: true,
    message: isNewUser ? 'Welcome to Premium Numerology!' : 'Logged in successfully.',
    isNewUser,
    sessionToken: session.sessionToken,
    expiresAt: session.expiresAt,
    user: {
      id: user.id,
      email: user.email,
      mobile: user.mobile,
      fullName: user.full_name,
      role: user.role,
      status: user.status,
    },
    subscription: sub,
  });
});

/**
 * POST /api/auth/admin/login
 * Dedicated Administrator Login using email and password.
 */
authRouter.post('/admin/login', (req: Request, res: Response): Promise<void> => {
  const { email, password, deviceInfo } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'INVALID_INPUT', message: 'Email and password are required.' });
    return;
  }

  const cleanEmail = email.trim().toLowerCase();
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail) as any;

  if (!user || !user.password_hash) {
    res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid administrator email or password.' });
    return;
  }

  if (user.role !== 'super_admin' && user.role !== 'admin' && user.role !== 'support_admin') {
    res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied. Account lacks administrative privileges.' });
    return;
  }

  const isPasswordValid = verifyPassword(password, user.password_hash);
  if (!isPasswordValid) {
    res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid administrator email or password.' });
    return;
  }

  // Create single-device session
  const session = SessionManager.createSession(user.id, deviceInfo || req.headers['user-agent'], req.ip);

  // Audit log
  db.prepare(`
    INSERT INTO audit_logs (id, actor_user_id, actor_email, action, target_type, target_id, details_json, ip_address, created_at)
    VALUES (?, ?, ?, 'ADMIN_LOGIN', 'user', ?, ?, ?, ?)
  `).run(
    generateId(),
    user.id,
    user.email,
    user.id,
    JSON.stringify({ deviceInfo: deviceInfo || 'unknown' }),
    req.ip || 'unknown',
    new Date().toISOString()
  );

  res.json({
    success: true,
    message: 'Administrator authenticated successfully.',
    sessionToken: session.sessionToken,
    expiresAt: session.expiresAt,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      status: user.status,
    },
  });
});

/**
 * POST /api/auth/logout
 * Revokes current session.
 */
authRouter.post('/logout', requireAuth, (req: Request, res: Response): void => {
  if (req.session) {
    SessionManager.revokeSession(req.session.sessionToken, 'user_logged_out');
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

/**
 * GET /api/auth/me
 * Retrieves current authenticated user profile, plan, and session status.
 */
authRouter.get('/me', requireAuth, (req: Request, res: Response): void => {
  const db = getDb();
  const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(req.user!.id);
  const sub = getUserActiveSubscription(req.user!.id);

  res.json({
    user: req.user,
    profile,
    subscription: sub,
    session: {
      id: req.session!.id,
      createdAt: req.session!.createdAt,
      expiresAt: req.session!.expiresAt,
      deviceInfo: req.session!.deviceInfo,
    },
  });
});
