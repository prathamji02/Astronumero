import React from 'react';
import type { NavigationTab, User, UserSubscription } from '../../types/index.ts';
import { X, Sun, Moon } from 'lucide-react';
import { AstroChartNavButton } from './AstroChartNavButton.tsx';
import { NavUserFooter } from './NavUserFooter.tsx';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  navItems: Array<{ tab: NavigationTab; label: string; icon: React.ReactNode }>;
  user: User | null;
  subscription: UserSubscription | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenAstroModal: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const MobileDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  currentTab,
  onSelectTab,
  navItems,
  user,
  subscription,
  onOpenAuth,
  onLogout,
  onOpenAstroModal,
  theme,
  onToggleTheme,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="lg:hidden fixed inset-0 z-50 bg-navy-950/70 backdrop-blur-sm animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Navigation Menu"
    >
      <div
        className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white dark:bg-navy-950 border-r border-slate-200 dark:border-navy-800 p-4 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-left duration-200"
      >
        <div className="space-y-3">
          {/* Drawer Top Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-navy-800">
            <div className="flex items-center gap-2">
              <img
                src="/logo.jpg"
                alt="Logo"
                className="w-8 h-8 rounded-lg object-cover border border-amber-500/40"
              />
              <div>
                <span className="font-bold text-slate-900 dark:text-white text-xs block leading-tight">
                  Talkto<span className="text-amber-500 dark:text-amber-400">Nakshatra</span>
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Navigation Menu</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Theme Toggle Pill in mobile drawer */}
          <button
            onClick={onToggleTheme}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100 dark:bg-navy-900 border border-slate-200 dark:border-navy-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition text-xs font-semibold"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            <div className="flex items-center gap-2">
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
              <span>{theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400">
              {theme}
            </span>
          </button>

          {/* Astro Chart Button */}
          <AstroChartNavButton
            onClick={() => {
              onClose();
              onOpenAstroModal();
            }}
          />

          {/* Navigation Items */}
          <nav className="space-y-0.5" aria-label="Mobile Navigation Items">
            {navItems.map((item) => {
              const isActive = currentTab === item.tab;
              return (
                <button
                  key={item.tab}
                  onClick={() => {
                    onSelectTab(item.tab);
                    onClose();
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-900 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Footer */}
        <NavUserFooter
          user={user}
          subscription={subscription}
          onOpenAuth={() => {
            onClose();
            onOpenAuth();
          }}
          onLogout={onLogout}
          onProfileClick={() => {
            onClose();
            onSelectTab('profile');
          }}
        />
      </div>
    </div>
  );
};
