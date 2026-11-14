import { GRID_LAYOUT, NUMBER_POSITIONS } from './constants.ts';
import type { GridCell, GridNumberItem, NumerologyGrid } from '../types/index.ts';

/**
 * Builds a 3x3 NumerologyGrid populated with items placed in their fixed positions.
 * Preserves duplicate numbers in each cell according to their fixed layout.
 */
export function buildNumerologyGrid(items: GridNumberItem[]): NumerologyGrid {
  const cellsMap: Map<number, GridNumberItem[]> = new Map();
  for (let i = 1; i <= 9; i++) {
    cellsMap.set(i, []);
  }

  for (const item of items) {
    if (item.value >= 1 && item.value <= 9) {
      cellsMap.get(item.value)?.push(item);
    }
  }

  const cells: GridCell[] = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const positionNumber = GRID_LAYOUT[r][c];
      cells.push({
        positionNumber,
        row: r,
        col: c,
        items: cellsMap.get(positionNumber) || [],
      });
    }
  }

  return {
    cells,
    allNumbers: [...items],
  };
}
