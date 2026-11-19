import React from 'react';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';

interface Props {
  revocationNotice: string | null;
  onDismissRevocation: () => void;
  saveBannerMessage: string | null;
  onDismissSaveBanner: () => void;
  srAnnouncement: string;
}

export const AppAlerts: React.FC<Props> = ({
  revocationNotice,
  onDismissRevocation,
  saveBannerMessage,
  onDismissSaveBanner,
  srAnnouncement,
}) => {
  return (
    <>
      {/* Invisible live region for blind screen reader users */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {srAnnouncement}
      </div>

      {/* Session Revocation / Single-Device Enforcement Alert */}
      {revocationNotice && (
        <div
          role="alert"
          className="bg-amber-100 dark:bg-amber-950/90 border-b border-amber-300 dark:border-gold-800 px-4 py-2.5 text-amber-900 dark:text-gold-200 text-xs flex items-center justify-between shadow-sm"
        >
          <div className="flex items-center gap-2 max-w-5xl mx-auto">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 text-amber-600 dark:text-gold-400" />
            <span>
              <strong>Session Notice:</strong> {revocationNotice}
            </span>
          </div>
          <button
            onClick={onDismissRevocation}
            className="text-amber-800 dark:text-amber-400 hover:text-black dark:hover:text-white text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Chart Saved Banner */}
      {saveBannerMessage && (
        <div
          role="status"
          className="bg-emerald-100 dark:bg-emerald-950/90 border-b border-emerald-300 dark:border-emerald-800 px-4 py-2.5 text-emerald-900 dark:text-emerald-200 text-xs flex items-center justify-between shadow-sm"
        >
          <div className="flex items-center gap-2 max-w-5xl mx-auto">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{saveBannerMessage}</span>
          </div>
          <button
            onClick={onDismissSaveBanner}
            className="text-emerald-800 dark:text-emerald-400 hover:text-black dark:hover:text-white text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}
    </>
  );
};
