import React, { useState, useMemo } from 'react';
import type { CalculatedData, NumerologyGrid, PratyantarPeriod } from '../types/index.ts';
import { CompactGridCard } from './CompactGridCard.tsx';
import {
  calculatePersonalYearForBirthday,
  getActiveMahadasha,
  calculateAnnualGrid,
  calculatePratyantarPeriods,
  calculateDayLord,
  buildNumerologyGrid,
  addDays,
  parseDate,
  formatDate,
} from '../../../shared/src/index.ts';

interface Props {
  data: CalculatedData;
  onOpenCompare?: () => void;
}

// Formats any YYYY-MM-DD or date string as strict DD-MM-YYYY
function formatToDDMMYYYY(dateStr: string): string {
  if (!dateStr) return '';
  const clean = String(dateStr).split('T')[0].trim();
  const parts = clean.split('-');
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD -> DD-MM-YYYY
      return `${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[0]}`;
    } else if (parts[2].length === 4) {
      return `${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[2]}`;
    }
  }
  return clean;
}

export const MultiChartOverview: React.FC<Props> = ({ data, onOpenCompare }) => {
  const birthYear = parseInt(data.birthInput.dateOfBirth.split('-')[0], 10);

  // Drill-down levels:
  // 'overview' = Multi-Year Grid (PDF Page 1)
  // 'year'     = Year & 9 Pratyantar Periods (Image 1)
  // 'daily'    = Daily Grids for that Pratyantar Period (Image 2)
  const [drillLevel, setDrillLevel] = useState<'overview' | 'year' | 'daily'>('overview');
  const [fromYear, setFromYear] = useState<number>(2020);
  const [toYear, setToYear] = useState<number>(2040);
  const [selectedYear, setSelectedYear] = useState<number>(2020);
  const [selectedPratyantar, setSelectedPratyantar] = useState<any | null>(null);

  // 1. Level 1: Multi-Year Annual Charts (fromYear to toYear)
  const annualCharts = useMemo(() => {
    const list: Array<{
      year: number;
      title: string;
      mahadashaNumber: number;
      personalYearNumber: number;
      annualGrid: NumerologyGrid;
    }> = [];

    const start = Math.max(fromYear, birthYear);
    const end = Math.min(toYear, birthYear + 99);

    for (let yr = start; yr <= end; yr++) {
      const py = calculatePersonalYearForBirthday(data.birthInput.dateOfBirth, yr);
      const md = getActiveMahadasha(data.mahadasha.periods as any, py.startDate) || data.mahadasha.periods[0];

      const annualRes = calculateAnnualGrid(
        data.natal.grid as any,
        md.number,
        py.personalYearNumber,
        py.startDate,
        py.endDate
      );

      list.push({
        year: yr,
        title: `${yr} - ${yr + 1}`,
        mahadashaNumber: md.number,
        personalYearNumber: py.personalYearNumber,
        annualGrid: annualRes.annualGrid as any,
      });
    }

    return list;
  }, [data, fromYear, toYear, birthYear]);

  // 2. Level 2: Year view (Image 1) showing NATAL, YEAR grid, and the 9 Pratyantar periods
  const yearPratyantarData = useMemo(() => {
    if (selectedYear === null) return null;

    const py = calculatePersonalYearForBirthday(data.birthInput.dateOfBirth, selectedYear);
    const md = getActiveMahadasha(data.mahadasha.periods as any, py.startDate) || data.mahadasha.periods[0];

    const annualRes = calculateAnnualGrid(
      data.natal.grid as any,
      md.number,
      py.personalYearNumber,
      py.startDate,
      py.endDate
    );

    const pratyantarList = calculatePratyantarPeriods(
      py.startDate,
      py.endDate,
      py.personalYearNumber
    );

    // Build grid for each Pratyantar period (Natal + Mahadasha + Personal Year + Pratyantar)
    const pratyantarCards = pratyantarList
      .filter((p) => !p.isBlank && p.pratyantarNumber !== null)
      .map((p) => {
        const items = [
          ...(data.natal.grid.allNumbers as any),
          { value: md.number, source: 'mahadasha' as const },
          { value: py.personalYearNumber, source: 'personal_year' as const },
          { value: p.pratyantarNumber!, source: 'pratyantar' as const },
        ];
        const grid = buildNumerologyGrid(items);
        return {
          period: p,
          title: `${formatToDDMMYYYY(p.startDate)} - ${formatToDDMMYYYY(p.endDate)}`,
          grid: grid as any,
          pratyantarNumber: p.pratyantarNumber,
        };
      });

    return {
      year: selectedYear,
      yearTitle: `YEAR ${selectedYear}-${selectedYear + 1}`,
      mahadashaNumber: md.number,
      personalYearNumber: py.personalYearNumber,
      annualGrid: annualRes.annualGrid as any,
      pratyantarCards,
    };
  }, [data, selectedYear]);

  // 3. Level 3: Daily view (Image 2) showing NATAL, YEAR grid, and all days in that Pratyantar period
  const dailyData = useMemo(() => {
    if (!selectedPratyantar || !yearPratyantarData) return null;

    const { startDate, endDate, pratyantarNumber } = selectedPratyantar;
    const startObj = parseDate(startDate);
    const endObj = parseDate(endDate);

    const diffDays =
      Math.round((endObj.getTime() - startObj.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const dailyCards: Array<{
      dateStr: string;
      title: string;
      grid: NumerologyGrid;
      dayLord: number;
    }> = [];

    for (let i = 0; i < diffDays; i++) {
      const curDateObj = addDays(startObj, i);
      const curDateStr = formatDate(curDateObj);

      const dayLordCalc = calculateDayLord(curDateStr, pratyantarNumber);

      const items = [
        ...(data.natal.grid.allNumbers as any),
        { value: yearPratyantarData.mahadashaNumber, source: 'mahadasha' as const },
        { value: yearPratyantarData.personalYearNumber, source: 'personal_year' as const },
        { value: pratyantarNumber, source: 'pratyantar' as const },
        { value: dayLordCalc.dayLordNumber, source: 'day_lord' as const },
      ];

      const grid = buildNumerologyGrid(items);

      dailyCards.push({
        dateStr: curDateStr,
        title: formatToDDMMYYYY(curDateStr),
        grid: grid as any,
        dayLord: dayLordCalc.dayLordNumber,
      });
    }

    return {
      period: selectedPratyantar,
      dailyCards,
    };
  }, [selectedPratyantar, yearPratyantarData, data]);

  return (
    <div className="space-y-4">
      {/* Top Header & Blue Action Buttons Bar (Exact match with reference screenshots) */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-3 sm:p-4 shadow-sm space-y-3">
        {/* Row 1: Range indicators and Main Action Buttons (SHOW CHART, COMPARE) */}
        <div className="flex items-center justify-between gap-4">
          <div className="text-xs font-semibold text-slate-500 font-mono">
            {fromYear}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDrillLevel('overview')}
              className="px-5 py-1.5 rounded-md bg-[#3B82F6] hover:bg-blue-600 text-white font-bold text-xs uppercase tracking-wider transition shadow-sm"
            >
              Show Chart
            </button>
            {onOpenCompare && (
              <button
                type="button"
                onClick={onOpenCompare}
                className="px-5 py-1.5 rounded-md bg-[#3B82F6] hover:bg-blue-600 text-white font-bold text-xs uppercase tracking-wider transition shadow-sm"
              >
                Compare
              </button>
            )}
          </div>
          <div className="text-xs font-semibold text-slate-500 font-mono">
            {toYear}
          </div>
        </div>

        {/* Row 2: Legend Pills matching reference screenshots */}
        <div className="pt-2 border-t border-slate-100 dark:border-navy-800/60 flex flex-wrap items-center gap-2 text-[11px] font-medium">
          <span className="px-3 py-0.5 rounded-full bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300">
            Natal
          </span>
          <span className="px-3 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
            Basic
          </span>
          <span className="px-3 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            Destiny
          </span>
          <span className="px-3 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
            Mahadasha
          </span>
          <span className="px-3 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            Personal Year
          </span>
          <span className="px-3 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
            Monthly
          </span>
          <span className="px-3 py-0.5 rounded-full bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400">
            Daily
          </span>
        </div>

        {/* Row 3: Basic and Destiny Scores */}
        <div className="flex items-center justify-between text-xs font-bold pt-1">
          <span className="text-slate-800 dark:text-slate-200">
            Basic : <span className="text-rose-500 font-extrabold">{data.natal.basicNumber}</span>
          </span>
          <span className="text-slate-800 dark:text-slate-200">
            Destiny : <span className="text-emerald-500 font-extrabold">{data.natal.destinyNumber}</span>
          </span>
        </div>

        {/* Row 4: Navigation Bar (BACK, PREVIOUS YEAR, NEXT YEAR) */}
        {drillLevel !== 'overview' && (
          <div className="pt-2 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                if (drillLevel === 'daily') setDrillLevel('year');
                else setDrillLevel('overview');
              }}
              className="px-4 py-1.5 rounded-md bg-[#3B82F6] hover:bg-blue-600 text-white font-bold text-xs uppercase tracking-wide transition shadow-sm"
            >
              Back
            </button>

            {drillLevel === 'year' && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedYear((y) => Math.max(y - 1, birthYear))}
                  className="px-4 py-1.5 rounded-md bg-[#3B82F6] hover:bg-blue-600 text-white font-bold text-xs uppercase tracking-wide transition shadow-sm"
                >
                  Previous Year
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedYear((y) => Math.min(y + 1, birthYear + 99))}
                  className="px-4 py-1.5 rounded-md bg-[#3B82F6] hover:bg-blue-600 text-white font-bold text-xs uppercase tracking-wide transition shadow-sm"
                >
                  Next Year
                </button>
              </div>
            )}
          </div>
        )}

        {/* Level 1 From/To Year Filter Bar (only when in overview) */}
        {drillLevel === 'overview' && (
          <div className="pt-2 border-t border-slate-100 dark:border-navy-800 flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
            <span>Date Of Birth: <strong className="font-mono text-slate-900 dark:text-white">{data.birthInput.dateOfBirth}T00:00:00Z</strong></span>
            <div className="flex items-center gap-2">
              <span>From Year:</span>
              <input
                type="number"
                min={birthYear}
                max={birthYear + 99}
                value={fromYear}
                onChange={(e) => setFromYear(parseInt(e.target.value, 10) || birthYear)}
                className="w-16 px-1.5 py-0.5 bg-slate-100 dark:bg-navy-950 border border-slate-300 dark:border-navy-700 rounded text-center text-xs text-slate-900 dark:text-white font-mono"
              />
            </div>
            <div className="flex items-center gap-2">
              <span>To Year:</span>
              <input
                type="number"
                min={fromYear}
                max={birthYear + 99}
                value={toYear}
                onChange={(e) => setToYear(parseInt(e.target.value, 10) || fromYear + 20)}
                className="w-16 px-1.5 py-0.5 bg-slate-100 dark:bg-navy-950 border border-slate-300 dark:border-navy-700 rounded text-center text-xs text-slate-900 dark:text-white font-mono"
              />
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 italic">
              Tip: Click on any chart to inspect its 9 Monthly Pratyantar periods!
            </span>
          </div>
        )}
      </div>

      {/* ================= LEVEL 1: MULTI-YEAR OVERVIEW (PDF Page 1) ================= */}
      {drillLevel === 'overview' && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {/* Natal Card */}
          <CompactGridCard
            grid={data.natal.grid}
            title="NATAL"
            isNatal={true}
          />

          {/* Annual Charts: Clickable to drill down into Year View (Image 1) */}
          {annualCharts.map((item) => (
            <CompactGridCard
              key={item.year}
              grid={item.annualGrid}
              title={item.title}
              mahadashaNumber={item.mahadashaNumber}
              personalYearNumber={item.personalYearNumber}
              clickable={true}
              onClick={() => {
                setSelectedYear(item.year);
                setDrillLevel('year');
              }}
            />
          ))}
        </div>
      )}

      {/* ================= LEVEL 2: YEAR & 9 PRATYANTAR VIEW (IMAGE 1) ================= */}
      {drillLevel === 'year' && yearPratyantarData && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {/* Card 1: NATAL */}
            <CompactGridCard
              grid={data.natal.grid}
              title="NATAL"
              isNatal={true}
            />

            {/* Card 2: YEAR Grid */}
            <CompactGridCard
              grid={yearPratyantarData.annualGrid}
              title={yearPratyantarData.yearTitle}
              isNatal={true}
            />

            {/* Cards 3 to 11: The 9 Pratyantar Periods (Clickable to drill down into Daily View!) */}
            {yearPratyantarData.pratyantarCards.map((pCard, idx) => (
              <CompactGridCard
                key={idx}
                grid={pCard.grid}
                title={pCard.title}
                isNatal={true}
                clickable={true}
                onClick={() => {
                  setSelectedPratyantar(pCard.period);
                  setDrillLevel('daily');
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ================= LEVEL 3: DAILY VIEW (IMAGE 2) ================= */}
      {drillLevel === 'daily' && yearPratyantarData && dailyData && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {/* Card 1: NATAL */}
            <CompactGridCard
              grid={data.natal.grid}
              title="NATAL"
              isNatal={true}
            />

            {/* Card 2: YEAR Grid */}
            <CompactGridCard
              grid={yearPratyantarData.annualGrid}
              title={yearPratyantarData.yearTitle}
              isNatal={true}
            />

            {/* Cards 3 onwards: Daily grid for every single day in this Pratyantar period */}
            {dailyData.dailyCards.map((dCard, idx) => (
              <CompactGridCard
                key={idx}
                grid={dCard.grid}
                title={dCard.title}
                isNatal={true}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
