import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api.ts';
import type { UserSubscription } from '../types/index.ts';
import { Layers, ArrowRight } from 'lucide-react';
import { NumerologyGridCard } from './NumerologyGridCard.tsx';

function formatToDDMMYYYY(dateStr: string): string {
  if (!dateStr) return '';
  const clean = String(dateStr).split('T')[0].trim();
  const parts = clean.split('-');
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return `${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[0]}`;
    } else if (parts[2].length === 4) {
      return `${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[2]}`;
    }
  }
  return clean;
}

interface Props {
  subscription?: UserSubscription | null;
  onOpenPlans?: () => void;
  preselectedChartId?: string | null;
}

export const CompareView: React.FC<Props> = ({ preselectedChartId }) => {
  const [savedCharts, setSavedCharts] = useState<any[]>([]);
  const [chart1Id, setChart1Id] = useState<string>(preselectedChartId || '');
  const [chart2Id, setChart2Id] = useState<string>('');
  const [comparisonResult, setComparisonResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCharts = async () => {
      try {
        const res = await apiRequest<{ charts: any[] }>('/charts');
        setSavedCharts(res.charts || []);
        if (res.charts.length >= 2 && !chart1Id) {
          setChart1Id(res.charts[0].id);
          setChart2Id(res.charts[1].id);
        }
      } catch (err) {
        console.error('Failed to load charts for comparison:', err);
      }
    };
    loadCharts();
  }, []);

  const handleRunComparison = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chart1Id || !chart2Id) {
      setError('Please select two distinct saved charts to compare.');
      return;
    }
    if (chart1Id === chart2Id) {
      setError('Please select two different charts to perform a comparison.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiRequest<any>('/charts/compare', {
        method: 'POST',
        body: JSON.stringify({ chart1Id, chart2Id }),
      });
      setComparisonResult(res);
    } catch (err: any) {
      setError(err.message || 'Comparison failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Selector Card */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-5 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
          <Layers className="w-4 h-4 text-emerald-500" />
          Chart Comparison
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Select two charts from your saved repository to generate side-by-side analysis.
        </p>

        {savedCharts.length < 2 ? (
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs text-slate-500">
            ⚠️ You need at least <strong>two saved charts</strong> in your repository to run a comparison. Please save charts for two people first.
          </div>
        ) : (
          <form onSubmit={handleRunComparison} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Chart 1</label>
              <select
                value={chart1Id}
                onChange={(e) => setChart1Id(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-navy-700 rounded-xl text-slate-900 dark:text-white text-xs outline-none focus:border-emerald-500"
              >
                <option value="">Select Chart 1...</option>
                {savedCharts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.person_name} ({formatToDDMMYYYY(c.date_of_birth)})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Chart 2</label>
              <select
                value={chart2Id}
                onChange={(e) => setChart2Id(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-navy-700 rounded-xl text-slate-900 dark:text-white text-xs outline-none focus:border-emerald-500"
              >
                <option value="">Select Chart 2...</option>
                {savedCharts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.person_name} ({formatToDDMMYYYY(c.date_of_birth)})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
              >
                {loading ? 'Analyzing...' : 'Compare'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
            {error}
          </div>
        )}
      </div>

      {/* Comparison Results */}
      {comparisonResult && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Comparison Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800">
                <span className="text-slate-500 block font-semibold mb-0.5">Basic Number</span>
                <span className="text-base font-bold text-slate-900 dark:text-white">
                  {comparisonResult.chart1.natal.basicNumber} vs {comparisonResult.chart2.natal.basicNumber}
                </span>
                <span className="text-[11px] block mt-1 text-slate-500">
                  {comparisonResult.comparison.isSameBasicNumber ? 'Identical Basic Number' : 'Different Energies'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800">
                <span className="text-slate-500 block font-semibold mb-0.5">Destiny Number</span>
                <span className="text-base font-bold text-slate-900 dark:text-white">
                  {comparisonResult.chart1.natal.destinyNumber} vs {comparisonResult.chart2.natal.destinyNumber}
                </span>
                <span className="text-[11px] block mt-1 text-slate-500">
                  {comparisonResult.comparison.isSameDestinyNumber ? 'Identical Life Path' : 'Complementary Paths'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800">
                <span className="text-slate-500 block font-semibold mb-0.5">Common Numbers</span>
                <div className="flex gap-1 mt-0.5 flex-wrap">
                  {comparisonResult.comparison.commonNumbers.map((n: number) => (
                    <span
                      key={n}
                      className="w-5 h-5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center"
                    >
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <NumerologyGridCard
              grid={comparisonResult.chart1.natal.grid}
              title={comparisonResult.chart1.personName}
              subtitle={`DOB: ${formatToDDMMYYYY(comparisonResult.chart1.dateOfBirth)}`}
            />
            <NumerologyGridCard
              grid={comparisonResult.chart2.natal.grid}
              title={comparisonResult.chart2.personName}
              subtitle={`DOB: ${formatToDDMMYYYY(comparisonResult.chart2.dateOfBirth)}`}
            />
          </div>
        </div>
      )}
    </div>
  );
};
