import React from 'react';
import { Search, UserPlus, Users, UserX, UserCheck, LogOut, Gift } from 'lucide-react';

interface Props {
  users: any[];
  search: string;
  onSearchChange: (search: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onOpenRegisterModal: () => void;
  onToggleStatus: (userId: string, currentStatus: string) => void;
  onRevokeSessions: (userId: string, email: string) => void;
  onAssignPlan: (userId: string, email: string) => void;
  formatDate: (dateStr: string) => string;
}

export const AdminUserAccountsTable: React.FC<Props> = ({
  users,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onOpenRegisterModal,
  onToggleStatus,
  onRevokeSessions,
  onAssignPlan,
  formatDate,
}) => {
  return (
    <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700/80 rounded-2xl p-6 shadow-sm space-y-4">
      {/* Filter & Action Bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by name, email, mobile..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-navy-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 outline-none transition"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold">Filter:</span>
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-navy-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white outline-none transition"
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
          onClick={onOpenRegisterModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition self-stretch sm:self-auto justify-center"
        >
          <UserPlus className="w-4 h-4" />
          + Register Paid Client
        </button>
      </div>

      {/* Directory count and filter state */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-slate-500 dark:text-slate-400 px-1 gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            All Registered Users: <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">{users.length}</strong>
          </span>
          {search && (
            <span className="bg-slate-100 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 px-2 py-0.5 rounded text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              Filtered by: <span className="font-semibold">"{search}"</span>
              <button
                onClick={() => onSearchChange('')}
                className="text-rose-500 hover:text-rose-700 font-bold ml-1"
                title="Clear filter"
              >
                ×
              </button>
            </span>
          )}
        </div>
        <div className="text-[11px] text-slate-400 font-mono">
          Live Directory
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-navy-800">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-50 dark:bg-navy-950 text-slate-500 dark:text-slate-400 uppercase font-mono text-xs border-b border-slate-200 dark:border-navy-800">
            <tr>
              <th className="py-3.5 px-3.5">User</th>
              <th className="py-3.5 px-3.5">Role</th>
              <th className="py-3.5 px-3.5">Status</th>
              <th className="py-3.5 px-3.5">Current Plan</th>
              <th className="py-3.5 px-3.5">Saved Charts</th>
              <th className="py-3.5 px-3.5">Active Sessions</th>
              <th className="py-3.5 px-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-navy-800/60">
            {users.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Users className="w-10 h-10 text-slate-400 dark:text-slate-600" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm sm:text-base">No registered accounts found</p>
                    {search ? (
                      <button
                        type="button"
                        onClick={() => onSearchChange('')}
                        className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        Clear search filter "{search}"
                      </button>
                    ) : (
                      <p className="text-xs sm:text-sm text-slate-400">No accounts match the selected status filter.</p>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-navy-800/30">
                  <td className="py-3.5 px-3.5">
                    <div className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">{u.full_name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{u.email || u.mobile || 'No contact'}</div>
                  </td>
                  <td className="py-3.5 px-3.5">
                    <span className={`px-2.5 py-1 rounded font-mono text-xs font-bold ${
                      u.role === 'super_admin' ? 'bg-amber-100 dark:bg-gold-950 text-amber-800 dark:text-gold-400 border border-amber-300 dark:border-gold-800' : 'text-slate-600 dark:text-slate-300'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-3.5">
                    <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase ${
                      u.status === 'active'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                        : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-400 border border-rose-300 dark:border-rose-800'
                    }`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-3.5">
                    <div className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">{u.current_plan_name || 'No Active Plan'}</div>
                    {u.subscription_end_date && (
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                        Expires: {formatDate(u.subscription_end_date)}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-3.5 font-mono text-slate-700 dark:text-slate-300 font-semibold">{u.saved_charts_count}</td>
                  <td className="py-3.5 px-3.5 font-mono">
                    <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                      u.active_sessions_count > 0
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-900'
                        : 'text-slate-400'
                    }`}>
                      {u.active_sessions_count} active
                    </span>
                  </td>
                  <td className="py-3.5 px-3.5 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {u.role !== 'super_admin' && (
                        <>
                          <button
                            onClick={() => onToggleStatus(u.id, u.status)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800 transition"
                            title={u.status === 'active' ? 'Suspend User' : 'Activate User'}
                          >
                            {u.status === 'active' ? <UserX className="w-3.5 h-3.5 text-rose-500" /> : <UserCheck className="w-3.5 h-3.5 text-emerald-500" />}
                          </button>
                          <button
                            onClick={() => onRevokeSessions(u.id, u.email || u.full_name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-navy-800 transition"
                            title="Force Logout / Revoke Active Sessions"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onAssignPlan(u.id, u.email || u.full_name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-navy-800 transition"
                            title="Assign Complimentary Plan"
                          >
                            <Gift className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
