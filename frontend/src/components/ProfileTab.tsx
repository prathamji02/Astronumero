import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api.ts';
import type { User, UserProfile, UserSubscription } from '../types/index.ts';
import {
  User as UserIcon,
  Calendar,
  Clock,
  MapPin,
  CreditCard,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Bookmark,
  Smartphone,
  Save,
} from 'lucide-react';

interface Props {
  user: User;
  onRefreshUser: () => void;
}

export const ProfileTab: React.FC<Props> = ({ user, onRefreshUser }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [chartStats, setChartStats] = useState<{ total_saved_charts: number } | null>(null);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [recentCharts, setRecentCharts] = useState<any[]>([]);

  // Edit form states
  const [fullName, setFullName] = useState(user.fullName);
  const [dob, setDob] = useState('');
  const [tob, setTob] = useState('');
  const [pob, setPob] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [language, setLanguage] = useState('en');

  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savingBirth, setSavingBirth] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchProfile = async () => {
    try {
      const res = await apiRequest<any>('/user/profile');
      setProfile(res.profile);
      setSubscription(res.subscription);
      setChartStats(res.chartStats);
      setActiveSession(res.activeSession);
      setRecentCharts(res.recentCharts || []);

      if (res.profile) {
        setDob(res.profile.date_of_birth || '');
        setTob(res.profile.time_of_birth || '');
        setPob(res.profile.place_of_birth || '');
        setTimezone(res.profile.timezone || 'UTC');
        setLanguage(res.profile.language || 'en');
      }
    } catch (err: any) {
      console.error('Failed to load profile:', err);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPersonal(true);
    setFeedback(null);
    try {
      await apiRequest('/user/profile', {
        method: 'PUT',
        body: JSON.stringify({ fullName, timezone, language }),
      });
      setFeedback({ text: 'Personal information updated successfully.', type: 'success' });
      onRefreshUser();
      fetchProfile();
    } catch (err: any) {
      setFeedback({ text: err.message || 'Failed to update personal details.', type: 'error' });
    } finally {
      setSavingPersonal(false);
    }
  };

  const handleSaveBirth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dob) {
      setFeedback({ text: 'Date of birth is required.', type: 'error' });
      return;
    }
    setSavingBirth(true);
    setFeedback(null);
    try {
      const res = await apiRequest<any>('/user/birth-details', {
        method: 'PUT',
        body: JSON.stringify({ dateOfBirth: dob, timeOfBirth: tob, placeOfBirth: pob }),
      });
      setFeedback({
        text: `Birth details saved! Basic Number (Mulank) = ${res.data.basicNumber}, Destiny Number (Bhagyank) = ${res.data.destinyNumber}.`,
        type: 'success',
      });
      fetchProfile();
    } catch (err: any) {
      setFeedback({ text: err.message || 'Failed to update birth details.', type: 'error' });
    } finally {
      setSavingBirth(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel auto-renewal for your subscription?')) return;
    try {
      await apiRequest('/subscriptions/cancel', { method: 'POST' });
      alert('Your subscription auto-renewal has been cancelled. Benefits remain active until current period expiry.');
      fetchProfile();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel subscription.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Top Banner */}
      <div className="bg-navy-900 border border-navy-700/80 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-navy-950 rounded-[14px] flex items-center justify-center text-2xl font-black text-emerald-400">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">{user.fullName}</h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                <ShieldCheck className="w-3 h-3" />
                {user.role === 'super_admin' ? 'Super Administrator' : 'Verified Member'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Account ID: <span className="font-mono text-slate-300">{user.id}</span>
            </p>
          </div>
        </div>

        {/* Plan Pill */}
        <div className="bg-navy-950 border border-navy-800 rounded-2xl p-4 flex items-center gap-4">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
              Membership Status
            </span>
            <span className="text-base font-bold text-emerald-400">
              Full Access Unlocked
            </span>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-950/70 border border-emerald-800 text-emerald-300'
              : 'bg-rose-950/70 border border-rose-800 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {feedback.text}
        </div>
      )}

      {/* Grid: 3 Main Cards (Personal, Birth/Numerology, Plan) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Personal Information */}
        <div className="bg-navy-900 border border-navy-700/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-navy-800">
              <UserIcon className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">Personal Information</h2>
            </div>

            <form onSubmit={handleSavePersonal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-navy-950 border border-navy-700 rounded-xl text-white text-xs focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <input
                  type="text"
                  disabled
                  value={user.email || 'None registered'}
                  className="w-full px-3 py-2 bg-navy-950/60 border border-navy-800 rounded-xl text-slate-400 text-xs cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">Verified primary contact.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Mobile Number</label>
                <input
                  type="text"
                  disabled
                  value={user.mobile || 'None registered'}
                  className="w-full px-3 py-2 bg-navy-950/60 border border-navy-800 rounded-xl text-slate-400 text-xs cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Timezone</label>
                  <input
                    type="text"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-3 py-2 bg-navy-950 border border-navy-700 rounded-xl text-white text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Language</label>
                  <input
                    type="text"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3 py-2 bg-navy-950 border border-navy-700 rounded-xl text-white text-xs outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingPersonal}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition"
              >
                <Save className="w-3.5 h-3.5" />
                {savingPersonal ? 'Saving...' : 'Save Profile Details'}
              </button>
            </form>
          </div>
        </div>

        {/* 2. Birth & Numerology Calculations (Section 6.2) */}
        <div className="bg-navy-900 border border-navy-700/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-navy-800">
              <Calendar className="w-5 h-5 text-gold-400" />
              <h2 className="text-lg font-bold text-white">Birth & Numerology</h2>
            </div>

            {profile && profile.basic_number && profile.destiny_number && (
              <div className="grid grid-cols-2 gap-3 mb-5 p-3 rounded-xl bg-navy-950 border border-navy-800 text-center">
                <div className="p-2 rounded-lg bg-emerald-950/50 border border-emerald-900">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 block">Basic (Mulank)</span>
                  <span className="text-2xl font-black text-white">{profile.basic_number}</span>
                </div>
                <div className="p-2 rounded-lg bg-amber-950/50 border border-amber-900">
                  <span className="text-[10px] uppercase font-bold text-gold-400 block">Destiny (Bhagyank)</span>
                  <span className="text-2xl font-black text-white">{profile.destiny_number}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveBirth} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Date of Birth (YYYY-MM-DD) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3 py-2 bg-navy-950 border border-navy-700 rounded-xl text-white text-xs focus:border-gold-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Time of Birth (Optional)</label>
                <div className="relative">
                  <input
                    type="time"
                    value={tob}
                    onChange={(e) => setTob(e.target.value)}
                    className="w-full px-3 py-2 bg-navy-950 border border-navy-700 rounded-xl text-white text-xs outline-none"
                  />
                  <Clock className="w-4 h-4 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Place of Birth (Optional)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={pob}
                    onChange={(e) => setPob(e.target.value)}
                    placeholder="e.g. New Delhi, India"
                    className="w-full px-3 py-2 bg-navy-950 border border-navy-700 rounded-xl text-white text-xs outline-none"
                  />
                  <MapPin className="w-4 h-4 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div className="text-[10px] text-slate-400 bg-navy-950 p-2.5 rounded-xl border border-navy-800">
                💡 Updating your birth date recalculates your personal profile numbers. Historical saved charts are securely preserved.
              </div>

              <button
                type="submit"
                disabled={savingBirth}
                className="w-full py-2.5 bg-gold-600 hover:bg-gold-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition"
              >
                <Save className="w-3.5 h-3.5" />
                {savingBirth ? 'Calculating...' : 'Update & Recalculate'}
              </button>
            </form>
          </div>
        </div>

        {/* 3. My Plan / Subscription Card (Section 6.3) */}
        <div className="bg-navy-900 border border-navy-700/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-navy-800">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">Subscription & Plan</h2>
            </div>

            {subscription ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-navy-950 border border-emerald-500/30">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs text-slate-400 uppercase font-semibold">Plan Name</span>
                      <h3 className="text-lg font-bold text-white">{subscription.planName}</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-800">
                      {subscription.status}
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-navy-800 space-y-1 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span>Start Date:</span>
                      <span className="font-mono">{subscription.startDate.split('T')[0]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expiry Date:</span>
                      <span className="font-mono text-emerald-400">{subscription.endDate.split('T')[0]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Saved Charts Limit:</span>
                      <span className="font-semibold">{subscription.maxSavedCharts}</span>
                    </div>
                  </div>
                </div>

                {/* Feature entitlement checks */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle className={`w-4 h-4 ${subscription.allow100YearTimeline ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span>100-Year Timeline Calculations</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle className={`w-4 h-4 ${subscription.allowComparison ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span>Chart Comparison Engine</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle className={`w-4 h-4 ${subscription.allowExport ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span>High-Resolution Chart Export</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-400 font-bold text-xs">
                  Full Access Active
                </span>
                <p className="text-xs text-slate-400 mt-2">All numerology features are fully unlocked.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Active Device & Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Session & Device Card (Section 4.2 Single-Device) */}
        <div className="bg-navy-900 border border-navy-700/80 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-navy-800">
            <Smartphone className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Active Device Session</h2>
          </div>

          {activeSession ? (
            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex justify-between items-center p-3 rounded-xl bg-navy-950 border border-navy-800">
                <div>
                  <span className="font-semibold text-white block">Current Device</span>
                  <span className="text-slate-400 text-[11px] font-mono truncate max-w-xs block">
                    {activeSession.deviceInfo || 'Standard Web Browser'}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Active
                </span>
              </div>

              <div className="space-y-1.5 px-1">
                <div className="flex justify-between text-slate-400">
                  <span>Session Created:</span>
                  <span className="font-mono text-slate-300">{activeSession.createdAt.split('T')[0]}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>30-Day Expiry Date:</span>
                  <span className="font-mono text-emerald-400">{activeSession.expiresAt.split('T')[0]}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 italic">
                Only one authenticated device is permitted simultaneously. Signing in on another mobile or laptop will terminate this session automatically.
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Session information loading...</p>
          )}
        </div>

        {/* Saved Charts & Activity Overview (Section 6.4) */}
        <div className="bg-navy-900 border border-navy-700/80 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-navy-800">
            <div className="flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-gold-400" />
              <h2 className="text-base font-bold text-white">My Charts & Activity</h2>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-navy-800 text-slate-300 border border-navy-700">
              {chartStats ? `${chartStats.total_saved_charts} Saved` : '0 Saved'}
            </span>
          </div>

          {recentCharts.length > 0 ? (
            <div className="space-y-2">
              {recentCharts.map((chart) => (
                <div
                  key={chart.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-navy-950 border border-navy-800 text-xs"
                >
                  <div>
                    <span className="font-semibold text-white block">{chart.person_name}</span>
                    <span className="text-[11px] text-slate-400 font-mono">DOB: {chart.date_of_birth}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {chart.created_at.split('T')[0]}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-slate-400">
              No saved charts found yet. Generate a chart and click "Save Chart" to store it in your repository.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
