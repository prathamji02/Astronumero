import React, { useEffect, useRef } from 'react';
import { Sparkles, Moon, Sun, Stars, X, Compass, CheckCircle2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AstroChartModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/85 backdrop-blur-md animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="astro-modal-title"
      aria-describedby="astro-modal-desc"
    >
      <div
        ref={modalRef}
        className="bg-navy-900 border border-amber-500/40 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden animate-in zoom-in-95"
      >
        {/* Celestial Ambient Glow Background */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          ref={closeButtonRef}
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full hover:bg-navy-800 transition focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
          aria-label="Close Astro Chart announcement"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Celestial Emblem */}
        <div className="text-center mb-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-purple-600/30 to-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-950/40">
            <Compass className="w-8 h-8 animate-pulse text-amber-300" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-amber-950/80 border border-amber-500/40 text-amber-300 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Under Active Development
          </span>

          <h2
            id="astro-modal-title"
            className="text-2xl sm:text-3xl font-black text-white tracking-tight"
          >
            Vedic Astro Chart
          </h2>
          <p className="text-xs text-amber-200/80 mt-1 font-medium">
            Kundli, Transits &amp; 27 Nakshatra Alignments
          </p>
        </div>

        {/* Feature Announcement Details */}
        <div
          id="astro-modal-desc"
          className="bg-navy-950/80 border border-navy-800 rounded-2xl p-5 text-xs text-slate-300 space-y-3 shadow-inner"
        >
          <div className="flex items-start gap-3">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 flex-shrink-0 mt-0.5">
              <Stars className="w-4 h-4" />
            </span>
            <div>
              <strong className="text-white block text-sm font-semibold">
                We are working on it!
              </strong>
              <p className="text-slate-400 mt-0.5 leading-relaxed">
                Our astrology calculation team is actively engineering the comprehensive
                Vedic Horoscope (Lagna Kundli, Navamsha D9), planetary planetary aspects (Drishti),
                and 27 Nakshatra padas for <strong>TalktoNakshatra</strong>.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-navy-800/80 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>North &amp; South Kundli</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Real-time Transits (Gochar)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>27 Nakshatra Deities</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Vedic-Numerology Fusion</span>
            </div>
          </div>
        </div>

        {/* Confirmation Button */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-navy-950 font-black text-xs uppercase tracking-wider transition shadow-lg shadow-amber-950/40 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none"
            aria-label="Got it, close Astro Chart announcement"
          >
            Got It, Thank You!
          </button>
        </div>
      </div>
    </div>
  );
};
