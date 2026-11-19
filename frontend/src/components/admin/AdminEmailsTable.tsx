import React from 'react';
import { Eye } from 'lucide-react';

interface Props {
  emails: any[];
  onViewEmail: (email: any) => void;
  formatDate: (str: string) => string;
}

export const AdminEmailsTable: React.FC<Props> = ({ emails, onViewEmail, formatDate }) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-navy-800">
      <table className="w-full text-left text-xs sm:text-sm">
        <thead className="bg-slate-50 dark:bg-navy-950 text-slate-500 dark:text-slate-400 uppercase font-mono text-xs border-b border-slate-200 dark:border-navy-800">
          <tr>
            <th className="py-3.5 px-3.5">Date (DD-MM-YYYY)</th>
            <th className="py-3.5 px-3.5">Recipient</th>
            <th className="py-3.5 px-3.5">Subject</th>
            <th className="py-3.5 px-3.5">Type</th>
            <th className="py-3.5 px-3.5">Status</th>
            <th className="py-3.5 px-3.5 text-right font-sans">View</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-navy-800/60 font-mono">
          {emails.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-8 text-center text-slate-400 font-sans">
                No emails sent yet. Newly registered users will receive an automated welcome email.
              </td>
            </tr>
          ) : (
            emails.map((email) => (
              <tr key={email.id} className="hover:bg-slate-50 dark:hover:bg-navy-800/30 text-slate-700 dark:text-slate-300">
                <td className="py-3.5 px-3.5 text-xs text-slate-500 dark:text-slate-400">
                  {formatDate(email.created_at || email.sent_at)}
                </td>
                <td className="py-3.5 px-3.5 font-semibold text-slate-900 dark:text-white">
                  {email.recipient_email}
                </td>
                <td className="py-3.5 px-3.5 text-slate-600 dark:text-slate-300 max-w-xs truncate font-sans">
                  {email.subject}
                </td>
                <td className="py-3.5 px-3.5 font-sans">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${
                      email.email_type === 'welcome'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                        : email.email_type === 'otp'
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                        : 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-400 border border-sky-300 dark:border-sky-800'
                    }`}
                  >
                    {email.email_type}
                  </span>
                </td>
                <td className="py-3.5 px-3.5 font-sans">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${
                      email.status === 'sent'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-900'
                        : email.status === 'simulated_dev'
                        ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-900'
                        : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-400 border border-rose-300 dark:border-rose-900'
                    }`}
                  >
                    {email.status === 'simulated_dev' ? 'Dev Recorded' : email.status}
                  </span>
                </td>
                <td className="py-3.5 px-3.5 text-right font-sans">
                  <button
                    type="button"
                    onClick={() => onViewEmail(email)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-navy-950 hover:bg-slate-200 dark:hover:bg-navy-800 text-sky-600 dark:text-sky-400 border border-slate-300 dark:border-navy-700 text-xs font-semibold transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
