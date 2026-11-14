import { buildNumerologyGrid } from './gridBuilder.ts';
import type { AnnualGridResult, GridNumberItem, NumerologyGrid } from '../types/index.ts';

/**
 * Calculates the Annual Grid according to Section 12:
 * Contains:
 * - Natal Grid numbers (including Basic & Destiny with their respective sources)
 * - Active Mahadasha number (source: 'mahadasha')
 * - Active Personal Year number (source: 'personal_year')
 *
 * Preserves all repeated numbers and distinct source tags.
 */
export function calculateAnnualGrid(
  natalGrid: NumerologyGrid,
  activeMahadasha: number,
  activePersonalYear: number,
  startDate: string,
  endDate: string
): AnnualGridResult {
  const combinedItems: GridNumberItem[] = [...natalGrid.allNumbers];

  combinedItems.push({
    value: activeMahadasha,
    source: 'mahadasha',
  });

  combinedItems.push({
    value: activePersonalYear,
    source: 'personal_year',
  });

  const annualGrid = buildNumerologyGrid(combinedItems);

  return {
    startDate,
    endDate,
    natalGrid,
    activeMahadasha,
    activePersonalYear,
    annualGrid,
  };
}
