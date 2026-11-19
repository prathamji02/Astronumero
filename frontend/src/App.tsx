import React, { useState, useEffect } from 'react';
import { apiRequest, getStoredSessionToken, setStoredSessionToken } from './services/api.ts';
import type { NavigationTab, User, UserSubscription, CalculatedData } from './types/index.ts';
import { LeftNavbar } from './components/LeftNavbar.tsx';
import { AstroChartModal } from './components/AstroChartModal.tsx';
import { MultiChartOverview } from './components/MultiChartOverview.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { ProfileTab } from './components/ProfileTab.tsx';
import { TimelineView } from './components/TimelineView.tsx';
import { SavedChartsView } from './components/SavedChartsView.tsx';
import { CompareView } from './components/CompareView.tsx';
import { AdminPortalView } from './components/AdminPortalView.tsx';
import { NewChartForm } from './components/NewChartForm.tsx';
import { AppAlerts } from './components/common/AppAlerts.tsx';
import { SaveChartActionBar } from './components/common/SaveChartActionBar.tsx';
import { CalculationDetailViews } from './components/views/CalculationDetailViews.tsx';

function formatToDDMMYYYY(dateStr: string): string {
  if (!dateStr) return '';
  const clean = String(dateStr).split('T')[0].trim();
  const parts = clean.split('-');
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return `${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[0]}`;
    } else if (parts[2].length === 4) {
      return `${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[2]}`;
    }
  }
  return clean;
}

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [calculatedData, setCalculatedData] = useState<CalculatedData | null>(null);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [astroModalOpen, setAstroModalOpen] = useState(false);
  const [preselectedCompareId, setPreselectedCompareId] = useState<string | null>(null);
  const [revocationNotice, setRevocationNotice] = useState<string | null>(null);

  // Save Chart State
  const [isSavingChart, setIsSavingChart] = useState(false);
  const [chartSavedStatus, setChartSavedStatus] = useState(false);
  const [saveBannerMessage, setSaveBannerMessage] = useState<string | null>(null);

  // Screen reader accessible announcement state
  const [srAnnouncement, setSrAnnouncement] = useState('');

  // Light / Dark Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('talkto_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
    localStorage.setItem('talkto_theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    setSrAnnouncement(`Theme switched to ${next} mode.`);
  };

  const checkSession = async () => {
    const token = getStoredSessionToken();
    if (!token) return;

    try {
      const res = await apiRequest<{ user: User; subscription: UserSubscription | null }>('/auth/me');
      setUser(res.user);
      setSubscription(res.subscription);
    } catch {
      setStoredSessionToken(null);
      setUser(null);
      setSubscription(null);
    }
  };

  useEffect(() => {
    checkSession();

    const handleRevocation = (e: any) => {
      setUser(null);
      setSubscription(null);
      setRevocationNotice(e.detail?.message || 'Your account was logged in on another device.');
    };

    window.addEventListener('astro:session_terminated', handleRevocation);
    return () => {
      window.removeEventListener('astro:session_terminated', handleRevocation);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch {}
    setStoredSessionToken(null);
    setUser(null);
    setSubscription(null);
    setCurrentTab('dashboard');
    setSrAnnouncement('Logged out successfully.');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSaveActiveChart = async () => {
    if (!calculatedData) return;
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    try {
      setIsSavingChart(true);
      await apiRequest('/charts', {
        method: 'POST',
        body: JSON.stringify({
          personName: calculatedData.birthInput.fullName,
          dateOfBirth: calculatedData.birthInput.dateOfBirth,
          timeOfBirth: calculatedData.birthInput.timeOfBirth || undefined,
          placeOfBirth: calculatedData.birthInput.placeOfBirth || undefined,
          notes: `Analysis Date: ${formatToDDMMYYYY(calculatedData.targetDate)}`,
          calculationData: calculatedData,
        }),
      });
      setChartSavedStatus(true);
      const msg = `Chart for "${calculatedData.birthInput.fullName}" saved successfully to your Saved Charts!`;
      setSaveBannerMessage(msg);
      setSrAnnouncement(msg);
      setTimeout(() => setChartSavedStatus(false), 5000);
      setTimeout(() => setSaveBannerMessage(null), 6000);
    } catch (err: any) {
      alert(err.message || 'Failed to save chart.');
    } finally {
      setIsSavingChart(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans">
      {/* Accessible Skip Link for Screen Readers (NVDA / JAWS / Narrator / TalkBack / VoiceOver) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-emerald-600 focus:text-white focus:rounded-xl focus:shadow-2xl focus:outline-none focus:ring-2 focus:ring-white font-bold text-xs"
      >
        Skip to main content
      </a>

      {/* Left-Side Navigation Ribbon */}
      <LeftNavbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setSrAnnouncement(`Navigated to ${tab.replace('_', ' ')}`);
        }}
        user={user}
        subscription={subscription}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenAstroModal={() => setAstroModalOpen(true)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Content Area - Offset on desktop by the left-hand ribbon width */}
      <div className="flex-1 lg:ml-64 xl:ml-72 min-h-screen flex flex-col">
        {/* System Announcements & Alerts (Revocation Notice, Save Confirmation, SR Live Region) */}
        <AppAlerts
          revocationNotice={revocationNotice}
          onDismissRevocation={() => setRevocationNotice(null)}
          saveBannerMessage={saveBannerMessage}
          onDismissSaveBanner={() => setSaveBannerMessage(null)}
          srAnnouncement={srAnnouncement}
        />

        {/* Main Content Container */}
        <main
          id="main-content"
          tabIndex={-1}
          role="main"
          className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6 outline-none"
        >
          {/* VIEW 1: OVERVIEW / DASHBOARD */}
          {currentTab === 'dashboard' && (
            calculatedData ? (
              <div className="space-y-5">
                {/* Save Chart Action Bar and 4 Major Numbers */}
                <SaveChartActionBar
                  calculatedData={calculatedData}
                  onNewPerson={() => setCalculatedData(null)}
                  onSaveChart={handleSaveActiveChart}
                  isSavingChart={isSavingChart}
                  chartSavedStatus={chartSavedStatus}
                  onPrint={handlePrint}
                  formatDate={formatToDDMMYYYY}
                />

                {/* PDF View (Multi-Chart Overview with 3-Level Drill-Down) */}
                <MultiChartOverview
                  data={calculatedData}
                  onOpenCompare={() => setCurrentTab('compare')}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    TalktoNakshatra Calculation Engine
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                    Enter person details below to generate their complete Natal, Mahadasha, Personal Year, Monthly Pratyantar, and Daily charts.
                  </p>
                </div>
                <NewChartForm
                  onCalculated={(data) => {
                    setCalculatedData(data);
                    setSrAnnouncement(`Chart calculated successfully for ${data.birthInput.fullName}. Basic Number is ${data.natal.basicNumber}, Destiny Number is ${data.natal.destinyNumber}.`);
                  }}
                  subscription={subscription}
                  onOpenAuth={() => setAuthModalOpen(true)}
                  isLoggedIn={!!user}
                />
              </div>
            )
          )}

          {/* VIEW 2: NEW CHART */}
          {currentTab === 'new_chart' && (
            <NewChartForm
              onCalculated={(data) => {
                setCalculatedData(data);
                setCurrentTab('dashboard');
                setSrAnnouncement(`Chart calculated successfully for ${data.birthInput.fullName}.`);
              }}
              subscription={subscription}
              onOpenAuth={() => setAuthModalOpen(true)}
              isLoggedIn={!!user}
            />
          )}

          {/* VIEW 3-7: DETAILED NUMEROLOGY CALCULATION VIEWS (Natal, Mahadasha, Personal Year, Pratyantar, Daily Grid) */}
          {['natal', 'mahadasha', 'personal_year', 'pratyantar', 'daily'].includes(currentTab) && calculatedData && (
            <CalculationDetailViews
              currentTab={currentTab}
              calculatedData={calculatedData}
              formatDate={formatToDDMMYYYY}
            />
          )}

          {/* VIEW 8: 100-YEAR TIMELINE */}
          {currentTab === 'timeline' && calculatedData && (
            <TimelineView
              data={calculatedData}
              subscription={subscription}
            />
          )}

          {/* Empty State when detailed calculation tab is selected without chart data */}
          {['natal', 'mahadasha', 'personal_year', 'pratyantar', 'daily', 'timeline'].includes(currentTab) && !calculatedData && (
            <div className="text-center py-16 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl max-w-lg mx-auto p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">No Active Chart</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Please enter birth details first on the Overview tab to generate this calculation.
              </p>
              <button
                onClick={() => setCurrentTab('dashboard')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm transition"
              >
                Enter Birth Details
              </button>
            </div>
          )}

          {/* VIEW 9: SAVED CHARTS */}
          {currentTab === 'saved_charts' && (
            <SavedChartsView
              onLoadChart={(data) => {
                setCalculatedData(data);
                setCurrentTab('dashboard');
                setSrAnnouncement(`Loaded chart for ${data.birthInput.fullName}.`);
              }}
              onOpenCompare={(id) => {
                setPreselectedCompareId(id);
                setCurrentTab('compare');
              }}
            />
          )}

          {/* VIEW 10: COMPARE */}
          {currentTab === 'compare' && (
            <CompareView
              subscription={subscription}
              preselectedChartId={preselectedCompareId}
            />
          )}

          {/* VIEW 11: PROFILE */}
          {currentTab === 'profile' && (
            user ? (
              <ProfileTab
                user={user}
                onRefreshUser={checkSession}
              />
            ) : (
              <div className="text-center py-12 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl max-w-md mx-auto p-6">
                <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">Sign In to View Profile</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Access your personal numbers, subscription plan, and active device sessions.
                </p>
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm transition"
                >
                  Sign In with OTP
                </button>
              </div>
            )
          )}

          {/* VIEW 12: ADMIN */}
          {currentTab === 'admin' && <AdminPortalView />}
        </main>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={(u, s) => {
          setUser(u);
          setSubscription(s);
          checkSession();
          setSrAnnouncement(`Signed in successfully as ${u.fullName}.`);
        }}
      />

      {/* Highlighted Astro Chart Coming Soon Modal (Requirement 8) */}
      <AstroChartModal
        isOpen={astroModalOpen}
        onClose={() => setAstroModalOpen(false)}
      />
    </div>
  );
};
