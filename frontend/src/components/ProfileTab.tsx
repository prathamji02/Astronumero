import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api.ts';
import type { User, UserProfile, UserSubscription } from '../types/index.ts';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { ProfileHeader } from './profile/ProfileHeader.tsx';
import { ProfilePersonalInfoCard } from './profile/ProfilePersonalInfoCard.tsx';
import { ProfileBirthDetailsCard } from './profile/ProfileBirthDetailsCard.tsx';
import { ProfileSubscriptionCard } from './profile/ProfileSubscriptionCard.tsx';
import { ProfileDeviceAndActivityCards } from './profile/ProfileDeviceAndActivityCards.tsx';

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

  return (
    <div className="max-w-6xl w-full mx-auto space-y-8 pb-12">
      {/* Top Banner */}
      <ProfileHeader user={user} />

      {feedback && (
        <div
          className={`p-4 sm:p-5 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-3 shadow-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-100 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Grid: 3 Main Cards (Personal, Birth/Numerology, Plan) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ProfilePersonalInfoCard
          user={user}
          fullName={fullName}
          setFullName={setFullName}
          timezone={timezone}
          setTimezone={setTimezone}
          language={language}
          setLanguage={setLanguage}
          onSavePersonal={handleSavePersonal}
          savingPersonal={savingPersonal}
        />

        <ProfileBirthDetailsCard
          profile={profile}
          dob={dob}
          setDob={setDob}
          tob={tob}
          setTob={setTob}
          pob={pob}
          setPob={setPob}
          onSaveBirth={handleSaveBirth}
          savingBirth={savingBirth}
        />

        <ProfileSubscriptionCard
          subscription={subscription}
          formatDate={formatToDDMMYYYY}
        />
      </div>

      {/* Bottom Section: Active Device & Recent Activity */}
      <ProfileDeviceAndActivityCards
        activeSession={activeSession}
        chartStats={chartStats}
        recentCharts={recentCharts}
        formatDate={formatToDDMMYYYY}
      />
    </div>
  );
};
