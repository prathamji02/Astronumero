import React from 'react';
import type { User } from '../../types/index.ts';
import { User as UserIcon, Save } from 'lucide-react';

interface Props {
  user: User;
  fullName: string;
  setFullName: (val: string) => void;
  timezone: string;
  setTimezone: (val: string) => void;
  language: string;
  setLanguage: (val: string) => void;
  onSavePersonal: (e: React.FormEvent) => void;
  savingPersonal: boolean;
}

export const ProfilePersonalInfoCard: React.FC<Props> = ({
  user,
  fullName,
  setFullName,
  timezone,
  setTimezone,
  language,
  setLanguage,
  onSavePersonal,
  savingPersonal,
}) => {
  return (
    <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700/80 rounded-2xl p-6 sm:p-7 shadow-sm dark:shadow-xl flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100 dark:border-navy-800">
          <UserIcon className="w-5 h-5 text-emerald-500" />
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Personal Information</h2>
        </div>

        <form onSubmit={onSavePersonal} className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-navy-700 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm focus:border-emerald-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
            <input
              type="text"
              disabled
              value={user.email || 'None registered'}
              className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-navy-950/60 border border-slate-200 dark:border-navy-800 rounded-xl text-slate-500 dark:text-slate-400 text-xs sm:text-sm cursor-not-allowed"
            />
            <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">Verified primary contact.</span>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Mobile Number</label>
            <input
              type="text"
              disabled
              value={user.mobile || 'None registered'}
              className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-navy-950/60 border border-slate-200 dark:border-navy-800 rounded-xl text-slate-500 dark:text-slate-400 text-xs sm:text-sm cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Timezone</label>
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-navy-700 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Language</label>
              <input
                type="text"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-navy-700 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingPersonal}
            className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition shadow-sm"
          >
            <Save className="w-4 h-4" />
            {savingPersonal ? 'Saving...' : 'Save Profile Details'}
          </button>
        </form>
      </div>
    </div>
  );
};
