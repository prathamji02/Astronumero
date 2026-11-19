import React from 'react';
import { Smartphone, Bookmark } from 'lucide-react';

interface Props {
  activeSession: any;
  chartStats: { total_saved_charts: number } | null;
  recentCharts: any[];
  formatDate: (dateStr: string) => string;
}

export const ProfileDeviceAndActivityCards: React.FC<Props> = ({
  activeSession,
  chartStats,
  recentCharts,
  formatDate,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Active Session & Device Card (Section 4.2 Single-Device) */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700/80 rounded-2xl p-6 sm:p-7 shadow-sm dark:shadow-xl">
        <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100 dark:border-navy-800">
          <Smartphone className="w-5 h-5 text-emerald-500" />
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Active Device Session</h2>
        </div>

        {activeSession ? (
          <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            <div className="flex justify-between items-center p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800">
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block">Current Device</span>
                <span className="text-slate-500 dark:text-slate-400 text-xs font-mono truncate max-w-xs block mt-0.5">
                  {activeSession.deviceInfo || 'Standard Web Browser'}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                Active
              </span>
            </div>

            <div className="space-y-2 px-1">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Session Created:</span>
                <span className="font-mono text-slate-900 dark:text-slate-200">{formatDate(activeSession.createdAt)}</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>30-Day Expiry Date:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{formatDate(activeSession.expiresAt)}</span>
              </div>
            </div>

            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 italic bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200 dark:border-amber-900 leading-relaxed">
              Only one authenticated device is permitted simultaneously. Signing in on another mobile or laptop will terminate this session automatically.
            </p>
          </div>
        ) : (
          <p className="text-xs sm:text-sm text-slate-400">Session information loading...</p>
        )}
      </div>

      {/* Saved Charts & Activity Overview (Section 6.4) */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700/80 rounded-2xl p-6 sm:p-7 shadow-sm dark:shadow-xl">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100 dark:border-navy-800">
          <div className="flex items-center gap-2.5">
            <Bookmark className="w-5 h-5 text-amber-500 dark:text-gold-400" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">My Charts & Activity</h2>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-navy-700">
            {chartStats ? `${chartStats.total_saved_charts} Saved` : '0 Saved'}
          </span>
        </div>

        {recentCharts.length > 0 ? (
          <div className="space-y-2.5">
            {recentCharts.map((chart) => (
              <div
                key={chart.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs sm:text-sm"
              >
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white block">{chart.person_name}</span>
                  <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-mono">DOB: {formatDate(chart.date_of_birth)}</span>
                </div>
                <span className="text-[11px] sm:text-xs text-slate-500 font-mono">
                  {formatDate(chart.created_at)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            No saved charts found yet. Generate a chart and click "Save Chart" to store it in your repository.
          </div>
        )}
      </div>
    </div>
  );
};
