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
} from 'lucide-react';

export const AdminPortalView: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'logs'>('users');

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [anRes, uRes, lRes] = await Promise.all([
        apiRequest<{ analytics: any }>('/admin/analytics'),
        apiRequest<{ users: any[] }>(`/admin/users?search=${encodeURIComponent(search)}&status=${statusFilter}`),
        apiRequest<{ logs: any[] }>('/admin/audit-logs'),
      ]);
      setAnalytics(anRes.analytics);
      setUsers(uRes.users || []);
      setAuditLogs(lRes.logs || []);
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
            Predefined Super Administrator management console (Single-device session control, RBAC & Audit logs).
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

      {/* Analytics KPI Cards (Section 23.4) */}
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
            <span className="text-[11px] text-slate-400 mt-1 block">Live paid & trial plans</span>
          </div>

          <div className="bg-navy-900 border border-navy-700/80 rounded-2xl p-5 shadow-lg">
            <div className="flex justify-between items-center text-slate-400 mb-2">
              <span className="text-xs font-semibold">Saved Charts</span>
              <Bookmark className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-2xl font-black text-white">{analytics.totalSavedCharts}</div>
            <span className="text-[11px] text-slate-400 mt-1 block">Stored in database</span>
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

      {/* Tabs Switcher: Users vs Audit Logs */}
      <div className="flex gap-2 border-b border-navy-800 pb-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'users' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white hover:bg-navy-800'
          }`}
        >
          User Accounts Management ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'logs' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white hover:bg-navy-800'
          }`}
        >
          Audit Logs ({auditLogs.length})
        </button>
      </div>

      {/* Tab 1: User Management Table (Section 23.2) */}
      {activeTab === 'users' ? (
        <div className="bg-navy-900 border border-navy-700/80 rounded-2xl p-6 shadow-xl space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
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
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-navy-800/30">
                    <td className="py-3 px-3">
                      <div className="font-bold text-white">{u.full_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{u.email || u.mobile || 'No contact'}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                        u.role === 'super_admin' ? 'bg-gold-950 text-gold-400 border border-gold-800' : 'text-slate-300'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        u.status === 'active'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {u.current_plan_name || 'No Active Plan'}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300">{u.saved_charts_count}</td>
                    <td className="py-3 px-3 font-mono">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.active_sessions_count > 0
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Tab 2: Audit Logs Table (Section 23.7) */
        <div className="bg-navy-900 border border-navy-700/80 rounded-2xl p-6 shadow-xl">
          <h3 className="text-base font-bold text-white mb-4">Administrative Audit Trail</h3>
          <div className="overflow-x-auto rounded-xl border border-navy-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-navy-950 text-slate-400 uppercase font-mono text-[10px] border-b border-navy-800">
                <tr>
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 px-3">Action</th>
                  <th className="py-3 px-3">Actor</th>
                  <th className="py-3 px-3">Target</th>
                  <th className="py-3 px-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800/60 font-mono">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-navy-800/30 text-slate-300">
                    <td className="py-2.5 px-3 text-[11px] text-slate-500">{log.created_at}</td>
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
    </div>
  );
};
