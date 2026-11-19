import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api.ts';
import type { CalculatedData } from '../types/index.ts';
import { Bookmark, Search, Trash2, Edit3, ArrowRight, Eye, Calendar, Sparkles } from 'lucide-react';

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
  onLoadChart: (data: CalculatedData) => void;
  onOpenCompare: (chart1Id: string) => void;
}

export const SavedChartsView: React.FC<Props> = ({ onLoadChart, onOpenCompare }) => {
  const [charts, setCharts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCharts = async () => {
    try {
      setLoading(true);
      setError(null);
      const url = search.trim() ? `/charts?search=${encodeURIComponent(search.trim())}` : '/charts';
      const res = await apiRequest<{ charts: any[] }>(url);
      setCharts(res.charts || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load saved charts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharts();
  }, [search]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from your saved charts?`)) return;
    try {
      await apiRequest(`/charts/${id}`, { method: 'DELETE' });
      fetchCharts();
    } catch (err: any) {
      alert(err.message || 'Failed to delete chart.');
    }
  };

  const handleOpenChart = async (id: string) => {
    try {
      const res = await apiRequest<{ chart: any }>(`/charts/${id}`);
      // Recalculate fresh full data via API or use snapshot
      const calcRes = await apiRequest<{ success: boolean; data: CalculatedData }>('/numerology/calculate', {
        method: 'POST',
        body: JSON.stringify({
          fullName: res.chart.person_name,
          dateOfBirth: res.chart.date_of_birth,
          timeOfBirth: res.chart.time_of_birth,
          placeOfBirth: res.chart.place_of_birth,
        }),
      });
      onLoadChart(calcRes.data);
    } catch (err: any) {
      alert(err.message || 'Failed to open chart.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header & Search */}
      <div className="bg-navy-900 border border-navy-700/80 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-emerald-400" />
            Saved Numerology Charts Repository
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Access, view, inspect, or compare all charts saved under your user account.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search saved charts by person name..."
            className="w-full pl-9 pr-4 py-2 bg-navy-950 border border-navy-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 bg-navy-900 border border-navy-800 rounded-2xl">
          <Bookmark className="w-8 h-8 text-emerald-400 animate-pulse mx-auto mb-2" />
          <p className="text-xs text-slate-400">Loading saved charts...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-950/40 border border-rose-800 text-rose-300 rounded-xl text-center text-xs">
          {error}
        </div>
      ) : charts.length === 0 ? (
        <div className="text-center py-16 bg-navy-900 border border-navy-800 rounded-2xl p-6">
          <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No Saved Charts Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
            {search
              ? `No charts matched your search query "${search}".`
              : 'You have not saved any numerology charts yet. Generate a chart and click "Save Chart" to store it here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {charts.map((c) => (
            <div
              key={c.id}
              className="bg-navy-900 border border-navy-700/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-emerald-500/50 transition"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-base font-bold text-white">{c.person_name}</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-navy-950 text-slate-400 border border-navy-800">
                    v{c.calculation_version}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-300 mb-4">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-gold-400" />
                    <span>Birth Date:</span>
                    <strong className="text-white font-mono">{formatToDDMMYYYY(c.date_of_birth)}</strong>
                  </div>
                  {c.time_of_birth && (
                    <div className="text-[11px] text-slate-400">Time: {c.time_of_birth}</div>
                  )}
                  {c.place_of_birth && (
                    <div className="text-[11px] text-slate-400">Place: {c.place_of_birth}</div>
                  )}
                  <div className="text-[10px] text-slate-500 pt-1 font-mono">
                    Saved on {formatToDDMMYYYY(c.created_at)}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-navy-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenChart(c.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
                >
                  <Eye className="w-3.5 h-3.5" /> Open Chart
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onOpenCompare(c.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-gold-400 hover:bg-navy-800 transition"
                    title="Compare this chart with another"
                  >
                    Compare
                  </button>
                  <button
                    onClick={() => handleDelete(c.id, c.person_name)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition"
                    title="Delete chart"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
