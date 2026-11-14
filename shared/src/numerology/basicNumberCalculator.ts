import { reduceToSingleDigit, extractDigits } from './reducers.ts';

/**
 * Calculates the Basic Number (Mulank) from the day of birth.
 * Digits of the birth day are repeatedly added until a single digit remains (1-9).
 *
 * Example:
 *  13th of month -> 1 + 3 = 4
 *  28th of month -> 2 + 8 = 10 -> 1 + 0 = 1
 */
export function calculateBasicNumber(day: number): number {
  if (day < 1 || day > 31) {
    throw new Error(`Invalid birth day: ${day}. Must be between 1 and 31.`);
  }
  const digits = extractDigits(day);
  const sum = digits.reduce((acc, d) => acc + d, 0);
  return reduceToSingleDigit(sum);
}
