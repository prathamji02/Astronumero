import React, { useState } from 'react';
import { Send, X, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSend: (data: { recipientEmail: string; subject: string; body: string }) => Promise<void>;
  loading: boolean;
  feedback: { text: string; type: 'success' | 'error' } | null;
}

export const AdminMailComposerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSend,
  loading,
  feedback,
}) => {
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSend({
      recipientEmail: recipient.trim(),
      subject: subject.trim(),
      body: body.trim(),
    });
  };

  return (
    <div className="bg-slate-50 dark:bg-navy-950 border border-sky-300 dark:border-sky-500/30 rounded-2xl p-5 space-y-4 animate-in fade-in shadow-sm">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-sky-500" />
          Compose &amp; Dispatch Custom Email
        </h4>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs ${
            feedback.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
              : 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
          }`}
        >
          {feedback.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Recipient Email <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-3 py-2 bg-white dark:bg-navy-900 border border-slate-300 dark:border-navy-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Subject <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Updates from TalktoNakshatra"
              className="w-full px-3 py-2 bg-white dark:bg-navy-900 border border-slate-300 dark:border-navy-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-sky-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
            Message Body <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={4}
            required
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your email message here..."
            className="w-full px-3 py-2 bg-white dark:bg-navy-900 border border-slate-300 dark:border-navy-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-navy-900 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-navy-800 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold rounded-xl transition flex items-center gap-1.5 shadow"
          >
            <Send className="w-3.5 h-3.5" />
            {loading ? 'Sending...' : 'Send Mail'}
          </button>
        </div>
      </form>
    </div>
  );
};
