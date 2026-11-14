import React from 'react';
import type { NumerologyGrid, GridCell } from '../types/index.ts';

interface Props {
  grid: NumerologyGrid;
  title: string;
  mahadashaNumber?: number | null;
  personalYearNumber?: number | null;
  isNatal?: boolean;
  onClick?: () => void;
  clickable?: boolean;
}

// Color palette matching the PDF & reference screenshots:
// Natal: slate/white, Basic: rose/red, Destiny: emerald/green, Mahadasha: purple, Personal Year: orange/amber, Daily/Day Lord: pink/teal
const SOURCE_TEXT_COLORS: Record<string, string> = {
  natal: 'text-slate-800 dark:text-slate-100',
  basic: 'text-rose-500 dark:text-rose-400 font-bold',
  destiny: 'text-emerald-600 dark:text-emerald-400 font-bold',
  mahadasha: 'text-purple-600 dark:text-purple-400 font-bold',
  personal_year: 'text-amber-500 dark:text-amber-400 font-bold',
  pratyantar: 'text-teal-600 dark:text-teal-400 font-bold',
  day_lord: 'text-rose-500 dark:text-pink-400 font-bold',
};

export const CompactGridCard: React.FC<Props> = ({
  grid,
  title,
  onClick,
  clickable = false,
}) => {
  // Fixed 3x3 layout: row 0 (3,1,9), row 1 (6,7,5), row 2 (2,8,4)
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
    <div
      onClick={onClick}
      className={`bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700/80 rounded-xl overflow-hidden shadow-sm transition-all duration-150 ${
        clickable ? 'cursor-pointer hover:border-emerald-500 hover:shadow-md hover:scale-[1.01]' : ''
      }`}
    >
      {/* Green Header Banner (Exact match with reference screenshots: #008000) */}
      <div className="bg-[#008000] dark:bg-[#047857] text-white py-1.5 px-2 text-center select-none">
        <div className="text-[11px] sm:text-[12px] font-bold tracking-tight leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
          {title}
        </div>
      </div>

      {/* 3x3 Table Grid with clean, deterministic divider lines */}
      <div className="p-1.5 sm:p-2 bg-white dark:bg-navy-950/60">
        <div className="grid grid-cols-3 border border-slate-200 dark:border-navy-800 rounded-lg overflow-hidden">
          {rows.flatMap((rowCells, rIdx) =>
            rowCells.map((cell, cIdx) => {
              const hasNumbers = cell.items.length > 0;
              const hasRightBorder = cIdx < 2;
              const hasBottomBorder = rIdx < 2;

              return (
                <div
                  key={cell.positionNumber}
                  className={`h-8 sm:h-9 flex items-center justify-center p-0.5 bg-white dark:bg-navy-900/80 ${
                    hasRightBorder ? 'border-r border-slate-200 dark:border-navy-800' : ''
                  } ${
                    hasBottomBorder ? 'border-b border-slate-200 dark:border-navy-800' : ''
                  }`}
                  title={`Position ${cell.positionNumber}${
                    hasNumbers
                      ? `: ${cell.items.map((i) => `${i.value} (${i.source})`).join(', ')}`
                      : ': Empty'
                  }`}
                >
                  {hasNumbers ? (
                    <span className="text-[11px] sm:text-xs font-black tracking-tight flex items-center justify-center flex-wrap">
                      {cell.items.map((item, iIdx) => (
                        <span
                          key={iIdx}
                          className={SOURCE_TEXT_COLORS[item.source] || 'text-slate-800 dark:text-slate-100'}
                        >
                          {item.value}
                        </span>
                      ))}
                    </span>
                  ) : (
                    <span className="text-slate-300 dark:text-navy-700 text-xs select-none">
                      &nbsp;
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
