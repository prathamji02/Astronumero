import { WEEKDAY_NUMBER_MAP } from './constants.ts';
import { parseDate, reduceToSingleDigit } from './reducers.ts';
import type { DayLordCalculation } from '../types/index.ts';

/**
 * Calculates the Day Lord for a calendar day according to Section 14 and Addendum 1:
 *
 * Formula:
 * Day Lord = reduceToSingleDigit(Active Pratyantar Number + Weekday Number)
 *
 * Weekday Numbers:
 *  Sunday: 1, Monday: 2, Tuesday: 9, Wednesday: 5, Thursday: 3, Friday: 6, Saturday: 8
 *
 * Examples:
 *  Pratyantar 8 + Friday (6) = 14 -> 1 + 4 = 5
 *  Pratyantar 5 + Thursday (3) = 8 -> 8
 */
export function calculateDayLord(
  targetDateStr: string,
  activePratyantarNumber: number
): DayLordCalculation {
  const dateObj = parseDate(targetDateStr);
  const dayOfWeekIndex = dateObj.getDay();
  const weekdayMapping = WEEKDAY_NUMBER_MAP[dayOfWeekIndex];

  if (!weekdayMapping) {
    throw new Error(`Unexpected weekday index ${dayOfWeekIndex} for date ${targetDateStr}.`);
  }

  const rawSum = activePratyantarNumber + weekdayMapping.number;
  const dayLordNumber = reduceToSingleDigit(rawSum);

  return {
    date: targetDateStr,
    weekday: weekdayMapping.name,
    weekdayNumber: weekdayMapping.number,
    activePratyantarNumber,
    rawSum,
    dayLordNumber,
  };
}
