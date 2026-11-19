import { Router } from 'express';
import type { Request, Response } from 'express';
import { getDb } from '../../database/connection.ts';
import { requireAuth, requireRoles } from '../../middleware/auth.ts';
import { adminUsersRouter } from './adminUsersRouter.ts';
import { adminCommsRouter } from './adminCommsRouter.ts';

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

// Modular sub-routers
adminRouter.use('/users', adminUsersRouter);
adminRouter.use('/', adminCommsRouter);
