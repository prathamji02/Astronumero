import React from 'react';
import type { CalculatedData } from '../../types/index.ts';
import { Bookmark, Printer } from 'lucide-react';

interface Props {
  calculatedData: CalculatedData;
  onNewPerson: () => void;
  onSaveChart: () => void;
  isSavingChart: boolean;
  chartSavedStatus: boolean;
  onPrint: () => void;
  formatDate: (str: string) => string;
}

export const SaveChartActionBar: React.FC<Props> = ({
  calculatedData,
  onNewPerson,
  onSaveChart,
  isSavingChart,
  chartSavedStatus,
  onPrint,
  formatDate,
}) => {
  return (
    <div className="space-y-4">
      {/* Header with Save Chart Button */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            {calculatedData.birthInput.fullName}
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
            Birth Date: <strong className="font-mono text-slate-800 dark:text-slate-200">{formatDate(calculatedData.birthInput.dateOfBirth)}</strong> | Analysis Date: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{formatDate(calculatedData.targetDate)}</strong>
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onNewPerson}
            className="px-4 py-2.5 bg-slate-100 dark:bg-navy-950 border border-slate-300 dark:border-navy-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs sm:text-sm font-semibold rounded-xl transition shadow-sm"
            aria-label="Create new chart for another person"
          >
            + New Person
          </button>

          <button
            onClick={onSaveChart}
            disabled={isSavingChart}
            className={`px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 shadow-sm ${
              chartSavedStatus
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/20'
            }`}
            aria-label="Save this chart to your account"
          >
            <Bookmark className="w-4 h-4" />
            {chartSavedStatus ? 'Chart Saved ✓' : isSavingChart ? 'Saving...' : 'Save Chart'}
          </button>

          <button
            onClick={onPrint}
            className="px-4 py-2.5 bg-slate-100 dark:bg-navy-950 border border-slate-300 dark:border-navy-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs sm:text-sm font-medium rounded-xl transition flex items-center gap-2 shadow-sm"
            title="Print / Save PDF"
            aria-label="Print or Save PDF"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      {/* 4 Major Number Blocks */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-4 sm:p-5 text-center shadow-sm">
          <span className="text-xs font-bold text-rose-500 uppercase tracking-wide block">
            Basic (Mulank)
          </span>
          <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-1 block">
            {calculatedData.natal.basicNumber}
          </span>
        </div>
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-4 sm:p-5 text-center shadow-sm">
          <span className="text-xs font-bold text-emerald-500 uppercase tracking-wide block">
            Destiny (Bhagyank)
          </span>
          <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-1 block">
            {calculatedData.natal.destinyNumber}
          </span>
        </div>
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-4 sm:p-5 text-center shadow-sm">
          <span className="text-xs font-bold text-purple-500 uppercase tracking-wide block">
            Active Mahadasha
          </span>
          <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-1 block">
            {calculatedData.mahadasha.active.number}
          </span>
        </div>
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-4 sm:p-5 text-center shadow-sm">
          <span className="text-xs font-bold text-amber-500 uppercase tracking-wide block">
            Personal Year
          </span>
          <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-1 block">
            {calculatedData.personalYear.personalYearNumber}
          </span>
        </div>
      </div>
    </div>
  );
};
