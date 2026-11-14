import React, { useState } from 'react';
import type { NavigationTab, User, UserSubscription } from '../types/index.ts';
import {
  User as UserIcon,
  LogOut,
  LogIn,
  Menu,
  X,
  Shield,
} from 'lucide-react';

interface Props {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  user: User | null;
  subscription: UserSubscription | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<Props> = ({
  currentTab,
  onSelectTab,
  user,
  subscription,
  onOpenAuth,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Minimalistic, organized navigation tabs
  const navItems: Array<{ tab: NavigationTab; label: string }> = [
    { tab: 'dashboard', label: 'Overview' },
    { tab: 'new_chart', label: 'New Chart' },
    { tab: 'natal', label: 'Natal Grid' },
    { tab: 'mahadasha', label: 'Mahadasha' },
    { tab: 'personal_year', label: 'Personal Year' },
    { tab: 'pratyantar', label: 'Monthly' },
    { tab: 'daily', label: 'Daily' },
    { tab: 'timeline', label: '100-Yr Timeline' },
    { tab: 'saved_charts', label: 'Saved Charts' },
    { tab: 'compare', label: 'Compare' },
    { tab: 'profile', label: 'Profile' },
  ];

  if (user?.role === 'super_admin' || user?.role === 'admin') {
    navItems.push({ tab: 'admin', label: 'Admin' });
  }

  const handleNavClick = (tab: NavigationTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-navy-950/90 backdrop-blur-md border-b border-navy-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Minimalist Logo without "Premium" */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => handleNavClick('dashboard')}
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-sm shadow-sm">
              AN
            </div>
            <div className="tracking-tight text-white font-bold text-base sm:text-lg">
              Astro<span className="text-emerald-400 font-light">Numerology</span>
            </div>
          </div>

          {/* Clean, spacious desktop menu */}
          <nav className="hidden lg:flex items-center space-x-1" aria-label="Main Navigation">
            {navItems.map((item) => {
              const isActive = currentTab === item.tab;
              return (
                <button
                  key={item.tab}
                  onClick={() => handleNavClick(item.tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-navy-800 text-emerald-400 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-navy-900'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* User info / Login Button */}
          <div className="hidden sm:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleNavClick('profile')}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-navy-800 transition"
                  title="My Profile"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold text-[11px] flex items-center justify-center">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium">{user.fullName}</span>
                </button>

                <button
                  onClick={onLogout}
                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition"
                  title="Logout"
                  aria-label="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </button>
            )}
          </div>

          {/* Mobile menu toggle button */}
          <div className="lg:hidden flex items-center gap-2">
            {!user && (
              <button
                onClick={onOpenAuth}
                className="px-2.5 py-1 text-xs font-medium bg-emerald-600 text-white rounded-lg"
              >
                Sign In
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-navy-800"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-navy-900 border-b border-navy-800 px-4 pt-2 pb-5 space-y-1">
          {user && (
            <div className="flex items-center justify-between p-2.5 mb-2 rounded-lg bg-navy-950 border border-navy-800 text-xs">
              <span className="font-semibold text-white">{user.fullName}</span>
              <button onClick={onLogout} className="text-rose-400 hover:underline">
                Sign Out
              </button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-1">
            {navItems.map((item) => (
              <button
                key={item.tab}
                onClick={() => handleNavClick(item.tab)}
                className={`text-left px-3 py-2 rounded-lg text-xs font-medium ${
                  currentTab === item.tab
                    ? 'bg-navy-800 text-emerald-400 font-semibold'
                    : 'text-slate-400 hover:bg-navy-950 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
