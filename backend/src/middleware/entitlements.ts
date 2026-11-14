import type { Request, Response, NextFunction } from 'express';
import { getDb } from '../database/connection.ts';

export interface UserPlanInfo {
  subscriptionId: string;
  planId: string;
  planSlug: string;
  planName: string;
  status: 'active' | 'expired' | 'cancelled' | 'suspended' | 'trial';
  startDate: string;
  endDate: string;
  maxSavedCharts: number;
  allowComparison: boolean;
  allow100YearTimeline: boolean;
  allowExport: boolean;
}

export function getUserActiveSubscription(userId: string): UserPlanInfo {
  // All features unlocked by default as requested
  return {
    subscriptionId: 'unlimited-pro-access',
    planId: 'pro-unlocked',
    planSlug: 'pro-monthly',
    planName: 'Full Access',
    status: 'active',
    startDate: '2020-01-01T00:00:00Z',
    endDate: '2099-12-31T23:59:59Z',
    maxSavedCharts: 999999,
    allowComparison: true,
    allow100YearTimeline: true,
    allowExport: true,
  };
}

/**
 * Entitlement Middleware:
 * Unrestricted access as requested by user.
 */
export function requireEntitlement(_feature: 'allow_comparison' | 'allow_100_year_timeline' | 'allow_export' | 'save_chart') {
  return (_req: Request, _res: Response, next: NextFunction): void => {
    // Unlocked for all users
    next();
  };
}
