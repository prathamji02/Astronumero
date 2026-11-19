import React, { useState } from 'react';
import { apiRequest, setStoredSessionToken } from '../services/api.ts';
import type { User, UserSubscription } from '../types/index.ts';
import { Mail, Phone, Lock, Sparkles, Shield, X, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User, subscription: UserSubscription | null) => void;
}

export const AuthModal: React.FC<Props> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [mode, setMode] = useState<'otp' | 'admin'>('otp');
  const [channel, setChannel] = useState<'email' | 'sms'>('email');
  const [identifier, setIdentifier] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [loading, setLoading] = useState(false);
  const [receivedDevCode, setReceivedDevCode] = useState<string | null>(null);
  const [deliveredLive, setDeliveredLive] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  if (!isOpen) return null;

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setMessage({ text: 'Please enter your email address or mobile phone number.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage(null);
    setReceivedDevCode(null);

    try {
      const res = await apiRequest<{ success: boolean; message: string; devCode?: string; deliveredLive?: boolean }>(
        '/auth/otp/request',
        {
          method: 'POST',
          body: JSON.stringify({ identifier: identifier.trim(), channel }),
        }
      );

      setStep('verify');
      setReceivedDevCode(res.devCode || null);
      setDeliveredLive(Boolean(res.deliveredLive));
      setMessage({
        text: res.deliveredLive
          ? `A 6-digit OTP code has been dispatched to ${identifier.trim()}. Please check your email inbox and spam folder.`
          : `Verification code generated for ${identifier.trim()}. If email delivery is delayed, use the verification code below to log in.`,
        type: 'success',
      });
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to request OTP code.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      setMessage({ text: 'Please enter the 6-digit OTP verification code.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await apiRequest<{
        success: boolean;
        sessionToken: string;
        user: User;
        subscription: UserSubscription | null;
      }>('/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({
          identifier: identifier.trim(),
          code: otpCode.trim(),
          fullName: fullName.trim() || undefined,
          deviceInfo: navigator.userAgent,
        }),
      });

      setStoredSessionToken(res.sessionToken);
      onLoginSuccess(res.user, res.subscription);
      onClose();
    } catch (err: any) {
      setMessage({ text: err.message || 'OTP verification failed.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !adminPassword) {
      setMessage({ text: 'Please provide administrator email and password.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await apiRequest<{
        success: boolean;
        sessionToken: string;
        user: User;
      }>('/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({
          email: identifier.trim(),
          password: adminPassword,
          deviceInfo: navigator.userAgent,
        }),
      });

      setStoredSessionToken(res.sessionToken);
      onLoginSuccess(res.user, null);
      onClose();
    } catch (err: any) {
      setMessage({ text: err.message || 'Admin authentication failed.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="bg-navy-900 border border-navy-700 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full hover:bg-navy-800 transition"
          aria-label="Close authentication window"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tab Switcher: User OTP vs Admin Login */}
        <div className="flex bg-navy-950 p-1 rounded-xl mb-6 border border-navy-800">
          <button
            type="button"
            onClick={() => {
              setMode('otp');
              setStep('request');
              setReceivedDevCode(null);
              setOtpCode('');
              setMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              mode === 'otp' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            User OTP Login
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('admin');
              setReceivedDevCode(null);
              setOtpCode('');
              setMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              mode === 'admin' ? 'bg-gold-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Admin Portal Login
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
            {mode === 'otp' ? <Sparkles className="w-6 h-6" /> : <Shield className="w-6 h-6 text-gold-400" />}
          </div>
          <h2 id="auth-modal-title" className="text-2xl font-bold text-white tracking-tight">
            {mode === 'otp'
              ? step === 'request'
                ? 'Sign in with OTP'
                : 'Verify Code'
              : 'Administrator Access'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'otp'
              ? 'Passwordless, secure authentication with single-device protection.'
              : 'Sign in to the Predefined Super Administrator console.'}
          </p>
        </div>

        {/* Alert / Notification message */}
        {message && (
          <div
            className={`p-3 rounded-xl mb-5 text-xs flex items-start gap-2.5 ${
              message.type === 'error'
                ? 'bg-rose-950/60 border border-rose-800 text-rose-300'
                : 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
            }`}
            role="alert"
          >
            {message.type === 'error' ? (
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            )}
            <div>{message.text}</div>
          </div>
        )}

        {/* User OTP Form */}
        {mode === 'otp' ? (
          step === 'request' ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              {/* Channel Selector */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setChannel('email')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-medium transition ${
                    channel === 'email'
                      ? 'bg-navy-800 border-emerald-500 text-emerald-400'
                      : 'border-navy-700 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  Email OTP
                </button>
                <button
                  type="button"
                  onClick={() => setChannel('sms')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-medium transition ${
                    channel === 'sms'
                      ? 'bg-navy-800 border-emerald-500 text-emerald-400'
                      : 'border-navy-700 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  <Phone className="w-4 h-4" />
                  SMS Mobile OTP
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {channel === 'email' ? 'Email Address' : 'Mobile Phone Number'}
                </label>
                <input
                  type={channel === 'email' ? 'email' : 'tel'}
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={channel === 'email' ? 'you@domain.com' : '+1234567890'}
                  className="w-full px-4 py-2.5 bg-navy-950 border border-navy-700 rounded-xl text-white text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="text-[11px] text-slate-400 leading-relaxed bg-navy-950/40 p-3 rounded-xl border border-navy-800">
                🔒 <strong>Single-Device Security:</strong> Signing in will automatically log out any other active device to guarantee your chart privacy.
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition"
              >
                {loading ? 'Sending OTP...' : 'Send Verification Code'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {receivedDevCode && (
                <div className="p-3 rounded-xl bg-navy-950 border border-emerald-500/40 text-xs flex items-center justify-between gap-3 shadow-inner">
                  <div>
                    <span className="text-slate-400">Verification Code:</span>{' '}
                    <code className="text-amber-300 font-mono font-bold text-sm bg-navy-900 px-2 py-0.5 rounded border border-amber-500/40">
                      {receivedDevCode}
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOtpCode(receivedDevCode)}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[11px] transition shadow"
                  >
                    Auto-fill
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Enter 6-Digit Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  className="w-full px-4 py-2.5 bg-navy-950 border border-navy-700 rounded-xl text-white text-center font-mono text-xl tracking-widest focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              {receivedDevCode && otpCode !== receivedDevCode && (
                <button
                  type="button"
                  onClick={() => setOtpCode(receivedDevCode)}
                  className="w-full text-center text-[11px] text-amber-400 hover:text-amber-300 underline font-medium"
                >
                  Didn't receive email? Click here to fill code ({receivedDevCode})
                </button>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Your Full Name (Optional for first-time login)
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-2.5 bg-navy-950 border border-navy-700 rounded-xl text-white text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('request')}
                  className="flex-1 py-2.5 bg-navy-800 text-slate-300 text-xs font-semibold rounded-xl hover:bg-navy-700 transition"
                >
                  Change Email / Phone
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition"
                >
                  {loading ? 'Verifying...' : 'Complete Login'}
                </button>
              </div>
            </form>
          )
        ) : (
          /* Admin Login Form */
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Administrator Email
              </label>
              <input
                type="email"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter administrator email"
                className="w-full px-4 py-2.5 bg-navy-950 border border-navy-700 rounded-xl text-white text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Administrator Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-2.5 bg-navy-950 border border-navy-700 rounded-xl text-white text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gold-600 hover:bg-gold-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-gold-600/30 transition"
            >
              {loading ? 'Authenticating...' : 'Sign In as Administrator'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
