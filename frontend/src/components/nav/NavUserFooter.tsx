import React from 'react';
import type { User, UserSubscription } from '../../types/index.ts';
import { LogOut, LogIn } from 'lucide-react';

interface Props {
  user: User | null;
  subscription: UserSubscription | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onProfileClick: () => void;
}

export const NavUserFooter: React.FC<Props> = ({
  user,
  subscription,
  onOpenAuth,
  onLogout,
  onProfileClick,
}) => {
  return (
    <div className="pt-2.5 border-t border-slate-200 dark:border-navy-800/80">
      {user ? (
        <div className="p-2 rounded-xl bg-slate-50 dark:bg-navy-900/90 border border-slate-200 dark:border-navy-800 flex items-center justify-between shadow-sm">
          <button
            onClick={onProfileClick}
            className="flex items-center gap-2 text-left hover:opacity-90 transition focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none rounded-lg flex-1 min-w-0"
            title="View Account Profile"
            aria-label={`Profile: ${user.fullName}`}
          >
            <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-black text-xs flex items-center justify-center flex-shrink-0">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-slate-900 dark:text-white text-xs truncate">
                {user.fullName}
              </div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono capitalize block truncate">
                {subscription?.planName || user.role.replace('_', ' ')}
              </span>
            </div>
          </button>

          <button
            onClick={onLogout}
            className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none flex-shrink-0 ml-1"
            title="Logout"
            aria-label="Logout from account"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={onOpenAuth}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          aria-label="Sign In with email OTP"
        >
          <LogIn className="w-3.5 h-3.5" />
          Sign In with OTP
        </button>
      )}
    </div>
  );
};
