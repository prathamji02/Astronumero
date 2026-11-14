import { WEEKDAY_NUMBER_MAP } from './constants.ts';
import { addDays, addYears, extractDigits, formatDate, parseDate, reduceToSingleDigit } from './reducers.ts';
import type { PersonalYearCalculation } from '../types/index.ts';

/**
 * Calculates the Personal Year for a specific birthday calendar year according to Section 11:
 * Sum:
 * 1. All digits of the birth day.
 * 2. All digits of the birth month.
 * 3. Individual digits of the last two digits of the birthday calendar year.
 * 4. The weekday number of the birthday in that calendar year.
 * Reduced to a single digit (1-9).
 *
 * Runs from the birthday of `birthdayYear` to the day before the next birthday in `birthdayYear + 1`.
 */
export function calculatePersonalYearForBirthday(
  dateOfBirth: string,
  birthdayYear: number
): PersonalYearCalculation {
  const [bYearStr, bMonthStr, bDayStr] = dateOfBirth.split('-');
  const birthDayDigits = extractDigits(bDayStr);
  const birthMonthDigits = extractDigits(bMonthStr);

  const birthdayDate = parseDate(`${birthdayYear}-${bMonthStr}-${bDayStr}`);
  const nextBirthdayDate = parseDate(`${birthdayYear + 1}-${bMonthStr}-${bDayStr}`);
  const endDate = addDays(nextBirthdayDate, -1);

  // Weekday of the birthday in that calendar year
  const dayOfWeekIndex = birthdayDate.getDay(); // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  const weekdayMapping = WEEKDAY_NUMBER_MAP[dayOfWeekIndex];
  if (!weekdayMapping) {
    throw new Error(`Unexpected day of week index: ${dayOfWeekIndex}`);
  }

  // Last two digits of the birthday calendar year
  const yearLastTwoStr = String(birthdayYear).slice(-2).padStart(2, '0');
  const yearLastTwoDigits = extractDigits(yearLastTwoStr);

  // Sum all components
  const sumDay = birthDayDigits.reduce((acc, d) => acc + d, 0);
  const sumMonth = birthMonthDigits.reduce((acc, d) => acc + d, 0);
  const sumYear = yearLastTwoDigits.reduce((acc, d) => acc + d, 0);
  const sumWeekday = weekdayMapping.number;

  const calculationSum = sumDay + sumMonth + sumYear + sumWeekday;
  const personalYearNumber = reduceToSingleDigit(calculationSum);

  return {
    calendarYear: birthdayYear,
    startDate: formatDate(birthdayDate),
    endDate: formatDate(endDate),
    birthdayDate: formatDate(birthdayDate),
    birthdayWeekday: weekdayMapping.name,
    birthdayWeekdayNumber: sumWeekday,
    birthDayDigits,
    birthMonthDigits,
    yearLastTwoDigits,
    calculationSum,
    personalYearNumber,
  };
}

/**
 * Finds the active Personal Year for a given target date (YYYY-MM-DD).
 */
export function getActivePersonalYear(
  dateOfBirth: string,
  targetDate: string
): PersonalYearCalculation {
  const [, bMonthStr, bDayStr] = dateOfBirth.split('-');
  const [tYearStr] = targetDate.split('-');
  const targetYear = parseInt(tYearStr, 10);

  // Birthday in the target year
  const currentYearBirthdayStr = `${targetYear}-${bMonthStr}-${bDayStr}`;

  // If target date is on or after the birthday in targetYear, the active birthday year is targetYear.
  // Otherwise, the active birthday year is targetYear - 1.
  const activeBirthdayYear = targetDate >= currentYearBirthdayStr ? targetYear : targetYear - 1;

  return calculatePersonalYearForBirthday(dateOfBirth, activeBirthdayYear);
}
