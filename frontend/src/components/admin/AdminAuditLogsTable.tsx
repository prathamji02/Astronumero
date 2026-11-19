import React from 'react';

interface Props {
  logs: any[];
  formatDate: (str: string) => string;
}

export const AdminAuditLogsTable: React.FC<Props> = ({ logs, formatDate }) => {
  return (
    <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700/80 rounded-2xl p-6 shadow-sm space-y-4">
      <h3 className="text-base font-bold text-slate-900 dark:text-white">Administrative Audit Trail</h3>
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-navy-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-navy-950 text-slate-500 dark:text-slate-400 uppercase font-mono text-[10px] border-b border-slate-200 dark:border-navy-800">
            <tr>
              <th className="py-3 px-3">Timestamp (DD-MM-YYYY)</th>
              <th className="py-3 px-3">Action</th>
              <th className="py-3 px-3">Actor</th>
              <th className="py-3 px-3">Target</th>
              <th className="py-3 px-3">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-navy-800/60 font-mono">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-400">
                  No audit logs recorded yet.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-navy-800/30 text-slate-700 dark:text-slate-300">
                  <td className="py-2.5 px-3 text-[11px] text-slate-500">
                    {formatDate(log.created_at)}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-navy-950 text-emerald-700 dark:text-emerald-400 border border-slate-200 dark:border-navy-800">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-900 dark:text-white font-semibold">{log.actor_email || 'System'}</td>
                  <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">
                    {log.target_type}: {log.target_id?.slice(0, 8)}...
                  </td>
                  <td className="py-2.5 px-3 text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">
                    {log.details_json}
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
