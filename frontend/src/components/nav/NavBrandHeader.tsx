import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface Props {
  onHomeClick: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  compact?: boolean;
}

export const NavBrandHeader: React.FC<Props> = ({
  onHomeClick,
  theme,
  onToggleTheme,
  compact = false,
}) => {
  return (
    <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-200 dark:border-navy-800/80">
      <button
        onClick={onHomeClick}
        className="flex items-center gap-2.5 text-left group focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none rounded-xl"
        aria-label="TalktoNakshatra Home"
      >
        <img
          src="/logo.jpg"
          alt="TalktoNakshatra Logo"
          className="w-9 h-9 rounded-xl object-cover border border-amber-500/40 shadow-sm group-hover:scale-105 transition"
        />
        <div>
          <div className="text-slate-900 dark:text-white font-black text-sm tracking-tight leading-tight">
            Talkto<span className="text-amber-500 dark:text-amber-400">Nakshatra</span>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase">
            Vedic Astro Platform
          </div>
        </div>
      </button>

      {/* Theme Toggle Button */}
      <button
        type="button"
        onClick={onToggleTheme}
        className="p-1.5 rounded-xl bg-slate-100 dark:bg-navy-900 border border-slate-200 dark:border-navy-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-navy-700 transition shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? (
          <Sun className="w-4 h-4 text-amber-400" />
        ) : (
          <Moon className="w-4 h-4 text-indigo-600" />
        )}
      </button>
    </div>
  );
};
