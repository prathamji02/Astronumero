import React from 'react';
import type { NavigationTab, CalculatedData } from '../../types/index.ts';
import { NumerologyGridCard } from '../NumerologyGridCard.tsx';
import { Info } from 'lucide-react';

interface Props {
  currentTab: NavigationTab;
  calculatedData: CalculatedData;
  formatDate: (dateStr: string) => string;
}

export const CalculationDetailViews: React.FC<Props> = ({
  currentTab,
  calculatedData,
  formatDate,
}) => {
  return (
    <>
      {/* VIEW 3: NATAL GRID */}
      {currentTab === 'natal' && (
        <div className="space-y-4 max-w-3xl mx-auto">
          <NumerologyGridCard
            grid={calculatedData.natal.grid}
            title="Permanent Natal Grid"
            subtitle={`${calculatedData.birthInput.fullName} (DOB: ${formatDate(calculatedData.birthInput.dateOfBirth)})`}
          />

          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-5 sm:p-6 text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-2.5 shadow-sm">
            <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm sm:text-base">
              <Info className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
              Natal Grid Rules (Section 9.3)
            </h2>
            <p>• Century digits excluded: <strong>"{calculatedData.natal.centuryDigitsExcluded}"</strong> (retained year digits: <strong>"{calculatedData.natal.remainingYearDigits}"</strong>).</p>
            <p>• Birth digits included: <strong>[{calculatedData.natal.includedDateDigits.join(', ')}]</strong> (zeros ignored).</p>
            <p>• Basic Number: <strong className="text-rose-500 font-bold">{calculatedData.natal.basicNumber}</strong> | Destiny Number: <strong className="text-emerald-500 font-bold">{calculatedData.natal.destinyNumber}</strong>.</p>
            <p>• Final Natal Digits: <strong>[{calculatedData.natal.finalNatalDigits.map((i) => i.value).join(', ')}]</strong>.</p>
          </div>
        </div>
      )}

      {/* VIEW 4: MAHADASHA */}
      {currentTab === 'mahadasha' && (
        <div className="space-y-4 max-w-4xl mx-auto">
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs sm:text-sm shadow-sm">
            <div>
              <h2 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">Mahadasha Calculation (Section 10)</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">Begins with Basic Number ({calculatedData.natal.basicNumber}), duration = number, restarts at age 45.</p>
            </div>
            <span className="px-3 py-1.5 rounded-xl bg-purple-100 dark:bg-purple-950 border border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-bold font-mono text-xs sm:text-sm">
              Active: Number {calculatedData.mahadasha.active.number}
            </span>
          </div>

          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm" aria-label="Mahadasha periods timeline">
                <thead className="bg-slate-50 dark:bg-navy-950 text-slate-500 dark:text-slate-400 uppercase font-mono text-[11px] sm:text-xs border-b border-slate-200 dark:border-navy-800">
                  <tr>
                    <th scope="col" className="py-3 px-4">Period</th>
                    <th scope="col" className="py-3 px-4">Mahadasha</th>
                    <th scope="col" className="py-3 px-4">Duration</th>
                    <th scope="col" className="py-3 px-4">Age Range</th>
                    <th scope="col" className="py-3 px-4">Date Range (DD-MM-YYYY)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-navy-800/60 font-mono text-slate-700 dark:text-slate-300">
                  {calculatedData.mahadasha.periods.slice(0, 12).map((p, idx) => (
                    <tr key={idx} className={p.number === calculatedData.mahadasha.active.number ? 'bg-purple-50 dark:bg-purple-950/40 font-bold' : ''}>
                      <td className="py-3 px-4">#{idx + 1}</td>
                      <td className="py-3 px-4">
                        Mahadasha {p.number} {p.isRestartAt45 && <span className="text-emerald-500 font-sans font-normal">(Age 45 Restart)</span>}
                      </td>
                      <td className="py-3 px-4">{p.durationYears} Years</td>
                      <td className="py-3 px-4">Age {p.ageAtStart}–{p.ageAtEnd}</td>
                      <td className="py-3 px-4">{formatDate(p.startDate)} to {formatDate(p.endDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 5: PERSONAL YEAR */}
      {currentTab === 'personal_year' && (
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-6 sm:p-8 max-w-xl mx-auto space-y-5 shadow-sm">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Personal Year Calculation (Section 11)</h2>
          <div className="text-5xl font-black text-amber-500 py-5 text-center bg-slate-50 dark:bg-navy-950 rounded-2xl border border-slate-200 dark:border-navy-800 font-mono">
            {calculatedData.personalYear.personalYearNumber}
          </div>
          <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-2 font-mono bg-slate-50 dark:bg-navy-950/60 p-4 rounded-xl border border-slate-200 dark:border-navy-800">
            <div>Period: <strong className="text-slate-900 dark:text-white">{formatDate(calculatedData.personalYear.startDate)}</strong> to <strong className="text-slate-900 dark:text-white">{formatDate(calculatedData.personalYear.endDate)}</strong></div>
            <div>Birthday Weekday: <strong className="text-slate-900 dark:text-white">{calculatedData.personalYear.birthdayWeekday}</strong> (Value: {calculatedData.personalYear.birthdayWeekdayNumber})</div>
            <div>Formula Sum: <strong className="text-amber-500">{calculatedData.personalYear.calculationSum}</strong> → <strong>{calculatedData.personalYear.personalYearNumber}</strong></div>
          </div>
        </div>
      )}

      {/* VIEW 6: PRATYANTAR */}
      {currentTab === 'pratyantar' && (
        <div className="space-y-4 max-w-4xl mx-auto">
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-5 text-xs sm:text-sm shadow-sm">
            <h2 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">Monthly / Pratyantar Dasha (Section 13)</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5">9 periods of (Number × 8 days) = 360 days total + blank remainder days.</p>
          </div>

          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm font-mono" aria-label="Monthly Pratyantar periods">
                <thead className="bg-slate-50 dark:bg-navy-950 text-slate-500 uppercase text-[11px] sm:text-xs border-b border-slate-200 dark:border-navy-800">
                  <tr>
                    <th scope="col" className="py-3 px-4">#</th>
                    <th scope="col" className="py-3 px-4">Pratyantar</th>
                    <th scope="col" className="py-3 px-4">Duration</th>
                    <th scope="col" className="py-3 px-4">Date Range (DD-MM-YYYY)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-navy-800/60 text-slate-700 dark:text-slate-300">
                  {calculatedData.pratyantar.periods.map((p, idx) => (
                    <tr key={idx} className={p.isBlank ? 'bg-slate-50 dark:bg-navy-950 italic text-slate-400' : ''}>
                      <td className="py-2.5 px-4">#{p.periodOrder}</td>
                      <td className="py-2.5 px-4">
                        {p.isBlank ? 'Blank Remainder' : `Pratyantar ${p.pratyantarNumber}`}
                      </td>
                      <td className="py-2.5 px-4">{p.durationDays} Days</td>
                      <td className="py-2.5 px-4">{formatDate(p.startDate)} to {formatDate(p.endDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 7: DAILY GRID */}
      {currentTab === 'daily' && (
        <div className="space-y-4 max-w-3xl mx-auto">
          <NumerologyGridCard
            grid={calculatedData.dailyGrid.dailyGrid}
            title="Daily Grid (Section 15)"
            subtitle={`Date: ${formatDate(calculatedData.dailyGrid.date)} (${calculatedData.dailyGrid.weekday}) | Day Lord: ${calculatedData.dayLord?.dayLordNumber || 'None'}`}
            dateRange={formatDate(calculatedData.dailyGrid.date)}
          />
        </div>
      )}
    </>
  );
};
