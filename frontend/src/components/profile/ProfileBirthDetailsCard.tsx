import React from 'react';
import type { UserProfile } from '../../types/index.ts';
import { Calendar, Clock, MapPin, Save } from 'lucide-react';

interface Props {
  profile: UserProfile | null;
  dob: string;
  setDob: (val: string) => void;
  tob: string;
  setTob: (val: string) => void;
  pob: string;
  setPob: (val: string) => void;
  onSaveBirth: (e: React.FormEvent) => void;
  savingBirth: boolean;
}

export const ProfileBirthDetailsCard: React.FC<Props> = ({
  profile,
  dob,
  setDob,
  tob,
  setTob,
  pob,
  setPob,
  onSaveBirth,
  savingBirth,
}) => {
  return (
    <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700/80 rounded-2xl p-6 sm:p-7 shadow-sm dark:shadow-xl flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100 dark:border-navy-800">
          <Calendar className="w-5 h-5 text-amber-500 dark:text-gold-400" />
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Birth & Numerology</h2>
        </div>

        {profile && profile.basic_number && profile.destiny_number && (
          <div className="grid grid-cols-2 gap-3 mb-5 p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-center">
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900">
              <span className="text-[11px] uppercase font-bold text-rose-600 dark:text-rose-400 block">Basic (Mulank)</span>
              <span className="text-3xl font-black text-slate-900 dark:text-white">{profile.basic_number}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900">
              <span className="text-[11px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">Destiny (Bhagyank)</span>
              <span className="text-3xl font-black text-slate-900 dark:text-white">{profile.destiny_number}</span>
            </div>
          </div>
        )}

        <form onSubmit={onSaveBirth} className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Date of Birth <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-navy-700 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm focus:border-amber-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Time of Birth (Optional)</label>
            <div className="relative">
              <input
                type="time"
                value={tob}
                onChange={(e) => setTob(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-navy-700 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm outline-none"
              />
              <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute right-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Place of Birth (Optional)</label>
            <div className="relative">
              <input
                type="text"
                value={pob}
                onChange={(e) => setPob(e.target.value)}
                placeholder="e.g. New Delhi, India"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-navy-700 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm outline-none"
              />
              <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute right-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-navy-950 p-3 rounded-xl border border-slate-200 dark:border-navy-800 leading-relaxed">
            💡 Updating your birth date recalculates your personal profile numbers. Historical saved charts are securely preserved.
          </div>

          <button
            type="submit"
            disabled={savingBirth}
            className="w-full mt-2 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition shadow-sm"
          >
            <Save className="w-4 h-4" />
            {savingBirth ? 'Calculating...' : 'Update & Recalculate'}
          </button>
        </form>
      </div>
    </div>
  );
};
