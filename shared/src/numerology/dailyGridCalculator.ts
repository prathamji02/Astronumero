import { buildNumerologyGrid } from './gridBuilder.ts';
import type { DailyGridResult, GridNumberItem, NumerologyGrid } from '../types/index.ts';

/**
 * Calculates the Daily Grid according to Section 15:
 * Contains:
 * - Natal Grid numbers (Natal DOB digits, Basic, Destiny)
 * - Active Mahadasha number (source: 'mahadasha')
 * - Active Personal Year number (source: 'personal_year')
 * - Active Pratyantar number (source: 'pratyantar', if not blank)
 * - Day Lord number (source: 'day_lord', if calculated)
 *
 * Preserves all repeated occurrences with exact source identification.
 */
export function calculateDailyGrid(
  natalGrid: NumerologyGrid,
  activeMahadasha: number,
  activePersonalYear: number,
  activePratyantar: number | null,
  dayLord: number | null,
  date: string,
  weekday: string
): DailyGridResult {
  const combinedItems: GridNumberItem[] = [...natalGrid.allNumbers];

  combinedItems.push({
    value: activeMahadasha,
    source: 'mahadasha',
  });

  combinedItems.push({
    value: activePersonalYear,
    source: 'personal_year',
  });

  if (activePratyantar !== null) {
    combinedItems.push({
      value: activePratyantar,
      source: 'pratyantar',
    });
  }

  if (dayLord !== null) {
    combinedItems.push({
      value: dayLord,
      source: 'day_lord',
    });
  }

  const dailyGrid = buildNumerologyGrid(combinedItems);

  return {
    date,
    weekday,
    activeMahadasha,
    activePersonalYear,
    activePratyantar: activePratyantar ?? 0,
    dayLord: dayLord ?? 0,
    dailyGrid,
  };
}
