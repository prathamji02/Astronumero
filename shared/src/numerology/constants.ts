/**
 * Fixed 3x3 Numerology Grid Position Definition:
 * 3 | 1 | 9
 * ---------
 * 6 | 7 | 5
 * ---------
 * 2 | 8 | 4
 */
export const GRID_LAYOUT = [
  [3, 1, 9],
  [6, 7, 5],
  [2, 8, 4],
] as const;

export interface CellPosition {
  positionNumber: number;
  row: number;
  col: number;
}

export const NUMBER_POSITIONS: Record<number, CellPosition> = {
  3: { positionNumber: 3, row: 0, col: 0 },
  1: { positionNumber: 1, row: 0, col: 1 },
  9: { positionNumber: 9, row: 0, col: 2 },
  6: { positionNumber: 6, row: 1, col: 0 },
  7: { positionNumber: 7, row: 1, col: 1 },
  5: { positionNumber: 5, row: 1, col: 2 },
  2: { positionNumber: 2, row: 2, col: 0 },
  8: { positionNumber: 8, row: 2, col: 1 },
  4: { positionNumber: 4, row: 2, col: 2 },
};

/**
 * Weekday Number Mapping:
 * Sunday: 1
 * Monday: 2
 * Tuesday: 9
 * Wednesday: 5
 * Thursday: 3
 * Friday: 6
 * Saturday: 8
 * (Numbers 4 and 7 are not used)
 */
export const WEEKDAY_NUMBER_MAP: Record<number, { name: string; number: number }> = {
  0: { name: 'Sunday', number: 1 },
  1: { name: 'Monday', number: 2 },
  2: { name: 'Tuesday', number: 9 },
  3: { name: 'Wednesday', number: 5 },
  4: { name: 'Thursday', number: 3 },
  5: { name: 'Friday', number: 6 },
  6: { name: 'Saturday', number: 8 },
};

export const PRATYANTAR_MULTIPLIER_DAYS = 8;
export const PRATYANTAR_TARGET_DAYS = 360;
export const MAHADASHA_RESTART_AGE = 45;
