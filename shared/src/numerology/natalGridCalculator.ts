import { calculateBasicNumber } from './basicNumberCalculator.ts';
import { calculateDestinyNumber } from './destinyNumberCalculator.ts';
import { buildNumerologyGrid } from './gridBuilder.ts';
import { extractDigits } from './reducers.ts';
import type { BirthInput, GridNumberItem, NatalCalculationResult } from '../types/index.ts';

/**
 * Calculates the Natal Grid according to Section 9.3:
 * 1. Takes the complete date of birth (YYYY-MM-DD).
 * 2. Excludes the century digits from the birth year (e.g. "19" from 1994, "20" from 2004).
 * 3. Includes remaining birth year digits, birth month digits, and birth day digits.
 * 4. Ignores zeros.
 * 5. Adds the Basic Number (Mulank).
 * 6. Adds the Destiny Number (Bhagyank).
 * 7. Places each number in its fixed position.
 * 8. Preserves repeated occurrences.
 */
export function calculateNatalGrid(birthInput: BirthInput): NatalCalculationResult {
  const { dateOfBirth } = birthInput;

  // Validate format YYYY-MM-DD
  const parts = dateOfBirth.split('-');
  if (parts.length !== 3) {
    throw new Error(`Invalid dateOfBirth: "${dateOfBirth}". Expected YYYY-MM-DD.`);
  }

  const [yearStr, monthStr, dayStr] = parts;
  const yearNum = parseInt(yearStr, 10);
  const monthNum = parseInt(monthStr, 10);
  const dayNum = parseInt(dayStr, 10);

  if (isNaN(yearNum) || isNaN(monthNum) || isNaN(dayNum)) {
    throw new Error(`Invalid numeric date components in "${dateOfBirth}".`);
  }

  const basicNumber = calculateBasicNumber(dayNum);
  const destinyNumber = calculateDestinyNumber(dateOfBirth);

  // Century exclusion: birth year first 2 digits are century, last 2 are remaining
  const fullYearPadded = yearStr.padStart(4, '0');
  const centuryDigitsExcluded = fullYearPadded.slice(0, fullYearPadded.length - 2);
  const remainingYearDigits = fullYearPadded.slice(-2);

  // Remaining date digits: day + month + remainingYearDigits
  const datePartsString = `${dayStr}${monthStr}${remainingYearDigits}`;
  const allDateDigits = extractDigits(datePartsString);
  const nonZeroDateDigits = allDateDigits.filter((d) => d > 0);

  const finalNatalDigits: GridNumberItem[] = [];

  // Add DOB digits (source: 'natal')
  for (const digit of nonZeroDateDigits) {
    finalNatalDigits.push({ value: digit, source: 'natal' });
  }

  // Add Basic Number (source: 'basic')
  finalNatalDigits.push({ value: basicNumber, source: 'basic' });

  // Add Destiny Number (source: 'destiny')
  finalNatalDigits.push({ value: destinyNumber, source: 'destiny' });

  const grid = buildNumerologyGrid(finalNatalDigits);

  return {
    birthInput,
    basicNumber,
    destinyNumber,
    centuryDigitsExcluded,
    remainingYearDigits,
    includedDateDigits: nonZeroDateDigits,
    finalNatalDigits,
    grid,
  };
}
