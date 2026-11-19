import React from 'react';
import { X } from 'lucide-react';

interface Props {
  email: any | null;
  onClose: () => void;
  formatDate: (str: string) => string;
}

export const AdminEmailPreviewModal: React.FC<Props> = ({ email, onClose, formatDate }) => {
  if (!email) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-navy-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{email.subject}</h3>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              To: <span className="text-slate-900 dark:text-white font-semibold">{email.recipient_email}</span> | Sent: {formatDate(email.created_at || email.sent_at)}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-navy-950 rounded-xl p-4 border border-slate-200 dark:border-navy-800 text-xs">
          {(email.body_html || email.html_content) ? (
            <div
              className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200"
              dangerouslySetInnerHTML={{ __html: email.body_html || email.html_content }}
            />
          ) : (
            <pre className="whitespace-pre-wrap font-sans text-slate-800 dark:text-slate-200">
              {email.body_text || email.text_content}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 dark:bg-navy-800 hover:bg-slate-300 dark:hover:bg-navy-700 text-slate-800 dark:text-white text-xs font-bold rounded-xl transition"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
