import { PRATYANTAR_MULTIPLIER_DAYS, PRATYANTAR_TARGET_DAYS } from './constants.ts';
import { addDays, formatDate, parseDate } from './reducers.ts';
import type { PratyantarPeriod } from '../types/index.ts';

/**
 * Calculates the 9 Pratyantar Dasha periods plus the blank remainder period for a given Personal Year.
 *
 * Rules:
 * 1. Starts from the current Personal Year number.
 * 2. Numbers increase sequentially, wrapping around after 9 (1 -> 2 ... 9 -> 1).
 * 3. Duration of each period = current sequence number * 8 days.
 * 4. Sum of all 9 periods is always 360 days.
 * 5. The remaining 5 days (or 6 days in a leap year) before the next birthday remain blank.
 */
export function calculatePratyantarPeriods(
  startDateStr: string,
  endDateStr: string,
  personalYearNumber: number
): PratyantarPeriod[] {
  const periods: PratyantarPeriod[] = [];
  let currentDate = parseDate(startDateStr);
  const annualEndDate = parseDate(endDateStr);

  let currentNumber = personalYearNumber;

  for (let order = 1; order <= 9; order++) {
    const durationDays = currentNumber * PRATYANTAR_MULTIPLIER_DAYS;
    const periodStartDate = currentDate;
    const periodEndDate = addDays(periodStartDate, durationDays - 1);

    periods.push({
      periodOrder: order,
      pratyantarNumber: currentNumber,
      durationDays,
      startDate: formatDate(periodStartDate),
      endDate: formatDate(periodEndDate),
      isBlank: false,
    });

    currentDate = addDays(periodEndDate, 1);
    currentNumber = currentNumber === 9 ? 1 : currentNumber + 1;
  }

  // Calculate the remaining blank days up to the annualEndDate
  if (currentDate.getTime() <= annualEndDate.getTime()) {
    const blankDurationDays =
      Math.round((annualEndDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    periods.push({
      periodOrder: 10,
      pratyantarNumber: null,
      durationDays: blankDurationDays,
      startDate: formatDate(currentDate),
      endDate: formatDate(annualEndDate),
      isBlank: true,
    });
  }

  return periods;
}

/**
 * Finds the active Pratyantar period for a target date within the given list of periods.
 */
export function getActivePratyantar(
  periods: PratyantarPeriod[],
  targetDate: string
): PratyantarPeriod | null {
  for (const period of periods) {
    if (targetDate >= period.startDate && targetDate <= period.endDate) {
      return period;
    }
  }
  return null;
}
