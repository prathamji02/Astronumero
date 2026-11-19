import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api.ts';
import {
  Shield,
  Users,
  CreditCard,
  Bookmark,
  Activity,
  Search,
  LogOut,
  UserX,
  UserCheck,
  Gift,
  RefreshCw,
  UserPlus,
  X,
  Check,
  Mail,
  Send,
  Eye,
  FileText,
  Clock,
  Sparkles,
  KeyRound,
  Copy,
  AlertCircle,
} from 'lucide-react';

function formatToDDMMYYYY(dateStr: string): string {
  if (!dateStr) return '';
  const clean = String(dateStr).trim();
  const [dPart, tPart] = clean.split(/[T ]/);
  const parts = dPart.split('-');
  let formattedDate = dPart;
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      formattedDate = `${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[0]}`;
    } else if (parts[2].length === 4) {
      formattedDate = `${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[2]}`;
    }
  }
  if (tPart) {
    const timeClean = tPart.slice(0, 5);
    return `${formattedDate} ${timeClean}`;
  }
  return formattedDate;
}

export const AdminPortalView: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [emails, setEmails] = useState<any[]>([]);
  const [activeOtps, setActiveOtps] = useState<any[]>([]);
  const [copiedOtpId, setCopiedOtpId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'emails' | 'logs'>('users');

  // Register New Paid Client Modal State
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [newPlanSlug, setNewPlanSlug] = useState('pro-monthly');
  const [newDurationDays, setNewDurationDays] = useState('30');
  const [newPaymentNote, setNewPaymentNote] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  // Custom Mail Composer State
  const [composerOpen, setComposerOpen] = useState(false);
  const [composeRecipient, setComposeRecipient] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeLoading, setComposeLoading] = useState(false);
  const [composeFeedback, setComposeFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Email Viewer Modal State
  const [viewingEmail, setViewingEmail] = useState<any | null>(null);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [anRes, uRes, lRes, eRes, oRes] = await Promise.all([
        apiRequest<{ analytics: any }>('/admin/analytics').catch(() => ({ analytics: null })),
        apiRequest<{ users: any[] }>(`/admin/users?search=${encodeURIComponent(search)}&status=${statusFilter}`).catch(() => ({ users: [] })),
        apiRequest<{ logs: any[] }>('/admin/audit-logs').catch(() => ({ logs: [] })),
        apiRequest<{ emails: any[] }>('/admin/emails').catch(() => ({ emails: [] })),
        apiRequest<{ otps: any[] }>('/admin/active-otps').catch(() => ({ otps: [] })),
      ]);
      setAnalytics(anRes.analytics);
      setUsers(uRes.users || []);
      setAuditLogs(lRes.logs || []);
      setEmails(eRes.emails || []);
      setActiveOtps(oRes.otps || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [search, statusFilter]);

  const handleRevokeSessions = async (userId: string, email: string) => {
    if (!window.confirm(`Terminate all active login sessions for ${email}?`)) return;
    try {
      const res = await apiRequest<{ revokedCount: number }>(`/admin/users/${userId}/revoke-sessions`, {
        method: 'POST',
      });
      alert(`Terminated ${res.revokedCount} active session(s).`);
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to revoke sessions.');
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    if (!window.confirm(`Are you sure you want to change user status to "${nextStatus}"?`)) return;
    try {
      await apiRequest(`/admin/users/${userId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status: nextStatus, reason: 'Admin dashboard toggle' }),
      });
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to update user status.');
    }
  };

  const handleAssignPlan = async (userId: string, email: string) => {
    const planSlug = prompt(`Assign plan to ${email} (enter 'pro-monthly' or 'premium-annual'):`, 'pro-monthly');
    if (!planSlug) return;
    const durationDays = prompt('Enter duration in days:', '30');
    if (!durationDays) return;

    try {
      await apiRequest(`/admin/users/${userId}/assign-subscription`, {
        method: 'POST',
        body: JSON.stringify({
          planSlug: planSlug.trim(),
          durationDays: parseInt(durationDays, 10),
          reason: 'Complimentary Admin Assignment',
        }),
      });
      alert(`Plan ${planSlug} assigned successfully.`);
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to assign plan.');
    }
  };

  const handleRegisterClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newEmail.trim()) {
      setRegisterError('Full Name and Email are required.');
      return;
    }

    setRegisterLoading(true);
    setRegisterError(null);

    try {
      const res = await apiRequest<{ success: boolean; message: string }>('/admin/users/create', {
        method: 'POST',
        body: JSON.stringify({
          fullName: newFullName.trim(),
          email: newEmail.trim(),
          mobile: newMobile.trim() || undefined,
          planSlug: newPlanSlug,
          durationDays: parseInt(newDurationDays, 10) || 30,
          paymentNote: newPaymentNote.trim() || undefined,
        }),
      });

      alert(res.message);
      setRegisterModalOpen(false);
      setNewFullName('');
      setNewEmail('');
      setNewMobile('');
      setNewPaymentNote('');
      setNewDurationDays('30');
      // Reset filter so newly registered client is shown right at the top
      setSearch('');
      setStatusFilter('all');
      setActiveTab('users');
      fetchAdminData();
    } catch (err: any) {
      setRegisterError(err.message || 'Failed to register client.');
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleSendCustomMail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeRecipient.trim() || !composeSubject.trim() || !composeBody.trim()) {
      setComposeFeedback({ text: 'Recipient email, subject, and message body are required.', type: 'error' });
      return;
    }

    setComposeLoading(true);
    setComposeFeedback(null);
    try {
      const res = await apiRequest<{ success: boolean; message: string }>('/admin/emails/send', {
        method: 'POST',
        body: JSON.stringify({
          to: composeRecipient.trim(),
          toName: composeRecipient.split('@')[0],
          subject: composeSubject.trim(),
          message: composeBody.trim(),
        }),
      });

      alert(res.message);
      setComposerOpen(false);
      setComposeRecipient('');
      setComposeSubject('');
      setComposeBody('');
      fetchAdminData();
    } catch (err: any) {
      setComposeFeedback({ text: err.message || 'Failed to dispatch email.', type: 'error' });
    } finally {
      setComposeLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Admin Header */}
      <div className="bg-navy-900 border border-gold-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-gold-950 border border-gold-500/40 text-gold-400">
              <Shield className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-black text-white">Administrator Control Portal</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            TalktoNakshatra Super Administrator management console (Single-device session control, automated welcome emails, user registration, and communications).
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          className="inline-flex items-center gap-2 px-4 py-2 bg-navy-950 border border-navy-700 hover:border-slate-500 text-xs font-semibold rounded-xl text-slate-300 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Metrics
        </button>
      </div>

      {/* Analytics KPI Cards */}
      {analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-navy-900 border border-navy-700/80 rounded-2xl p-5 shadow-lg">
            <div className="flex justify-between items-center text-slate-400 mb-2">
              <span className="text-xs font-semibold">Total Users</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white">{analytics.totalUsers}</div>
            <span className="text-[11px] text-emerald-400 mt-1 block">
              {analytics.activeUsers} currently active
            </span>
          </div>

          <div className="bg-navy-900 border border-navy-700/80 rounded-2xl p-5 shadow-lg">
            <div className="flex justify-between items-center text-slate-400 mb-2">
              <span className="text-xs font-semibold">Active Subscriptions</span>
              <CreditCard className="w-4 h-4 text-gold-400" />
            </div>
            <div className="text-2xl font-black text-white">{analytics.activeSubscriptions}</div>
            <span className="text-[11px] text-slate-400 mt-1 block">Live paid &amp; trial plans</span>
          </div>

          <div className="bg-navy-900 border border-navy-700/80 rounded-2xl p-5 shadow-lg">
            <div className="flex justify-between items-center text-slate-400 mb-2">
              <span className="text-xs font-semibold">Emails Dispatched</span>
              <Mail className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-black text-white">{emails.length}</div>
            <span className="text-[11px] text-slate-400 mt-1 block">Welcome, OTP &amp; Custom</span>
          </div>

          <div className="bg-navy-900 border border-navy-700/80 rounded-2xl p-5 shadow-lg">
            <div className="flex justify-between items-center text-slate-400 mb-2">
              <span className="text-xs font-semibold">System Security</span>
              <Shield className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-sm font-bold text-white">Single-Device Active</div>
            <span className="text-[11px] text-slate-400 mt-1 block">30-day strict expiry</span>
          </div>
        </div>
      )}

      {/* Tabs Switcher: Users vs Mail vs Audit Logs */}
      <div className="flex flex-wrap gap-2 border-b border-navy-800 pb-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'users' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white hover:bg-navy-800'
            }`}
        >
          User Accounts Management ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('emails')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${activeTab === 'emails' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white hover:bg-navy-800'
            }`}
        >
          <Mail className="w-3.5 h-3.5" />
          Mail &amp; Communications ({emails.length})
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'logs' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white hover:bg-navy-800'
            }`}
        >
          Audit Logs ({auditLogs.length})
        </button>
      </div>

      {/* Tab 1: User Management Table */}
      {activeTab === 'users' && (
        <div className="bg-navy-900 border border-navy-700/80 rounded-2xl p-6 shadow-xl space-y-4">
          {/* Filter & Action Bar */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, email, mobile..."
                  className="w-full pl-9 pr-4 py-2 bg-navy-950 border border-navy-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold">Filter:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 bg-navy-950 border border-navy-700 rounded-xl text-xs text-white outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="deactivated">Deactivated</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setRegisterError(null);
                setRegisterModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950 transition self-stretch sm:self-auto justify-center"
            >
              <UserPlus className="w-4 h-4" />
              + Register Paid Client
            </button>
          </div>

          {/* User count & filter summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-slate-400 px-1 gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-300">
                All Registered Users: <strong className="text-emerald-400 font-mono text-sm">{users.length}</strong>
              </span>
              {search && (
                <span className="bg-navy-950 border border-navy-700 px-2 py-0.5 rounded text-[11px] text-slate-300 flex items-center gap-1.5">
                  Filtered by: <span className="text-white font-semibold">"{search}"</span>
                  <button
                    onClick={() => setSearch('')}
                    className="text-rose-400 hover:text-white font-bold ml-1"
                    title="Clear filter"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Live Real-Time Directory
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-navy-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-navy-950 text-slate-400 uppercase font-mono text-[10px] border-b border-navy-800">
                <tr>
                  <th className="py-3 px-3">User</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Current Plan</th>
                  <th className="py-3 px-3">Saved Charts</th>
                  <th className="py-3 px-3">Active Sessions</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800/60">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="w-8 h-8 text-slate-500" />
                        <p className="font-semibold text-slate-300">No registered accounts found</p>
                        {search ? (
                          <button
                            type="button"
                            onClick={() => setSearch('')}
                            className="text-xs text-emerald-400 hover:underline"
                          >
                            Clear search filter "{search}"
                          </button>
                        ) : (
                          <p className="text-xs text-slate-500">No users match the selected status filter.</p>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-navy-800/30">
                      <td className="py-3 px-3">
                        <div className="font-bold text-white">{u.full_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{u.email || u.mobile || 'No contact'}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${u.role === 'super_admin' ? 'bg-gold-950 text-gold-400 border border-gold-800' : 'text-slate-300'
                          }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${u.status === 'active'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white">{u.current_plan_name || 'No Active Plan'}</div>
                        {u.subscription_end_date && (
                          <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                            Expires: {formatToDDMMYYYY(u.subscription_end_date)}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300">{u.saved_charts_count}</td>
                      <td className="py-3 px-3 font-mono">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.active_sessions_count > 0
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-900'
                          : 'text-slate-500'
                          }`}>
                          {u.active_sessions_count} active
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {u.role !== 'super_admin' && (
                            <>
                              <button
                                onClick={() => handleToggleUserStatus(u.id, u.status)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800"
                                title={u.status === 'active' ? 'Suspend User' : 'Activate User'}
                              >
                                {u.status === 'active' ? <UserX className="w-3.5 h-3.5 text-rose-400" /> : <UserCheck className="w-3.5 h-3.5 text-emerald-400" />}
                              </button>
                              <button
                                onClick={() => handleRevokeSessions(u.id, u.email || u.full_name)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-navy-800"
                                title="Force Logout / Revoke Active Sessions"
                              >
                                <LogOut className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleAssignPlan(u.id, u.email || u.full_name)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-gold-400 hover:bg-navy-800"
                                title="Assign Complimentary Plan"
                              >
                                <Gift className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Mail & Communications (Requirement 6) */}
      {activeTab === 'emails' && (
        <div className="bg-navy-900 border border-navy-700/80 rounded-2xl p-6 shadow-xl space-y-6">
          {/* Active OTP Verification Live Monitor */}
          <div className="bg-navy-950 border border-amber-500/30 rounded-2xl p-5 space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  Live OTP Verification Codes Feed
                </h4>
                <p className="text-[11px] text-slate-400">
                  Real-time OTP verification codes generated for login. Use this to verify or assist clients directly if email delivery is delayed.
                </p>
              </div>
              <span className="text-[11px] text-amber-400 font-mono bg-amber-950/60 border border-amber-800/60 px-2.5 py-1 rounded-lg">
                {activeOtps.filter((o) => !o.isUsed && !o.isExpired).length} Active Codes
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-navy-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-navy-900 text-slate-400 uppercase font-mono text-[10px] border-b border-navy-800">
                  <tr>
                    <th className="py-2.5 px-3">Contact Identifier</th>
                    <th className="py-2.5 px-3">Channel</th>
                    <th className="py-2.5 px-3">Verification Code</th>
                    <th className="py-2.5 px-3">Generated (DD-MM-YYYY)</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Copy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-800/60 font-mono">
                  {activeOtps.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-500">
                        No recent OTP verification requests recorded.
                      </td>
                    </tr>
                  ) : (
                    activeOtps.map((otp) => (
                      <tr key={otp.id} className="hover:bg-navy-800/30 text-slate-300">
                        <td className="py-2.5 px-3 font-semibold text-white">
                          {otp.identifier}
                        </td>
                        <td className="py-2.5 px-3 uppercase text-[10px]">
                          <span
                            className={`px-2 py-0.5 rounded font-bold ${otp.channel === 'email'
                              ? 'bg-sky-950 text-sky-400 border border-sky-800'
                              : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              }`}
                          >
                            {otp.channel}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <code className="text-amber-300 font-mono font-bold text-sm bg-navy-900 px-2 py-0.5 rounded border border-amber-500/40 tracking-wider">
                            {otp.code}
                          </code>
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-slate-400">
                          {formatToDDMMYYYY(otp.createdAt)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${otp.isUsed
                              ? 'bg-slate-800 text-slate-400 border border-slate-700'
                              : otp.isExpired
                                ? 'bg-rose-950 text-rose-400 border border-rose-900'
                                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              }`}
                          >
                            {otp.isUsed ? 'Used' : otp.isExpired ? 'Expired' : 'Active'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(otp.code);
                              setCopiedOtpId(otp.id);
                              setTimeout(() => setCopiedOtpId(null), 2000);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-navy-900 hover:bg-navy-800 text-amber-400 border border-navy-700 text-[11px] transition"
                            title="Copy 6-digit OTP code to clipboard"
                          >
                            {copiedOtpId === otp.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400 font-bold">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Email Action Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-navy-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-sky-400" />
                Dispatched Communications Log
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                History of automated welcome emails, OTP verifications, and custom communications sent to registered users.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setComposerOpen(!composerOpen);
                setComposeFeedback(null);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-lg transition"
            >
              <Send className="w-3.5 h-3.5" />
              {composerOpen ? 'Close Composer' : '+ Compose Custom Email'}
            </button>
          </div>

          {/* Inline Email Composer */}
          {composerOpen && (
            <div className="bg-navy-950 border border-sky-500/30 rounded-2xl p-5 space-y-4 animate-in fade-in">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sky-400" />
                  Compose &amp; Dispatch Custom Email
                </h4>
                <button
                  onClick={() => setComposerOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {composeFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs ${composeFeedback.type === 'error'
                    ? 'bg-rose-950/60 border border-rose-800 text-rose-300'
                    : 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                    }`}
                >
                  {composeFeedback.text}
                </div>
              )}

              <form onSubmit={handleSendCustomMail} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Recipient Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={composeRecipient}
                      onChange={(e) => setComposeRecipient(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full px-3 py-2 bg-navy-900 border border-navy-700 rounded-xl text-white outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Subject <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={composeSubject}
                      onChange={(e) => setComposeSubject(e.target.value)}
                      placeholder="Welcome / Updates from TalktoNakshatra"
                      className="w-full px-3 py-2 bg-navy-900 border border-navy-700 rounded-xl text-white outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Message Body <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                    placeholder="Write your email message here..."
                    className="w-full px-3 py-2 bg-navy-900 border border-navy-700 rounded-xl text-white outline-none focus:border-sky-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setComposerOpen(false)}
                    className="px-4 py-2 bg-navy-900 text-slate-300 rounded-xl hover:bg-navy-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={composeLoading}
                    className="px-5 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold rounded-xl transition flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {composeLoading ? 'Sending...' : 'Send Mail'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Emails History Table */}
          <div className="overflow-x-auto rounded-xl border border-navy-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-navy-950 text-slate-400 uppercase font-mono text-[10px] border-b border-navy-800">
                <tr>
                  <th className="py-3 px-3">Date (DD-MM-YYYY)</th>
                  <th className="py-3 px-3">Recipient</th>
                  <th className="py-3 px-3">Subject</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800/60 font-mono">
                {emails.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No emails sent yet. Newly registered users will receive an automated welcome email.
                    </td>
                  </tr>
                ) : (
                  emails.map((email) => (
                    <tr key={email.id} className="hover:bg-navy-800/30 text-slate-300">
                      <td className="py-3 px-3 text-[11px] text-slate-400">
                        {formatToDDMMYYYY(email.created_at || email.sent_at)}
                      </td>
                      <td className="py-3 px-3 font-semibold text-white">
                        {email.recipient_email}
                      </td>
                      <td className="py-3 px-3 text-slate-300 max-w-xs truncate">
                        {email.subject}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${email.email_type === 'welcome'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : email.email_type === 'otp'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-sky-950 text-sky-400 border border-sky-800'
                          }`}>
                          {email.email_type}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${email.status === 'sent'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-900'
                          : email.status === 'simulated_dev'
                            ? 'bg-blue-950 text-blue-300 border border-blue-900'
                            : 'bg-rose-950 text-rose-400 border border-rose-900'
                          }`}>
                          {email.status === 'simulated_dev' ? 'Dev Recorded' : email.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => setViewingEmail(email)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-navy-950 hover:bg-navy-800 text-sky-400 border border-navy-700 transition"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Audit Logs Table */}
      {activeTab === 'logs' && (
        <div className="bg-navy-900 border border-navy-700/80 rounded-2xl p-6 shadow-xl">
          <h3 className="text-base font-bold text-white mb-4">Administrative Audit Trail</h3>
          <div className="overflow-x-auto rounded-xl border border-navy-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-navy-950 text-slate-400 uppercase font-mono text-[10px] border-b border-navy-800">
                <tr>
                  <th className="py-3 px-3">Timestamp (DD-MM-YYYY)</th>
                  <th className="py-3 px-3">Action</th>
                  <th className="py-3 px-3">Actor</th>
                  <th className="py-3 px-3">Target</th>
                  <th className="py-3 px-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800/60 font-mono">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-navy-800/30 text-slate-300">
                    <td className="py-2.5 px-3 text-[11px] text-slate-500">
                      {formatToDDMMYYYY(log.created_at)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-navy-950 text-emerald-400 border border-navy-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-white">{log.actor_email || 'System'}</td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {log.target_type}: {log.target_id?.slice(0, 8)}...
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-400 truncate max-w-xs">
                      {log.details_json}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Register Paid Client Modal */}
      {registerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm">
          <div className="bg-navy-900 border border-navy-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-navy-800">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800">
                  <UserPlus className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">Register Paid Client</h3>
                  <p className="text-[11px] text-slate-400">
                    Create client account, activate subscription &amp; send automated welcome email.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRegisterModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-navy-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {registerError && (
              <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-700 text-rose-200 text-xs space-y-2.5">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div className="font-medium leading-relaxed">{registerError}</div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const emailToSearch = newEmail.trim();
                      setRegisterModalOpen(false);
                      setRegisterError(null);
                      setActiveTab('users');
                      setStatusFilter('all');
                      setSearch(emailToSearch);
                    }}
                    className="px-3 py-1.5 bg-rose-900 hover:bg-rose-800 text-white font-bold rounded-lg text-xs transition border border-rose-600 shadow inline-flex items-center gap-1.5"
                  >
                    View Account in Management Table →
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleRegisterClient} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Client Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 bg-navy-950 border border-navy-700 rounded-xl text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="client@example.com (will receive welcome mail)"
                  className="w-full px-3 py-2 bg-navy-950 border border-navy-700 rounded-xl text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Mobile Number (Optional)
                </label>
                <input
                  type="text"
                  value={newMobile}
                  onChange={(e) => setNewMobile(e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full px-3 py-2 bg-navy-950 border border-navy-700 rounded-xl text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Subscription Plan
                  </label>
                  <select
                    value={newPlanSlug}
                    onChange={(e) => setNewPlanSlug(e.target.value)}
                    className="w-full px-3 py-2 bg-navy-950 border border-navy-700 rounded-xl text-white outline-none focus:border-emerald-500"
                  >
                    <option value="pro-monthly">Pro (Monthly)</option>
                    <option value="premium-annual">Premium (Annual)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Duration (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="36500"
                    required
                    value={newDurationDays}
                    onChange={(e) => setNewDurationDays(e.target.value)}
                    className="w-full px-3 py-2 bg-navy-950 border border-navy-700 rounded-xl text-white outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Payment Reference / Internal Note
                </label>
                <input
                  type="text"
                  value={newPaymentNote}
                  onChange={(e) => setNewPaymentNote(e.target.value)}
                  placeholder="e.g. Paid via UPI / Bank Transfer / Cash"
                  className="w-full px-3 py-2 bg-navy-950 border border-navy-700 rounded-xl text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-navy-950/50 border border-navy-800 text-[11px] text-slate-400">
                💡 <strong>Automated Delivery:</strong> As soon as you click <em>Register Client</em>, an automated welcome email will be dispatched to their address with complete login guidance. The record will also appear under the <em>Mail</em> tab!
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRegisterModalOpen(false)}
                  className="flex-1 py-2.5 bg-navy-800 hover:bg-navy-700 text-slate-300 font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registerLoading}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition"
                >
                  {registerLoading ? 'Registering...' : 'Register Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Email Preview Modal */}
      {viewingEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm">
          <div className="bg-navy-900 border border-navy-700 rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-navy-800">
              <div>
                <h3 className="text-base font-bold text-white">{viewingEmail.subject}</h3>
                <div className="text-xs text-slate-400 mt-0.5">
                  To: <span className="text-white font-semibold">{viewingEmail.recipient_email}</span> | Sent: {formatToDDMMYYYY(viewingEmail.created_at || viewingEmail.sent_at)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingEmail(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-navy-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-navy-950 rounded-xl p-4 border border-navy-800 text-xs">
              {(viewingEmail.body_html || viewingEmail.html_content) ? (
                <div
                  className="prose prose-invert max-w-none text-slate-200"
                  dangerouslySetInnerHTML={{ __html: viewingEmail.body_html || viewingEmail.html_content }}
                />
              ) : (
                <pre className="whitespace-pre-wrap font-sans text-slate-200">
                  {viewingEmail.body_text || viewingEmail.text_content}
                </pre>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewingEmail(null)}
                className="px-5 py-2 bg-navy-800 hover:bg-navy-700 text-white text-xs font-bold rounded-xl transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
