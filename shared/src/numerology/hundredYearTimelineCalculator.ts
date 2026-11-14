import { calculateMahadashaPeriods, getActiveMahadasha } from './mahadashaCalculator.ts';
import { calculatePersonalYearForBirthday } from './personalYearCalculator.ts';
import { calculatePratyantarPeriods } from './pratyantarCalculator.ts';
import { addDays, addYears, formatDate, parseDate } from './reducers.ts';
import type { HundredYearTimelineResult, TimelineYearItem } from '../types/index.ts';

/**
 * Calculates the complete 100-year timeline structure (birthday-to-birthday).
 *
 * Example:
 * DOB = 1994-08-13
 * Age 0: 1994-08-13 to 1995-08-12
 * ...
 * Age 99: 2093-08-13 to 2094-08-12
 */
export function calculateHundredYearTimeline(
  dateOfBirth: string,
  basicNumber: number
): HundredYearTimelineResult {
  const mahadashaPeriods = calculateMahadashaPeriods(dateOfBirth, basicNumber, 100);
  const birthDateObj = parseDate(dateOfBirth);
  const birthYear = birthDateObj.getFullYear();

  const timelineYears: TimelineYearItem[] = [];

  for (let age = 0; age < 100; age++) {
    const calendarYear = birthYear + age;
    const yearStartDate = addYears(birthDateObj, age);
    const nextYearStartDate = addYears(birthDateObj, age + 1);
    const yearEndDate = addDays(nextYearStartDate, -1);

    const startDateStr = formatDate(yearStartDate);
    const endDateStr = formatDate(yearEndDate);

    const activeMahadasha = getActiveMahadasha(mahadashaPeriods, startDateStr);
    const personalYearCalc = calculatePersonalYearForBirthday(dateOfBirth, calendarYear);

    const pratyantarPeriods = calculatePratyantarPeriods(
      startDateStr,
      endDateStr,
      personalYearCalc.personalYearNumber
    );

    timelineYears.push({
      age,
      calendarYear,
      startDate: startDateStr,
      endDate: endDateStr,
      mahadashaNumber: activeMahadasha ? activeMahadasha.number : basicNumber,
      personalYearNumber: personalYearCalc.personalYearNumber,
      pratyantarPeriods,
    });
  }

  const finalEndDate = timelineYears[timelineYears.length - 1].endDate;

  return {
    birthDate: dateOfBirth,
    endDate: finalEndDate,
    timelineYears,
  };
}
