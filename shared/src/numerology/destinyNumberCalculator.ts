import { reduceToSingleDigit, extractDigits } from './reducers.ts';

/**
 * Calculates the Destiny Number (Bhagyank) from the full date of birth.
 * Every digit of the complete date of birth is summed and repeatedly reduced until a single digit remains (1-9).
 *
 * Example:
 *  13/08/1994 -> 1 + 3 + 0 + 8 + 1 + 9 + 9 + 4 = 35 -> 3 + 5 = 8
 */
export function calculateDestinyNumber(dateOfBirth: string): number {
  const digits = extractDigits(dateOfBirth);
  if (digits.length < 8) {
    throw new Error(`Invalid date format for Destiny Number: "${dateOfBirth}". Expected full YYYY-MM-DD or DD/MM/YYYY.`);
  }
  const sum = digits.reduce((acc, d) => acc + d, 0);
  return reduceToSingleDigit(sum);
}
