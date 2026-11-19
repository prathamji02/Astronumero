import { Router } from 'express';
import type { Request, Response } from 'express';
import { getDb } from '../../database/connection.ts';
import { requireRoles } from '../../middleware/auth.ts';
import { SessionManager } from '../auth/sessionManager.ts';
import { generateId } from '../../utils/security.ts';
import { EmailService } from '../../services/emailService.ts';
import { formatToDDMMYYYY } from '../../../../shared/src/index.ts';

export const adminUsersRouter = Router();

/**
 * GET /api/admin/users
 * Lists users with search and filter support.
 */
adminUsersRouter.get('/', (req: Request, res: Response): void => {
  const db = getDb();
  const search = req.query.search as string | undefined;
  const status = req.query.status as string | undefined;

  let query = `
    SELECT u.id, u.email, u.mobile, u.full_name, u.role, u.status, u.is_verified, u.created_at,
           up.date_of_birth, up.basic_number, up.destiny_number,
           (SELECT COUNT(*) FROM saved_charts WHERE user_id = u.id) as saved_charts_count,
           (SELECT COUNT(*) FROM auth_sessions WHERE user_id = u.id AND is_active = 1) as active_sessions_count,
           (
             SELECT sp.name 
             FROM user_subscriptions us 
             JOIN subscription_plans sp ON us.plan_id = sp.id 
             WHERE us.user_id = u.id AND us.status IN ('active', 'trial') 
             ORDER BY us.created_at DESC 
             LIMIT 1
           ) as current_plan_name,
           (
             SELECT us.status 
             FROM user_subscriptions us 
             WHERE us.user_id = u.id AND us.status IN ('active', 'trial') 
             ORDER BY us.created_at DESC 
             LIMIT 1
           ) as subscription_status,
           (
             SELECT us.end_date 
             FROM user_subscriptions us 
             WHERE us.user_id = u.id AND us.status IN ('active', 'trial') 
             ORDER BY us.created_at DESC 
             LIMIT 1
           ) as subscription_end_date
    FROM users u
    LEFT JOIN user_profiles up ON u.id = up.user_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (search && search.trim()) {
    query += ' AND (LOWER(u.full_name) LIKE ? OR LOWER(u.email) LIKE ? OR u.mobile LIKE ?)';
    const term = `%${search.trim().toLowerCase()}%`;
    params.push(term, term, term);
  }

  if (status && status !== 'all') {
    query += ' AND u.status = ?';
    params.push(status);
  }

  query += ' ORDER BY u.created_at DESC';

  const users = db.prepare(query).all(...params);
  res.json({ users });
});

/**
 * POST /api/admin/users/create
 * Registers a new paid client account directly from the Admin Panel.
 * If user is already registered, returns an explicit USER_EXISTS error.
 */
adminUsersRouter.post('/create', requireRoles('super_admin', 'admin'), (req: Request, res: Response): void => {
  const { fullName, email, mobile, planSlug = 'pro-monthly', durationDays = 30, paymentNote } = req.body;

  if (!fullName || !fullName.trim()) {
    res.status(400).json({ error: 'INVALID_INPUT', message: 'Full name is required.' });
    return;
  }

  if (!email || !email.trim()) {
    res.status(400).json({ error: 'INVALID_INPUT', message: 'Email address is required.' });
    return;
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanMobile = mobile?.trim() || null;
  const cleanName = fullName.trim();
  const db = getDb();

  // Check if user already exists
  const existing = db.prepare('SELECT id, email, full_name, mobile FROM users WHERE email = ?').get(cleanEmail) as any;

  if (existing) {
    res.status(400).json({
      error: 'USER_EXISTS',
      message: `A user with email "${cleanEmail}" is already registered (${existing.full_name}). They are already present in User Accounts Management.`,
      userId: existing.id,
    });
    return;
  }

  const plan = db.prepare('SELECT * FROM subscription_plans WHERE slug = ?').get(planSlug) as any;
  if (!plan) {
    res.status(400).json({ error: 'INVALID_PLAN', message: `Invalid plan slug: "${planSlug}".` });
    return;
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const days = parseInt(String(durationDays), 10) || plan.duration_days;
  const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

  const userId = generateId();

  // Insert user
  db.prepare(`
    INSERT INTO users (id, email, mobile, full_name, role, status, is_verified, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'user', 'active', 1, ?, ?)
  `).run(userId, cleanEmail, cleanMobile, cleanName, nowIso, nowIso);

  // Insert profile
  db.prepare(`
    INSERT INTO user_profiles (user_id, updated_at)
    VALUES (?, ?)
  `).run(userId, nowIso);

  // Insert active subscription
  const subId = generateId();
  db.prepare(`
    INSERT INTO user_subscriptions (
      id, user_id, plan_id, status, start_date, end_date, auto_renew, payment_reference, created_at, updated_at
    ) VALUES (?, ?, ?, 'active', ?, ?, 0, ?, ?, ?)
  `).run(
    subId,
    userId,
    plan.id,
    nowIso,
    endDate,
    paymentNote ? `DIRECT_PAYMENT: ${paymentNote}` : 'DIRECT_PAYMENT_ADMIN_REGISTERED',
    nowIso,
    nowIso
  );

  // Audit log
  db.prepare(`
    INSERT INTO audit_logs (id, actor_user_id, actor_email, action, target_type, target_id, details_json, created_at)
    VALUES (?, ?, ?, 'ADMIN_REGISTER_PAID_USER', 'user', ?, ?, ?)
  `).run(
    generateId(),
    req.user!.id,
    req.user!.email,
    userId,
    JSON.stringify({
      email: cleanEmail,
      fullName: cleanName,
      plan: plan.name,
      planSlug,
      durationDays: days,
      paymentNote: paymentNote || 'Direct payment',
    }),
    nowIso
  );

  // Send automated welcome email to client
  const expiryFormatted = formatToDDMMYYYY(endDate);
  EmailService.sendWelcomeEmail(cleanEmail, cleanName, plan.name, expiryFormatted).catch((err) => {
    console.error('[EMAIL ERROR] Failed to send welcome email:', err);
  });

  res.json({
    success: true,
    message: `User ${cleanName} (${cleanEmail}) registered with ${plan.name} (${days} days) successfully!`,
    user: {
      id: userId,
      email: cleanEmail,
      mobile: cleanMobile,
      fullName: cleanName,
      planName: plan.name,
      endDate,
    },
  });
});

/**
 * POST /api/admin/users/:id/status
 * Suspends, activates, or deactivates a user.
 */
adminUsersRouter.post('/:id/status', requireRoles('super_admin', 'admin'), (req: Request, res: Response): void => {
  const { status, reason } = req.body;
  const targetUserId = req.params.id;

  if (!['active', 'suspended', 'deactivated'].includes(status)) {
    res.status(400).json({ error: 'INVALID_INPUT', message: 'Status must be active, suspended, or deactivated.' });
    return;
  }

  const db = getDb();
  const targetUser = db.prepare('SELECT id, email, role FROM users WHERE id = ?').get(targetUserId) as any;
  if (!targetUser) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'User not found.' });
    return;
  }

  // Prevent modifying Super Admin status
  if (targetUser.role === 'super_admin' && req.user!.role !== 'super_admin') {
    res.status(403).json({ error: 'FORBIDDEN', message: 'Cannot modify Super Admin account.' });
    return;
  }

  const nowIso = new Date().toISOString();
  db.prepare('UPDATE users SET status = ?, updated_at = ? WHERE id = ?').run(status, nowIso, targetUserId);

  // If suspended or deactivated, revoke all active sessions immediately
  if (status !== 'active') {
    SessionManager.revokeAllUserSessions(targetUserId, `account_${status}`);
  }

  // Audit log
  db.prepare(`
    INSERT INTO audit_logs (id, actor_user_id, actor_email, action, target_type, target_id, details_json, created_at)
    VALUES (?, ?, ?, 'CHANGE_USER_STATUS', 'user', ?, ?, ?)
  `).run(
    generateId(),
    req.user!.id,
    req.user!.email,
    targetUserId,
    JSON.stringify({ status, reason: reason || 'Admin action' }),
    nowIso
  );

  res.json({ success: true, message: `User status changed to ${status}.` });
});

/**
 * POST /api/admin/users/:id/revoke-sessions
 * Terminates all active sessions for a user (single-device administrative control).
 */
adminUsersRouter.post('/:id/revoke-sessions', requireRoles('super_admin', 'admin'), (req: Request, res: Response): void => {
  const targetUserId = req.params.id;
  const revokedCount = SessionManager.revokeAllUserSessions(targetUserId, 'admin_force_logout');

  const db = getDb();
  db.prepare(`
    INSERT INTO audit_logs (id, actor_user_id, actor_email, action, target_type, target_id, details_json, created_at)
    VALUES (?, ?, ?, 'REVOKE_USER_SESSIONS', 'user', ?, ?, ?)
  `).run(
    generateId(),
    req.user!.id,
    req.user!.email,
    targetUserId,
    JSON.stringify({ revokedSessions: revokedCount }),
    new Date().toISOString()
  );

  res.json({
    success: true,
    message: `Revoked ${revokedCount} active session(s) for user.`,
    revokedCount,
  });
});

/**
 * POST /api/admin/users/:id/assign-subscription
 * Assigns a complimentary or custom duration subscription plan.
 */
adminUsersRouter.post('/:id/assign-subscription', requireRoles('super_admin', 'admin'), (req: Request, res: Response): void => {
  const { planSlug, durationDays, reason } = req.body;
  const targetUserId = req.params.id;

  const db = getDb();
  const plan = db.prepare('SELECT * FROM subscription_plans WHERE slug = ?').get(planSlug) as any;
  if (!plan) {
    res.status(404).json({ error: 'NOT_FOUND', message: `Plan "${planSlug}" not found.` });
    return;
  }

  const daysToAssign = durationDays ? parseInt(String(durationDays), 10) : plan.duration_days;
  const now = new Date();
  const nowIso = now.toISOString();
  const endDate = new Date(now.getTime() + daysToAssign * 24 * 60 * 60 * 1000).toISOString();

  // Expire existing
  db.prepare(`
    UPDATE user_subscriptions SET status = 'expired', updated_at = ?
    WHERE user_id = ? AND status IN ('active', 'trial')
  `).run(nowIso, targetUserId);

  const subId = generateId();
  db.prepare(`
    INSERT INTO user_subscriptions (
      id, user_id, plan_id, status, start_date, end_date, auto_renew, payment_reference, created_at, updated_at
    ) VALUES (?, ?, ?, 'active', ?, ?, 0, 'COMPLIMENTARY_ADMIN_ASSIGNMENT', ?, ?)
  `).run(subId, targetUserId, plan.id, nowIso, endDate, nowIso, nowIso);

  // Audit log
  db.prepare(`
    INSERT INTO audit_logs (id, actor_user_id, actor_email, action, target_type, target_id, details_json, created_at)
    VALUES (?, ?, ?, 'ASSIGN_SUBSCRIPTION', 'user_subscription', ?, ?, ?)
  `).run(
    generateId(),
    req.user!.id,
    req.user!.email,
    subId,
    JSON.stringify({ planSlug, daysToAssign, reason: reason || 'Complimentary' }),
    nowIso
  );

  res.json({
    success: true,
    message: `Assigned ${plan.name} (${daysToAssign} days) to user successfully.`,
  });
});
