import React, { useState, useEffect } from 'react';
import { apiRequest, getStoredSessionToken, setStoredSessionToken } from './services/api.ts';
import type { NavigationTab, User, UserSubscription, CalculatedData } from './types/index.ts';
import { Navbar } from './components/Navbar.tsx';
import { NumerologyGridCard } from './components/NumerologyGridCard.tsx';
import { MultiChartOverview } from './components/MultiChartOverview.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { ProfileTab } from './components/ProfileTab.tsx';
import { TimelineView } from './components/TimelineView.tsx';
import { SavedChartsView } from './components/SavedChartsView.tsx';
import { CompareView } from './components/CompareView.tsx';
import { AdminPortalView } from './components/AdminPortalView.tsx';
import { NewChartForm } from './components/NewChartForm.tsx';
import {
  Calendar,
  Clock,
  Printer,
  ShieldAlert,
  Info,
  Grid,
  Layers,
} from 'lucide-react';

const getTodayDate = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [calculatedData, setCalculatedData] = useState<CalculatedData | null>(null);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [preselectedCompareId, setPreselectedCompareId] = useState<string | null>(null);
  const [revocationNotice, setRevocationNotice] = useState<string | null>(null);

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

  // Loads chart with dynamic today's date (2026-11-14)
  const loadInitialChart = async () => {
    try {
      const today = getTodayDate();
      const res = await apiRequest<{ success: boolean; data: CalculatedData }>('/numerology/calculate', {
        method: 'POST',
        body: JSON.stringify({
          fullName: 'Pratham Master',
          dateOfBirth: '1994-08-13',
          targetDate: today,
        }),
      });
      setCalculatedData(res.data);
    } catch (err) {
      console.error('Failed to load chart:', err);
    }
  };

  useEffect(() => {
    checkSession();
    loadInitialChart();

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
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        user={user}
        subscription={subscription}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Single-Device Revocation Notice */}
      {revocationNotice && (
        <div className="bg-amber-950/90 border-b border-amber-800 px-4 py-2 text-amber-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-5xl mx-auto">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 text-gold-400" />
            <span>
              <strong>Session Notice:</strong> {revocationNotice}
            </span>
          </div>
          <button
            onClick={() => setRevocationNotice(null)}
            className="text-amber-400 hover:text-white text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6">
        {/* VIEW 1: OVERVIEW / DASHBOARD */}
        {currentTab === 'dashboard' && calculatedData && (
          <div className="space-y-5">
            {/* Minimalist Sub-header */}
            <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {calculatedData.birthInput.fullName}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Birth Date: <strong className="font-mono text-slate-800 dark:text-slate-200">{calculatedData.birthInput.dateOfBirth}</strong> | Analysis Date: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{calculatedData.targetDate}</strong>
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-medium rounded-lg transition flex items-center gap-1.5"
                  title="Print / Save PDF"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
              </div>
            </div>

            {/* 4 Major Number Blocks at top of PDF View */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-3 sm:p-4 text-center shadow-sm">
                <span className="text-[10px] sm:text-[11px] font-bold text-rose-500 uppercase tracking-wide block">
                  Basic (Mulank)
                </span>
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 block">
                  {calculatedData.natal.basicNumber}
                </span>
              </div>
              <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-3 sm:p-4 text-center shadow-sm">
                <span className="text-[10px] sm:text-[11px] font-bold text-emerald-500 uppercase tracking-wide block">
                  Destiny (Bhagyank)
                </span>
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 block">
                  {calculatedData.natal.destinyNumber}
                </span>
              </div>
              <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-3 sm:p-4 text-center shadow-sm">
                <span className="text-[10px] sm:text-[11px] font-bold text-purple-500 uppercase tracking-wide block">
                  Active Mahadasha
                </span>
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 block">
                  {calculatedData.mahadasha.active.number}
                </span>
              </div>
              <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-3 sm:p-4 text-center shadow-sm">
                <span className="text-[10px] sm:text-[11px] font-bold text-amber-500 uppercase tracking-wide block">
                  Personal Year
                </span>
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 block">
                  {calculatedData.personalYear.personalYearNumber}
                </span>
              </div>
            </div>

            {/* PDF View (Multi-Chart Overview with 3-Level Drill-Down) */}
            <MultiChartOverview
              data={calculatedData}
              onOpenCompare={() => setCurrentTab('compare')}
            />
          </div>
        )}

        {/* VIEW 2: NEW CHART */}
        {currentTab === 'new_chart' && (
          <NewChartForm
            onCalculated={(data) => {
              setCalculatedData(data);
              setCurrentTab('dashboard');
            }}
            subscription={subscription}
            onOpenAuth={() => setAuthModalOpen(true)}
            isLoggedIn={!!user}
          />
        )}

        {/* VIEW 3: NATAL GRID */}
        {currentTab === 'natal' && calculatedData && (
          <div className="space-y-4 max-w-3xl mx-auto">
            <NumerologyGridCard
              grid={calculatedData.natal.grid}
              title="Permanent Natal Grid"
              subtitle={`${calculatedData.birthInput.fullName} (DOB: ${calculatedData.birthInput.dateOfBirth})`}
            />

            <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-5 text-xs text-slate-600 dark:text-slate-300 space-y-2">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Info className="w-4 h-4 text-emerald-500" />
                Natal Grid Rules (Section 9.3)
              </h3>
              <p>• Century digits excluded: <strong>"{calculatedData.natal.centuryDigitsExcluded}"</strong> (retained year digits: <strong>"{calculatedData.natal.remainingYearDigits}"</strong>).</p>
              <p>• Birth digits included: <strong>[{calculatedData.natal.includedDateDigits.join(', ')}]</strong> (zeros ignored).</p>
              <p>• Basic Number: <strong className="text-rose-500">{calculatedData.natal.basicNumber}</strong> | Destiny Number: <strong className="text-emerald-500">{calculatedData.natal.destinyNumber}</strong>.</p>
              <p>• Final Natal Digits: <strong>[{calculatedData.natal.finalNatalDigits.map((i) => i.value).join(', ')}]</strong>.</p>
            </div>
          </div>
        )}

        {/* VIEW 4: MAHADASHA */}
        {currentTab === 'mahadasha' && calculatedData && (
          <div className="space-y-4 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-4 flex justify-between items-center text-xs">
              <div>
                <h2 className="font-bold text-sm text-slate-900 dark:text-white">Mahadasha Calculation (Section 10)</h2>
                <p className="text-slate-500 dark:text-slate-400">Begins with Basic Number ({calculatedData.natal.basicNumber}), duration = number, restarts at age 45.</p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950 border border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-bold font-mono">
                Active: Number {calculatedData.mahadasha.active.number}
              </span>
            </div>

            <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-navy-950 text-slate-500 uppercase font-mono text-[10px] border-b border-slate-200 dark:border-navy-800">
                  <tr>
                    <th className="py-2.5 px-3">Period</th>
                    <th className="py-2.5 px-3">Mahadasha</th>
                    <th className="py-2.5 px-3">Duration</th>
                    <th className="py-2.5 px-3">Age Range</th>
                    <th className="py-2.5 px-3">Date Range</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-navy-800/60 font-mono text-slate-700 dark:text-slate-300">
                  {calculatedData.mahadasha.periods.slice(0, 12).map((p, idx) => (
                    <tr key={idx} className={p.number === calculatedData.mahadasha.active.number ? 'bg-purple-50 dark:bg-purple-950/40 font-bold' : ''}>
                      <td className="py-2.5 px-3">#{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        Mahadasha {p.number} {p.isRestartAt45 && <span className="text-emerald-500 font-sans font-normal">(Age 45 Restart)</span>}
                      </td>
                      <td className="py-2.5 px-3">{p.durationYears} Years</td>
                      <td className="py-2.5 px-3">Age {p.ageAtStart}–{p.ageAtEnd}</td>
                      <td className="py-2.5 px-3">{p.startDate} to {p.endDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 5: PERSONAL YEAR */}
        {currentTab === 'personal_year' && calculatedData && (
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-6 max-w-xl mx-auto space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Personal Year Calculation (Section 11)</h2>
            <div className="text-4xl font-black text-amber-500 py-3 text-center bg-slate-50 dark:bg-navy-950 rounded-xl border border-slate-200 dark:border-navy-800 font-mono">
              Personal Year: {calculatedData.personalYear.personalYearNumber}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 font-mono bg-slate-50 dark:bg-navy-950/60 p-3 rounded-lg border border-slate-200 dark:border-navy-800">
              <div>Period: {calculatedData.personalYear.startDate} to {calculatedData.personalYear.endDate}</div>
              <div>Birthday Weekday: {calculatedData.personalYear.birthdayWeekday} (Value: {calculatedData.personalYear.birthdayWeekdayNumber})</div>
              <div>Formula Sum: {calculatedData.personalYear.calculationSum} → {calculatedData.personalYear.personalYearNumber}</div>
            </div>
          </div>
        )}

        {/* VIEW 6: PRATYANTAR */}
        {currentTab === 'pratyantar' && calculatedData && (
          <div className="space-y-4 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-4 text-xs">
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">Monthly / Pratyantar Dasha (Section 13)</h2>
              <p className="text-slate-500 dark:text-slate-400">9 periods of (Number × 8 days) = 360 days total + blank remainder days.</p>
            </div>

            <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 dark:bg-navy-950 text-slate-500 uppercase text-[10px] border-b border-slate-200 dark:border-navy-800">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Pratyantar</th>
                    <th className="py-2.5 px-3">Duration</th>
                    <th className="py-2.5 px-3">Date Range</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-navy-800/60 text-slate-700 dark:text-slate-300">
                  {calculatedData.pratyantar.periods.map((p, idx) => (
                    <tr key={idx} className={p.isBlank ? 'bg-slate-50 dark:bg-navy-950 italic text-slate-400' : ''}>
                      <td className="py-2 px-3">#{p.periodOrder}</td>
                      <td className="py-2 px-3">
                        {p.isBlank ? 'Blank Remainder' : `Pratyantar ${p.pratyantarNumber}`}
                      </td>
                      <td className="py-2 px-3">{p.durationDays} Days</td>
                      <td className="py-2 px-3">{p.startDate} to {p.endDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 7: DAILY GRID */}
        {currentTab === 'daily' && calculatedData && (
          <div className="space-y-4 max-w-3xl mx-auto">
            <NumerologyGridCard
              grid={calculatedData.dailyGrid.dailyGrid}
              title="Daily Grid (Section 15)"
              subtitle={`Date: ${calculatedData.dailyGrid.date} (${calculatedData.dailyGrid.weekday}) | Day Lord: ${calculatedData.dayLord?.dayLordNumber || 'None'}`}
              dateRange={calculatedData.dailyGrid.date}
            />
          </div>
        )}

        {/* VIEW 8: 100-YEAR TIMELINE */}
        {currentTab === 'timeline' && calculatedData && (
          <TimelineView
            data={calculatedData}
            subscription={subscription}
          />
        )}

        {/* VIEW 9: SAVED CHARTS */}
        {currentTab === 'saved_charts' && (
          <SavedChartsView
            onLoadChart={(data) => {
              setCalculatedData(data);
              setCurrentTab('dashboard');
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

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={(u, s) => {
          setUser(u);
          setSubscription(s);
          checkSession();
        }}
      />
    </div>
  );
};
