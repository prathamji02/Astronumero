import React from 'react';
import type { UserSubscription } from '../../types/index.ts';
import { CreditCard, CheckCircle } from 'lucide-react';

interface Props {
  subscription: UserSubscription | null;
  formatDate: (dateStr: string) => string;
}

export const ProfileSubscriptionCard: React.FC<Props> = ({
  subscription,
  formatDate,
}) => {
  return (
    <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700/80 rounded-2xl p-6 sm:p-7 shadow-sm dark:shadow-xl flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100 dark:border-navy-800">
          <CreditCard className="w-5 h-5 text-emerald-500" />
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Subscription & Plan</h2>
        </div>

        {subscription ? (
          <div className="space-y-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-emerald-500/30">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Plan Name</span>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-0.5">{subscription.planName}</h3>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                  {subscription.status}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-navy-800 space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                <div className="flex justify-between">
                  <span>Start Date:</span>
                  <span className="font-mono text-slate-900 dark:text-white">{formatDate(subscription.startDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Expiry Date:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{formatDate(subscription.endDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Saved Charts Limit:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{subscription.maxSavedCharts}</span>
                </div>
              </div>
            </div>

            {/* Feature entitlement checks */}
            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <CheckCircle className={`w-4 h-4 ${subscription.allow100YearTimeline ? 'text-emerald-500' : 'text-slate-400'}`} />
                <span>100-Year Timeline Calculations</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <CheckCircle className={`w-4 h-4 ${subscription.allowComparison ? 'text-emerald-500' : 'text-slate-400'}`} />
                <span>Chart Comparison Engine</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <CheckCircle className={`w-4 h-4 ${subscription.allowExport ? 'text-emerald-500' : 'text-slate-400'}`} />
                <span>High-Resolution Chart Export</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-400 font-bold text-xs sm:text-sm">
              Full Access Active
            </span>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-3">All numerology features are fully unlocked.</p>
          </div>
        )}
      </div>
    </div>
  );
};
