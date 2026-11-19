import React, { useState } from 'react';
import { KeyRound, Check, Copy } from 'lucide-react';

interface Props {
  activeOtps: any[];
  formatDate: (str: string) => string;
}

export const AdminActiveOtpsFeed: React.FC<Props> = ({ activeOtps, formatDate }) => {
  const [copiedOtpId, setCopiedOtpId] = useState<string | null>(null);

  const handleCopy = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedOtpId(id);
    setTimeout(() => setCopiedOtpId(null), 2000);
  };

  const liveActiveCount = activeOtps.filter((o) => !o.isUsed && !o.isExpired).length;

  return (
    <div className="bg-slate-50 dark:bg-navy-950 border border-amber-300 dark:border-amber-500/30 rounded-2xl p-5 space-y-3 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-amber-500" />
            Live OTP Verification Codes Feed
          </h4>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time OTP verification codes generated for login. Use this to verify or assist clients directly if email delivery is delayed.
          </p>
        </div>
        <span className="text-xs text-amber-800 dark:text-amber-400 font-mono bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800/60 px-3 py-1.5 rounded-xl font-bold">
          {liveActiveCount} Active Codes
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-navy-800">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-white dark:bg-navy-900 text-slate-500 dark:text-slate-400 uppercase font-mono text-xs border-b border-slate-200 dark:border-navy-800">
            <tr>
              <th className="py-3 px-3.5">Contact Identifier</th>
              <th className="py-3 px-3.5">Channel</th>
              <th className="py-3 px-3.5">Verification Code</th>
              <th className="py-3 px-3.5">Generated (DD-MM-YYYY)</th>
              <th className="py-3 px-3.5">Status</th>
              <th className="py-3 px-3.5 text-right">Copy</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-navy-800/60 font-mono">
            {activeOtps.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  No recent OTP verification requests recorded.
                </td>
              </tr>
            ) : (
              activeOtps.map((otp) => (
                <tr key={otp.id} className="hover:bg-slate-100 dark:hover:bg-navy-800/30 text-slate-700 dark:text-slate-300">
                  <td className="py-3 px-3.5 font-semibold text-slate-900 dark:text-white">
                    {otp.identifier}
                  </td>
                  <td className="py-3 px-3.5 uppercase text-xs">
                    <span
                      className={`px-2.5 py-1 rounded-lg font-bold ${
                        otp.channel === 'email'
                          ? 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-400 border border-sky-300 dark:border-sky-800'
                          : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                      }`}
                    >
                      {otp.channel}
                    </span>
                  </td>
                  <td className="py-3 px-3.5">
                    <code className="text-amber-800 dark:text-amber-300 font-mono font-bold text-base bg-white dark:bg-navy-900 px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-500/40 tracking-widest">
                      {otp.code}
                    </code>
                  </td>
                  <td className="py-3 px-3.5 text-xs text-slate-500 dark:text-slate-400">
                    {formatDate(otp.createdAt)}
                  </td>
                  <td className="py-3 px-3.5">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${
                        otp.isUsed
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                          : otp.isExpired
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-400 border border-rose-300 dark:border-rose-900'
                          : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      }`}
                    >
                      {otp.isUsed ? 'Used' : otp.isExpired ? 'Expired' : 'Active'}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleCopy(otp.id, otp.code)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-navy-900 hover:bg-slate-100 dark:hover:bg-navy-800 text-amber-700 dark:text-amber-400 border border-slate-300 dark:border-navy-700 text-xs font-semibold transition shadow-sm"
                      title="Copy 6-digit OTP code to clipboard"
                    >
                      {copiedOtpId === otp.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied</span>
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
  );
};
