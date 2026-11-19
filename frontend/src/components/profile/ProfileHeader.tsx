import React from 'react';
import type { User } from '../../types/index.ts';
import { ShieldCheck } from 'lucide-react';

interface Props {
  user: User;
}

export const ProfileHeader: React.FC<Props> = ({ user }) => {
  return (
    <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700/80 rounded-3xl p-6 sm:p-8 shadow-sm dark:shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div className="flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-md shadow-emerald-500/20">
          <div className="w-full h-full bg-slate-100 dark:bg-navy-950 rounded-[14px] flex items-center justify-center text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {user.fullName.charAt(0).toUpperCase()}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {user.fullName}
            </h1>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5" />
              {user.role === 'super_admin' ? 'Super Administrator' : 'Verified Member'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Account ID: <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{user.id}</span>
          </p>
        </div>
      </div>

      {/* Plan Pill */}
      <div className="bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-2xl p-4 sm:p-5 flex items-center gap-4">
        <div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider block">
            Membership Status
          </span>
          <span className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">
            Full Access Unlocked
          </span>
        </div>
      </div>
    </div>
  );
};
