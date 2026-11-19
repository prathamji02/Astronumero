import React from 'react';
import type { NumerologyGrid, GridCell, GridItem } from '../types/index.ts';

interface Props {
  grid: NumerologyGrid;
  title: string;
  subtitle?: string;
  dateRange?: string;
}

const SOURCE_LABELS: Record<string, { label: string; badgeClass: string; desc: string }> = {
  natal: {
    label: 'Natal',
    badgeClass: 'bg-sky-950 text-sky-300 border-sky-800',
    desc: 'From birth date digits',
  },
  basic: {
    label: 'Mulank',
    badgeClass: 'bg-emerald-950 text-emerald-300 border-emerald-800',
    desc: 'Basic Number from birth day',
  },
  destiny: {
    label: 'Bhagyank',
    badgeClass: 'bg-amber-950 text-amber-300 border-amber-800',
    desc: 'Destiny Number from full DOB',
  },
  mahadasha: {
    label: 'Mahadasha',
    badgeClass: 'bg-purple-950 text-purple-300 border-purple-800',
    desc: 'Active Mahadasha planetary cycle',
  },
  personal_year: {
    label: 'Pers. Year',
    badgeClass: 'bg-yellow-950 text-yellow-300 border-yellow-800',
    desc: 'Active Personal Year number',
  },
  pratyantar: {
    label: 'Pratyantar',
    badgeClass: 'bg-teal-950 text-teal-300 border-teal-800',
    desc: 'Active Pratyantar period',
  },
  day_lord: {
    label: 'Day Lord',
    badgeClass: 'bg-rose-950 text-rose-300 border-rose-800',
    desc: 'Active Daily Day Lord number',
  },
};

export const NumerologyGridCard: React.FC<Props> = ({ grid, title, subtitle, dateRange }) => {
  // Sort cells according to fixed 3x3 layout: row 0 (3,1,9), row 1 (6,7,5), row 2 (2,8,4)
  const rows: GridCell[][] = [[], [], []];
  for (const cell of grid.cells) {
    if (cell.row >= 0 && cell.row < 3) {
      rows[cell.row].push(cell);
    }
  }
  for (const row of rows) {
    row.sort((a, b) => a.col - b.col);
  }

  return (
    <div className="bg-navy-900 border border-navy-700/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Decorative ambient gradient */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6 border-b border-navy-800 pb-4">
        <div>
          <h3 className="text-xl font-bold text-white tracking-wide">{title}</h3>
          {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {dateRange && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-navy-800 text-emerald-400 border border-emerald-500/30">
            {dateRange}
          </span>
        )}
      </div>

      {/* Screen Reader Semantic Table (Accessible Equivalent - WCAG 2.2 AA) */}
      <table className="sr-only" aria-label={`3 by 3 Numerology Grid for ${title}`}>
        <caption>Accessible tabular view of the 3 by 3 numerology grid numbers and sources.</caption>
        <thead>
          <tr>
            <th scope="col">Grid Position</th>
            <th scope="col">Occurrences Count</th>
            <th scope="col">Digits Displayed</th>
            <th scope="col">Source Categories</th>
          </tr>
        </thead>
        <tbody>
          {grid.cells.map((cell) => {
            const count = cell.items.length;
            const digits = count > 0 ? cell.items.map((i) => i.value).join('') : 'Empty';
            const sources = count > 0 ? cell.items.map((i) => SOURCE_LABELS[i.source]?.label || i.source).join(', ') : 'None';
            return (
              <tr key={cell.positionNumber}>
                <td>Position {cell.positionNumber}</td>
                <td>{count}</td>
                <td>{digits}</td>
                <td>{sources}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Visual 3x3 Grid */}
      <div
        className="grid grid-cols-3 gap-3 sm:gap-4 max-w-lg mx-auto"
        role="region"
        aria-label="Interactive 3 by 3 numerology grid visual presentation"
      >
        {rows.flat().map((cell) => {
          const hasNumbers = cell.items.length > 0;
          return (
            <div
              key={cell.positionNumber}
              tabIndex={0}
              className={`min-h-[110px] sm:min-h-[128px] rounded-xl p-3 flex flex-col justify-between border transition-all duration-200 focus:ring-2 focus:ring-emerald-400 focus:outline-none ${
                hasNumbers
                  ? 'bg-navy-800/90 border-navy-600 shadow-inner'
                  : 'bg-navy-950/60 border-navy-800/60'
              }`}
              aria-label={`Position ${cell.positionNumber}: ${
                hasNumbers
                  ? `${cell.items.length} occurrence(s) of number ${cell.positionNumber}: ${cell.items
                      .map((i) => SOURCE_LABELS[i.source]?.label)
                      .join(', ')}`
                  : 'Empty cell'
              }`}
            >
              {/* Header: fixed position number watermark */}
              <div className="flex justify-between items-center text-xs sm:text-sm font-mono">
                <span className="text-slate-500 font-semibold" title={`Fixed Grid Position ${cell.positionNumber}`}>
                  #{cell.positionNumber}
                </span>
                {hasNumbers && (
                  <span className="text-[11px] sm:text-xs text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-900">
                    ×{cell.items.length}
                  </span>
                )}
              </div>

              {/* Digits Display: preserves all repeated occurrences (e.g. 44, 888) */}
              <div className="text-center my-auto py-1">
                {hasNumbers ? (
                  <div className="text-3xl sm:text-4xl font-extrabold tracking-wider text-white">
                    {cell.items.map((i) => i.value).join('')}
                  </div>
                ) : (
                  <div className="text-slate-500 text-base font-medium tracking-widest">—</div>
                )}
              </div>

              {/* Source breakdown badges */}
              <div className="flex flex-wrap gap-1.5 justify-center min-h-[24px]">
                {cell.items.map((item, idx) => {
                  const meta = SOURCE_LABELS[item.source] || {
                    label: item.source,
                    badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
                  };
                  return (
                    <span
                      key={idx}
                      className={`text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded border ${meta.badgeClass}`}
                      title={`${item.value} from ${meta.label} (${meta.desc})`}
                    >
                      {meta.label}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-navy-800 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
        <span className="font-semibold text-slate-300">Source Legend:</span>
        {Object.entries(SOURCE_LABELS).map(([key, meta]) => (
          <span key={key} className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] ${meta.badgeClass}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {meta.label}
          </span>
        ))}
      </div>
    </div>
  );
};
