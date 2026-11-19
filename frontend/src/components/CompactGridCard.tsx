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

// Color palette matching the reference charts:
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

// Formats any date or date range to DD-MM-YYYY format
function formatDisplayTitle(rawTitle: string): string {
  if (!rawTitle) return '';
  // Check for range like "YYYY-MM-DD - YYYY-MM-DD" or "D/M/YYYY - D/M/YYYY"
  if (rawTitle.includes(' - ')) {
    const [start, end] = rawTitle.split(' - ');
    return `${formatSingleDate(start)} to ${formatSingleDate(end)}`;
  }
  return formatSingleDate(rawTitle);
}

function formatSingleDate(str: string): string {
  const clean = str.trim();
  // If YYYY-MM-DD
  const isoMatch = clean.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, '0');
    const d = isoMatch[3].padStart(2, '0');
    return `${d}-${m}-${y}`;
  }
  // If D/M/YYYY
  const slashMatch = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const d = slashMatch[1].padStart(2, '0');
    const m = slashMatch[2].padStart(2, '0');
    const y = slashMatch[3];
    return `${d}-${m}-${y}`;
  }
  return clean;
}

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

  const formattedTitle = formatDisplayTitle(title);

  // Screen reader accessible summary:
  const screenReaderSummary = grid.cells
    .map((c) => {
      if (c.items.length === 0) return `Position ${c.positionNumber} empty`;
      return `Position ${c.positionNumber} contains ${c.items.map((i) => `${i.value} (${i.source})`).join(', ')}`;
    })
    .join('. ');

  return (
    <div
      onClick={onClick}
      role={clickable ? 'button' : 'region'}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={(e) => {
        if (clickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.();
        }
      }}
      aria-label={`${formattedTitle} numerology chart. ${clickable ? 'Press Enter to open detailed view.' : ''}`}
      className={`bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700/80 rounded-xl overflow-hidden shadow-sm transition-all duration-150 ${clickable
        ? 'cursor-pointer hover:border-emerald-500 hover:shadow-md hover:scale-[1.01] focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none'
        : ''
        }`}
    >
      {/* Green Header Banner (Exact match with reference screenshots: #008000) */}
      <div className="bg-[#008000] dark:bg-[#047857] text-white py-1.5 px-2.5 text-center select-none">
        <div className="text-xs sm:text-sm font-bold tracking-tight leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
          {formattedTitle}
        </div>
      </div>

      {/* Screen Reader Only Announcement for Blind Users (TalkBack / VoiceOver / NVDA / JAWS) */}
      <div className="sr-only" aria-live="off">
        {`Grid for ${formattedTitle}: ${screenReaderSummary}`}
      </div>

      {/* 3x3 Table Grid with clean, deterministic divider lines & ARIA accessibility */}
      <div
        className="p-1.5 sm:p-2 bg-white dark:bg-navy-950/60"
        role="grid"
        aria-label={`3 by 3 Numerology Grid for ${formattedTitle}`}
      >
        <div className="grid grid-cols-3 border border-slate-200 dark:border-navy-800 rounded-lg overflow-hidden">
          {rows.flatMap((rowCells, rIdx) =>
            rowCells.map((cell, cIdx) => {
              const hasNumbers = cell.items.length > 0;
              const hasRightBorder = cIdx < 2;
              const hasBottomBorder = rIdx < 2;

              const cellLabel = `Row ${rIdx + 1}, Column ${cIdx + 1}, Position ${cell.positionNumber}: ${hasNumbers
                ? cell.items.map((i) => `${i.value} (${i.source})`).join(', ')
                : 'Empty'
                }`;

              return (
                <div
                  key={cell.positionNumber}
                  role="gridcell"
                  tabIndex={0}
                  aria-label={cellLabel}
                  className={`h-9 sm:h-10 flex items-center justify-center p-0.5 bg-white dark:bg-navy-900/80 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500 focus-visible:outline-none ${hasRightBorder ? 'border-r border-slate-200 dark:border-navy-800' : ''
                    } ${hasBottomBorder ? 'border-b border-slate-200 dark:border-navy-800' : ''
                    }`}
                  title={`Position ${cell.positionNumber}${hasNumbers
                    ? `: ${cell.items.map((i) => `${i.value} (${i.source})`).join(', ')}`
                    : ': Empty'
                    }`}
                >
                  {hasNumbers ? (
                    <span className="text-xs sm:text-sm font-black tracking-tight flex items-center justify-center flex-wrap">
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
                    <span className="text-slate-300 dark:text-navy-700 text-xs select-none" aria-hidden="true">
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
