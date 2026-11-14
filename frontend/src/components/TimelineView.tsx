import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api.ts';
import type { CalculatedData, UserSubscription } from '../types/index.ts';
import { Clock, Calendar, ChevronRight, Filter } from 'lucide-react';

interface Props {
  data: CalculatedData;
  subscription?: UserSubscription | null;
  onOpenPlans?: () => void;
}

export const TimelineView: React.FC<Props> = ({ data }) => {
  const [timelineYears, setTimelineYears] = useState<any[]>([]);
  const [selectedAge, setSelectedAge] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiRequest<{ success: boolean; timeline: { timelineYears: any[] } }>(
          '/numerology/timeline',
          {
            method: 'POST',
            body: JSON.stringify({
              dateOfBirth: data.birthInput.dateOfBirth,
              basicNumber: data.natal.basicNumber,
            }),
          }
        );
        setTimelineYears(res.timeline.timelineYears);

        // Pre-select current age
        const birthYear = parseInt(data.birthInput.dateOfBirth.split('-')[0], 10);
        const currentYear = new Date().getFullYear();
        const currentAge = Math.min(Math.max(currentYear - birthYear, 0), 99);
        setSelectedAge(currentAge);
      } catch (err: any) {
        setError(err.message || 'Failed to calculate timeline.');
      } finally {
        setLoading(false);
      }
    };

    fetchTimeline();
  }, [data.birthInput.dateOfBirth]);

  if (loading) {
    return (
      <div className="text-center py-16 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl">
        <Clock className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Computing 100-year birthday-to-birthday projections...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-center text-xs">
        {error}
      </div>
    );
  }

  const activeItem = timelineYears[selectedAge] || timelineYears[0];

  return (
    <div className="space-y-6">
      {/* Overview Header */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-500" />
            100-Year Life Timeline (Ages 0 to 99)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Calculated for <strong className="text-slate-800 dark:text-white">{data.birthInput.fullName}</strong> (DOB: {data.birthInput.dateOfBirth})
          </p>
        </div>

        {/* Quick Age Navigation Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-500 font-semibold mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Jump to Age:
          </span>
          {[0, 18, 25, 30, 45, 60, 75, 90].map((age) => (
            <button
              key={age}
              onClick={() => setSelectedAge(age)}
              className={`px-2.5 py-1 text-xs rounded-lg font-bold border transition ${
                selectedAge === age
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                  : 'bg-slate-100 dark:bg-navy-950 border-slate-200 dark:border-navy-800 text-slate-700 dark:text-slate-400 hover:text-white'
              }`}
            >
              Age {age}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 100-Year Scrollable Selector */}
        <div className="lg:col-span-5 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-4 shadow-sm max-h-[600px] flex flex-col">
          <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-200 dark:border-navy-800 text-xs text-slate-500 font-semibold">
            <span>Age & Year</span>
            <span>Mahadasha / PY</span>
          </div>

          <div className="overflow-y-auto space-y-1 pr-1 flex-1">
            {timelineYears.map((item) => {
              const isSelected = item.age === selectedAge;
              const isRestart45 = item.age === 45;
              return (
                <button
                  key={item.age}
                  onClick={() => setSelectedAge(item.age)}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left border transition text-xs ${
                    isSelected
                      ? 'bg-slate-100 dark:bg-navy-800 border-emerald-500 text-slate-900 dark:text-white shadow-sm'
                      : 'bg-slate-50/60 dark:bg-navy-950/60 border-slate-200 dark:border-navy-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold font-mono text-[11px] ${
                        isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-navy-900 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {item.age}
                    </span>
                    <div>
                      <span className="font-semibold block">{item.calendarYear}</span>
                      <span className="text-[10px] text-slate-400">
                        {item.startDate} to {item.endDate}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isRestart45 && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                        Age 45 Restart
                      </span>
                    )}
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 font-bold text-emerald-600 dark:text-emerald-400">
                      M:{item.mahadashaNumber} | PY:{item.personalYearNumber}
                    </span>
                    <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-500' : 'text-slate-400'}`} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Breakdown for Selected Age */}
        <div className="lg:col-span-7 space-y-4">
          {activeItem && (
            <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 mb-5 border-b border-slate-200 dark:border-navy-800">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    Age {activeItem.age} ({activeItem.calendarYear})
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Period: <strong className="text-slate-800 dark:text-slate-200">{activeItem.startDate}</strong> to{' '}
                    <strong className="text-slate-800 dark:text-slate-200">{activeItem.endDate}</strong>
                  </p>
                </div>

                <div className="flex gap-2">
                  <div className="text-center p-2 px-3 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800">
                    <span className="text-[10px] font-bold uppercase text-purple-600 dark:text-purple-400 block">Mahadasha</span>
                    <span className="text-2xl font-black text-slate-900 dark:text-white">{activeItem.mahadashaNumber}</span>
                  </div>
                  <div className="text-center p-2 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800">
                    <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400 block">Personal Year</span>
                    <span className="text-2xl font-black text-slate-900 dark:text-white">{activeItem.personalYearNumber}</span>
                  </div>
                </div>
              </div>

              {/* Pratyantar Periods Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-teal-500" />
                  Pratyantar Dasha Sequence (360 Days + Blank Remainder)
                </h4>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-navy-800">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-50 dark:bg-navy-950 text-slate-500 uppercase text-[10px] border-b border-slate-200 dark:border-navy-800">
                      <tr>
                        <th className="py-2 px-3">#</th>
                        <th className="py-2 px-3">Pratyantar</th>
                        <th className="py-2 px-3">Duration</th>
                        <th className="py-2 px-3">Dates</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-navy-800/60 text-slate-700 dark:text-slate-300">
                      {activeItem.pratyantarPeriods.map((p: any, idx: number) => (
                        <tr
                          key={idx}
                          className={p.isBlank ? 'bg-slate-50 dark:bg-navy-950 text-slate-400 italic' : ''}
                        >
                          <td className="py-2 px-3">#{p.periodOrder}</td>
                          <td className="py-2 px-3">
                            {p.isBlank ? (
                              <span className="text-slate-400">Blank Remainder</span>
                            ) : (
                              <span className="font-bold text-teal-600 dark:text-teal-400">
                                Pratyantar {p.pratyantarNumber}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3">{p.durationDays} days</td>
                          <td className="py-2 px-3 text-slate-500 dark:text-slate-400">
                            {p.startDate} to {p.endDate}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
