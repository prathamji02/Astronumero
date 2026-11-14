import React, { useState } from 'react';
import { apiRequest } from '../services/api.ts';
import type { CalculatedData, UserSubscription } from '../types/index.ts';
import { Sparkles, Clock, MapPin, Bookmark, ArrowRight } from 'lucide-react';

interface Props {
  onCalculated: (data: CalculatedData) => void;
  subscription: UserSubscription | null;
  onOpenAuth: () => void;
  isLoggedIn: boolean;
}

// Automatically gets today's date (YYYY-MM-DD)
const getTodayDate = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const NewChartForm: React.FC<Props> = ({
  onCalculated,
  subscription,
  onOpenAuth,
  isLoggedIn,
}) => {
  const [fullName, setFullName] = useState('Pratham Master');
  const [dateOfBirth, setDateOfBirth] = useState('1994-08-13');
  const [timeOfBirth, setTimeOfBirth] = useState('14:30');
  const [placeOfBirth, setPlaceOfBirth] = useState('New Delhi, India');
  // Default to today's date dynamically (e.g. 2026-11-14)
  const [targetDate, setTargetDate] = useState(getTodayDate());

  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !dateOfBirth) {
      setError('Please provide full name and date of birth.');
      return;
    }

    setLoading(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const res = await apiRequest<{ success: boolean; data: CalculatedData }>('/numerology/calculate', {
        method: 'POST',
        body: JSON.stringify({
          fullName: fullName.trim(),
          dateOfBirth,
          timeOfBirth: timeOfBirth || undefined,
          placeOfBirth: placeOfBirth || undefined,
          targetDate: targetDate || getTodayDate(),
        }),
      });

      onCalculated(res.data);
    } catch (err: any) {
      setError(err.message || 'Calculation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToRepository = async () => {
    if (!isLoggedIn) {
      onOpenAuth();
      return;
    }

    try {
      await apiRequest('/charts', {
        method: 'POST',
        body: JSON.stringify({
          personName: fullName.trim(),
          dateOfBirth,
          timeOfBirth: timeOfBirth || undefined,
          placeOfBirth: placeOfBirth || undefined,
        }),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to save chart.');
    }
  };

  return (
    <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-6 sm:p-8 shadow-sm max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pb-4 border-b border-slate-200 dark:border-navy-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Calculate Numerology Chart
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Enter birth details to generate Natal, Mahadasha, Personal Year, Monthly Pratyantar, and Daily Grid.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setFullName('Pratham Master');
            setDateOfBirth('1994-08-13');
            setTargetDate(getTodayDate());
          }}
          className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:border-emerald-500 transition"
        >
          Baseline DOB (13/08/1994)
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
          {error}
        </div>
      )}

      {saveSuccess && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs">
          ✓ Chart successfully saved to your repository!
        </div>
      )}

      <form onSubmit={handleCalculate} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Pratham Master"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-navy-700 rounded-xl text-slate-900 dark:text-white text-xs focus:border-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Date of Birth <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-navy-700 rounded-xl text-slate-900 dark:text-white text-xs focus:border-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Time of Birth (Optional)
            </label>
            <div className="relative">
              <input
                type="time"
                value={timeOfBirth}
                onChange={(e) => setTimeOfBirth(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-navy-700 rounded-xl text-slate-900 dark:text-white text-xs focus:border-emerald-500 outline-none"
              />
              <Clock className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Place of Birth (Optional)
            </label>
            <div className="relative">
              <input
                type="text"
                value={placeOfBirth}
                onChange={(e) => setPlaceOfBirth(e.target.value)}
                placeholder="e.g. New Delhi, India"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-navy-700 rounded-xl text-slate-900 dark:text-white text-xs focus:border-emerald-500 outline-none"
              />
              <MapPin className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Target Analysis Date (Defaults to Today: 2026-11-14) */}
        <div className="pt-3 border-t border-slate-200 dark:border-navy-800">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 mb-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Target Analysis Date (Active Mahadasha, Personal Year & Daily Grid)
            </label>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              Defaults to current day ({getTodayDate()})
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-navy-700 rounded-xl text-slate-900 dark:text-white text-xs focus:border-emerald-500 outline-none font-mono"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
              >
                {loading ? 'Calculating...' : 'Calculate'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleSaveToRepository}
                className="px-3.5 py-2 bg-slate-100 dark:bg-navy-950 border border-slate-300 dark:border-navy-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl hover:border-slate-400 transition flex items-center gap-1"
                title="Save chart"
              >
                <Bookmark className="w-3.5 h-3.5 text-gold-500" />
                Save
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
