import { addDays, addYears, formatDate, parseDate } from './reducers.ts';
import type { MahadashaPeriod } from '../types/index.ts';

/**
 * Calculates Mahadasha periods up to maxYears (default 100 years).
 *
 * Rules:
 * - Begins with the Basic Number.
 * - Duration in years equals the number itself.
 * - Sequences sequentially 1 -> 9, wrapping around (e.g. 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 1 -> 2 -> 3).
 * - Sum of numbers from any start digit to wrap around of 9 digits always equals 45 years.
 * - At age 45, the sequence restarts from the original Basic Number.
 * - Starts on birthday, ends on the day before the next period's start.
 */
export function calculateMahadashaPeriods(
  dateOfBirth: string,
  basicNumber: number,
  maxYears: number = 100
): MahadashaPeriod[] {
  const periods: MahadashaPeriod[] = [];
  const baseBirthDate = parseDate(dateOfBirth);

  let currentAge = 0;
  let cycle = 1;

  while (currentAge < maxYears) {
    let currentNumber = basicNumber;
    let periodInCycle = 0;

    while (periodInCycle < 9 && currentAge < maxYears) {
      const duration = currentNumber;
      const startAge = currentAge;
      const endAge = Math.min(currentAge + duration, maxYears);
      const actualDuration = endAge - startAge;

      const startDate = addYears(baseBirthDate, startAge);
      const nextStartDate = addYears(baseBirthDate, endAge);
      const endDate = addDays(nextStartDate, -1);

      periods.push({
        cycle,
        number: currentNumber,
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        durationYears: actualDuration,
        ageAtStart: startAge,
        ageAtEnd: endAge,
        isRestartAt45: startAge === 45,
      });

      currentAge = endAge;
      periodInCycle++;

      // Next number in sequence 1..9
      currentNumber = currentNumber === 9 ? 1 : currentNumber + 1;
    }

    cycle++;
  }

  return periods;
}

/**
 * Finds the active Mahadasha period for a specific target date (YYYY-MM-DD).
 */
export function getActiveMahadasha(
  periods: MahadashaPeriod[],
  targetDate: string
): MahadashaPeriod | null {
  for (const period of periods) {
    if (targetDate >= period.startDate && targetDate <= period.endDate) {
      return period;
    }
  }
  return null;
}
