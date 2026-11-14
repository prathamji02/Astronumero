import { Router } from 'express';
import type { Request, Response } from 'express';
import { getDb } from '../../database/connection.ts';
import { requireAuth } from '../../middleware/auth.ts';
import { getUserActiveSubscription } from '../../middleware/entitlements.ts';
import { generateId } from '../../utils/security.ts';

export const subscriptionRouter = Router();

/**
 * GET /api/subscriptions/plans
 * Returns all active subscription plans.
 */
subscriptionRouter.get('/plans', (_req: Request, res: Response): void => {
  const db = getDb();
  const plans = db.prepare(`
    SELECT id, slug, name, description, price, currency, duration_days, tier_level,
           max_saved_charts, allow_comparison, allow_100_year_timeline, allow_export, is_active, display_order
    FROM subscription_plans
    WHERE is_active = 1
    ORDER BY display_order ASC
  `).all();

  res.json({ plans });
});

/**
 * GET /api/subscriptions/my-plan
 * Returns the current authenticated user's active plan and entitlement details.
 */
subscriptionRouter.get('/my-plan', requireAuth, (req: Request, res: Response): void => {
  const sub = getUserActiveSubscription(req.user!.id);
  res.json({ subscription: sub });
});

/**
 * POST /api/subscriptions/upgrade
 * Simulates subscription plan upgrade / checkout with idempotent backend activation.
 */
subscriptionRouter.post('/upgrade', requireAuth, (req: Request, res: Response): void => {
  const { planSlug } = req.body;
  if (!planSlug) {
    res.status(400).json({ error: 'INVALID_INPUT', message: 'planSlug is required.' });
    return;
  }

  const db = getDb();
  const plan = db.prepare('SELECT * FROM subscription_plans WHERE slug = ? AND is_active = 1').get(planSlug) as any;
  if (!plan) {
    res.status(404).json({ error: 'NOT_FOUND', message: `Plan "${planSlug}" not found.` });
    return;
  }

  const userId = req.user!.id;
  const now = new Date();
  const nowIso = now.toISOString();
  const endDate = new Date(now.getTime() + plan.duration_days * 24 * 60 * 60 * 1000).toISOString();
  const paymentReference = `SIM_PAY_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  // Expire any existing active subscriptions
  db.prepare(`
    UPDATE user_subscriptions
    SET status = 'expired', updated_at = ?
    WHERE user_id = ? AND status IN ('active', 'trial')
  `).run(nowIso, userId);

  // Insert new active subscription
  const newSubId = generateId();
  db.prepare(`
    INSERT INTO user_subscriptions (
      id, user_id, plan_id, status, start_date, end_date, auto_renew, payment_reference, created_at, updated_at
    ) VALUES (?, ?, ?, 'active', ?, ?, 1, ?, ?, ?)
  `).run(newSubId, userId, plan.id, nowIso, endDate, paymentReference, nowIso, nowIso);

  // Log action
  db.prepare(`
    INSERT INTO audit_logs (id, actor_user_id, actor_email, action, target_type, target_id, details_json, created_at)
    VALUES (?, ?, ?, 'UPGRADE_SUBSCRIPTION', 'user_subscription', ?, ?, ?)
  `).run(
    generateId(),
    userId,
    req.user!.email,
    newSubId,
    JSON.stringify({ planSlug, price: plan.price, currency: plan.currency, paymentReference }),
    nowIso
  );

  const updatedSub = getUserActiveSubscription(userId);

  res.json({
    success: true,
    message: `Successfully upgraded to ${plan.name}!`,
    subscription: updatedSub,
  });
});

/**
 * POST /api/subscriptions/cancel
 * Cancels auto-renewal of active subscription.
 */
subscriptionRouter.post('/cancel', requireAuth, (req: Request, res: Response): void => {
  const db = getDb();
  const userId = req.user!.id;
  const nowIso = new Date().toISOString();

  const result = db.prepare(`
    UPDATE user_subscriptions
    SET auto_renew = 0, status = 'cancelled', updated_at = ?
    WHERE user_id = ? AND status = 'active'
  `).run(nowIso, userId);

  if ((result.changes ?? 0) === 0) {
    res.status(400).json({ error: 'NO_ACTIVE_SUBSCRIPTION', message: 'No active subscription found to cancel.' });
    return;
  }

  res.json({
    success: true,
    message: 'Your subscription auto-renewal has been cancelled. Your benefits remain active until the end of your current billing period.',
  });
});
