import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api.ts';
import type { UserSubscription } from '../types/index.ts';
import { CreditCard, Check, Sparkles, X, Shield, ArrowRight } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentSubscription: UserSubscription | null;
  onUpgradeSuccess: (updatedSub: UserSubscription) => void;
}

export const PlansModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentSubscription,
  onUpgradeSuccess,
}) => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const fetchPlans = async () => {
      try {
        const res = await apiRequest<{ plans: any[] }>('/subscriptions/plans');
        setPlans(res.plans || []);
      } catch (err) {
        console.error('Failed to load plans:', err);
      }
    };
    fetchPlans();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpgrade = async (planSlug: string) => {
    setLoadingSlug(planSlug);
    try {
      const res = await apiRequest<{ success: boolean; message: string; subscription: UserSubscription }>(
        '/subscriptions/upgrade',
        {
          method: 'POST',
          body: JSON.stringify({ planSlug }),
        }
      );
      alert(res.message);
      onUpgradeSuccess(res.subscription);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Upgrade failed.');
    } finally {
      setLoadingSlug(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="plans-modal-title"
    >
      <div className="bg-navy-900 border border-navy-700 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full hover:bg-navy-800 transition"
          aria-label="Close membership plans"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center max-w-xl mx-auto mb-8">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block mb-1">
            Membership Plans
          </span>
          <h2 id="plans-modal-title" className="text-2xl sm:text-3xl font-black text-white">
            Unlock Full Numerology Power
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Choose a tier to access 100-Year Life Timelines, side-by-side Chart Comparisons, and high-resolution chart exports.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => {
            const isCurrent = currentSubscription?.planSlug === p.slug;
            const isFeatured = p.slug === 'pro-monthly';

            return (
              <div
                key={p.id}
                className={`rounded-2xl p-6 flex flex-col justify-between border transition relative ${
                  isFeatured
                    ? 'bg-navy-850 border-emerald-500 shadow-xl shadow-emerald-500/10'
                    : 'bg-navy-950/80 border-navy-800'
                }`}
              >
                {isFeatured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white shadow-md">
                    Most Popular
                  </span>
                )}

                <div>
                  <h3 className="text-lg font-bold text-white mb-1">{p.name}</h3>
                  <p className="text-xs text-slate-400 mb-4 min-h-[36px]">{p.description}</p>

                  <div className="mb-6 pb-4 border-b border-navy-800">
                    <span className="text-3xl font-black text-white">
                      ${p.price}
                    </span>
                    <span className="text-xs text-slate-400 ml-1.5">
                      / {p.duration_days === 365 ? 'year' : p.duration_days === 30 ? 'month' : `${p.duration_days} days`}
                    </span>
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-300 mb-6">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>{p.max_saved_charts > 1000 ? 'Unlimited' : p.max_saved_charts} Saved Charts</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check
                        className={`w-4 h-4 flex-shrink-0 ${
                          p.allow_100_year_timeline ? 'text-emerald-400' : 'text-slate-600'
                        }`}
                      />
                      <span className={p.allow_100_year_timeline ? 'text-white' : 'text-slate-500'}>
                        100-Year Life Timeline
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check
                        className={`w-4 h-4 flex-shrink-0 ${
                          p.allow_comparison ? 'text-emerald-400' : 'text-slate-600'
                        }`}
                      />
                      <span className={p.allow_comparison ? 'text-white' : 'text-slate-500'}>
                        Chart Comparison Engine
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check
                        className={`w-4 h-4 flex-shrink-0 ${
                          p.allow_export ? 'text-emerald-400' : 'text-slate-600'
                        }`}
                      />
                      <span className={p.allow_export ? 'text-white' : 'text-slate-500'}>
                        Printable & PDF Exports
                      </span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  disabled={isCurrent || loadingSlug === p.slug}
                  onClick={() => handleUpgrade(p.slug)}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 ${
                    isCurrent
                      ? 'bg-navy-800 text-slate-400 border border-navy-700 cursor-default'
                      : isFeatured
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                      : 'bg-navy-800 hover:bg-navy-700 text-white border border-navy-700'
                  }`}
                >
                  {isCurrent
                    ? 'Current Plan'
                    : loadingSlug === p.slug
                    ? 'Processing...'
                    : 'Select Plan'}
                  {!isCurrent && <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
