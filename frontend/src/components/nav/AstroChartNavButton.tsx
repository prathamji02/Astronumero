import React from 'react';
import { Sparkles } from 'lucide-react';

interface Props {
  onClick: () => void;
}

export const AstroChartNavButton: React.FC<Props> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-amber-500/10 dark:from-amber-500/15 dark:via-purple-600/15 dark:to-amber-500/15 border border-amber-400/50 hover:border-amber-400 text-amber-800 dark:text-amber-200 hover:text-amber-900 dark:hover:text-white transition group shadow-sm flex items-center justify-between focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
      aria-haspopup="dialog"
      aria-label="Astro Chart (Vedic Kundli Transits - Feature in development)"
    >
      <div className="flex items-center gap-2">
        <span className="p-1 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 animate-pulse" />
        </span>
        <div>
          <span className="font-bold text-xs block text-slate-900 dark:text-white leading-tight">
            Astro Chart
          </span>
          <span className="text-[9px] text-amber-700 dark:text-amber-300/80 font-medium leading-none block">
            Vedic Kundli Transits
          </span>
        </div>
      </div>
      <span className="px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase bg-amber-400/20 text-amber-700 dark:text-amber-300 border border-amber-400/40">
        ✨ Soon
      </span>
    </button>
  );
};
