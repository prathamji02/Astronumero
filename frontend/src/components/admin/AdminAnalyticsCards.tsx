import React from 'react';
import { Users, CreditCard, Mail, Shield } from 'lucide-react';

interface Props {
  analytics: {
    totalUsers: number;
    activeUsers: number;
    activeSubscriptions: number;
  } | null;
  totalEmailsCount: number;
}

export const AdminAnalyticsCards: React.FC<Props> = ({ analytics, totalEmailsCount }) => {
  if (!analytics) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Users */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700/80 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 mb-2">
          <span className="text-xs sm:text-sm font-semibold">Total Users</span>
          <Users className="w-5 h-5 text-emerald-500" />
        </div>
        <div className="text-3xl font-black text-slate-900 dark:text-white">{analytics.totalUsers}</div>
        <span className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 mt-1 block font-medium">
          {analytics.activeUsers} currently active
        </span>
      </div>

      {/* Active Subscriptions */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700/80 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 mb-2">
          <span className="text-xs sm:text-sm font-semibold">Active Subscriptions</span>
          <CreditCard className="w-5 h-5 text-amber-500" />
        </div>
        <div className="text-3xl font-black text-slate-900 dark:text-white">{analytics.activeSubscriptions}</div>
        <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 block">Live paid &amp; trial plans</span>
      </div>

      {/* Dispatched Communications */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700/80 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 mb-2">
          <span className="text-xs sm:text-sm font-semibold">Emails Dispatched</span>
          <Mail className="w-5 h-5 text-sky-500" />
        </div>
        <div className="text-3xl font-black text-slate-900 dark:text-white">{totalEmailsCount}</div>
        <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 block">Welcome, OTP &amp; Custom</span>
      </div>

      {/* Security */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700/80 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 mb-2">
          <span className="text-xs sm:text-sm font-semibold">System Security</span>
          <Shield className="w-5 h-5 text-purple-500" />
        </div>
        <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Single-Device Active</div>
        <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 block">30-day strict expiry</span>
      </div>
    </div>
  );
};
