import React, { useState, useEffect } from 'react';
import type { NavigationTab, User, UserSubscription } from '../types/index.ts';
import {
  LayoutDashboard,
  PlusCircle,
  Grid,
  Calendar,
  Sun,
  Layers,
  Clock,
  TrendingUp,
  Bookmark,
  GitCompare,
  User as UserIcon,
  Shield,
  Menu,
} from 'lucide-react';
import { NavBrandHeader } from './nav/NavBrandHeader.tsx';
import { AstroChartNavButton } from './nav/AstroChartNavButton.tsx';
import { NavUserFooter } from './nav/NavUserFooter.tsx';
import { MobileDrawer } from './nav/MobileDrawer.tsx';

interface Props {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  user: User | null;
  subscription: UserSubscription | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenAstroModal: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const LeftNavbar: React.FC<Props> = ({
  currentTab,
  onSelectTab,
  user,
  subscription,
  onOpenAuth,
  onLogout,
  onOpenAstroModal,
  theme,
  onToggleTheme,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const navItems: Array<{ tab: NavigationTab; label: string; icon: React.ReactNode }> = [
    { tab: 'dashboard', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { tab: 'new_chart', label: 'New Chart', icon: <PlusCircle className="w-4 h-4" /> },
    { tab: 'natal', label: 'Natal Grid', icon: <Grid className="w-4 h-4" /> },
    { tab: 'mahadasha', label: 'Mahadasha', icon: <Calendar className="w-4 h-4" /> },
    { tab: 'personal_year', label: 'Personal Year', icon: <Sun className="w-4 h-4" /> },
    { tab: 'pratyantar', label: 'Monthly', icon: <Layers className="w-4 h-4" /> },
    { tab: 'daily', label: 'Daily', icon: <Clock className="w-4 h-4" /> },
    { tab: 'timeline', label: '100-Yr Timeline', icon: <TrendingUp className="w-4 h-4" /> },
    { tab: 'saved_charts', label: 'Saved Charts', icon: <Bookmark className="w-4 h-4" /> },
    { tab: 'compare', label: 'Compare', icon: <GitCompare className="w-4 h-4" /> },
    { tab: 'profile', label: 'Profile', icon: <UserIcon className="w-4 h-4" /> },
  ];

  if (user?.role === 'super_admin' || user?.role === 'admin') {
    navItems.push({
      tab: 'admin',
      label: 'Admin Portal',
      icon: <Shield className="w-4 h-4 text-amber-500 dark:text-amber-400" />,
    });
  }

  const handleNavClick = (tab: NavigationTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* ======================================================== */}
      {/* MOBILE TOP BAR (Screen width < 1024px)                  */}
      {/* ======================================================== */}
      <header
        role="banner"
        className="lg:hidden sticky top-0 z-40 bg-white/95 dark:bg-navy-950/95 backdrop-blur-md border-b border-slate-200 dark:border-navy-800/80 px-4 h-14 sm:h-16 flex items-center justify-between shadow-sm"
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800 transition focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileMenuOpen}
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none rounded-lg"
          >
            <img
              src="/logo.jpg"
              alt="Logo"
              className="w-8 h-8 rounded-lg object-cover border border-amber-500/40"
            />
            <span className="font-black text-sm tracking-tight text-slate-900 dark:text-white">
              Talkto<span className="text-amber-500 dark:text-amber-400">Nakshatra</span>
            </span>
          </button>
        </div>

        {/* Mobile top bar right buttons */}
        <div className="flex items-center gap-2">
          <AstroChartNavButton onClick={onOpenAstroModal} />
        </div>
      </header>

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        currentTab={currentTab}
        onSelectTab={handleNavClick}
        navItems={navItems}
        user={user}
        subscription={subscription}
        onOpenAuth={onOpenAuth}
        onLogout={onLogout}
        onOpenAstroModal={onOpenAstroModal}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />

      {/* ======================================================== */}
      {/* DESKTOP SIDEBAR (Completely Fitted, 0 Scrollbar Needed)  */}
      {/* ======================================================== */}
      <aside
        role="navigation"
        aria-label="Main Navigation"
        className="hidden lg:flex fixed top-0 left-0 bottom-0 w-64 xl:w-72 bg-white/95 dark:bg-navy-950/95 backdrop-blur-md border-r border-slate-200 dark:border-navy-800/80 z-40 flex-col justify-between p-3.5 shadow-xl select-none"
      >
        <div className="space-y-2">
          {/* Logo & Theme Switcher on the same row */}
          <NavBrandHeader
            onHomeClick={() => handleNavClick('dashboard')}
            theme={theme}
            onToggleTheme={onToggleTheme}
          />

          {/* Astro Chart Button */}
          <AstroChartNavButton onClick={onOpenAstroModal} />

          {/* Navigation Items (Sleek, Compact, Zero Scrollbar) */}
          <nav className="space-y-0.5 pt-0.5" aria-label="Desktop Navigation Items">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2.5 pb-0.5">
              Modules
            </div>
            {navItems.map((item) => {
              const isActive = currentTab === item.tab;
              return (
                <button
                  key={item.tab}
                  onClick={() => handleNavClick(item.tab)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-[13px] font-semibold transition ${
                    isActive
                      ? 'bg-emerald-50 dark:bg-navy-800 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/40 font-bold shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-navy-900/80'
                  } focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none`}
                >
                  <span className={isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card / Login Footer */}
        <NavUserFooter
          user={user}
          subscription={subscription}
          onOpenAuth={onOpenAuth}
          onLogout={onLogout}
          onProfileClick={() => handleNavClick('profile')}
        />
      </aside>
    </>
  );
};
