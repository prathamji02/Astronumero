import { Router } from 'express';
import type { Request, Response } from 'express';
import { getDb } from '../../database/connection.ts';
import { requireAuth, requireRoles } from '../../middleware/auth.ts';
import { SessionManager } from '../auth/sessionManager.ts';
import { generateId, hashPassword } from '../../utils/security.ts';

export const adminRouter = Router();

// Protect all admin endpoints with Super Admin, Admin, or Support Admin role
adminRouter.use(requireAuth, requireRoles('super_admin', 'admin', 'support_admin'));

/**
 * GET /api/admin/analytics
 * Overall system metrics.
 */
adminRouter.get('/analytics', (_req: Request, res: Response): void => {
  const db = getDb();

  const totalUsers = (db.prepare('SELECT COUNT(*) as count FROM users WHERE role = "user"').get() as any).count;
  const activeUsers = (db.prepare('SELECT COUNT(*) as count FROM users WHERE role = "user" AND status = "active"').get() as any).count;
  const activeSubscriptions = (db.prepare('SELECT COUNT(*) as count FROM user_subscriptions WHERE status IN ("active", "trial")').get() as any).count;
  const totalSavedCharts = (db.prepare('SELECT COUNT(*) as count FROM saved_charts').get() as any).count;

  // Plan distribution
  const planDistribution = db.prepare(`
    SELECT sp.name, sp.slug, COUNT(us.id) as subscriber_count
    FROM subscription_plans sp
    LEFT JOIN user_subscriptions us ON sp.id = us.plan_id AND us.status IN ('active', 'trial')
    GROUP BY sp.id
    ORDER BY sp.tier_level ASC
  `).all();

  // Recent registrations
  const recentUsers = db.prepare(`
    SELECT id, email, mobile, full_name, status, role, created_at
    FROM users
    ORDER BY created_at DESC
    LIMIT 10
  `).all();

  res.json({
    analytics: {
      totalUsers,
      activeUsers,
      activeSubscriptions,
      totalSavedCharts,
      planDistribution,
    },
    recentUsers,
  });
});

/**
 * GET /api/admin/users
 * Lists users with search and filter support.
 */
adminRouter.get('/users', (req: Request, res: Response): void => {
  const db = getDb();
  const search = req.query.search as string | undefined;
  const status = req.query.status as string | undefined;

  let query = `
    SELECT u.id, u.email, u.mobile, u.full_name, u.role, u.status, u.is_verified, u.created_at,
           up.date_of_birth, up.basic_number, up.destiny_number,
           (SELECT COUNT(*) FROM saved_charts WHERE user_id = u.id) as saved_charts_count,
           (SELECT COUNT(*) FROM auth_sessions WHERE user_id = u.id AND is_active = 1) as active_sessions_count,
           sp.name as current_plan_name, us.status as subscription_status, us.end_date as subscription_end_date
    FROM users u
    LEFT JOIN user_profiles up ON u.id = up.user_id
    LEFT JOIN user_subscriptions us ON u.id = us.user_id AND us.status IN ('active', 'trial')
    LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (search && search.trim()) {
    query += ' AND (u.full_name LIKE ? OR u.email LIKE ? OR u.mobile LIKE ?)';
    const term = `%${search.trim()}%`;
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
 * POST /api/admin/users/:id/status
 * Suspends, activates, or deactivates a user.
 */
adminRouter.post('/users/:id/status', requireRoles('super_admin', 'admin'), (req: Request, res: Response): void => {
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
adminRouter.post('/users/:id/revoke-sessions', requireRoles('super_admin', 'admin'), (req: Request, res: Response): void => {
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
adminRouter.post('/users/:id/assign-subscription', requireRoles('super_admin', 'admin'), (req: Request, res: Response): void => {
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

/**
 * GET /api/admin/audit-logs
 * Retrieves paginated audit logs.
 */
adminRouter.get('/audit-logs', (req: Request, res: Response): void => {
  const db = getDb();
  const limit = Math.min(parseInt((req.query.limit as string) || '50', 10), 100);

  const logs = db.prepare(`
    SELECT id, actor_user_id, actor_email, action, target_type, target_id, details_json, ip_address, created_at
    FROM audit_logs
    ORDER BY created_at DESC
    LIMIT ?
  `).all(limit);

  res.json({ logs });
});
