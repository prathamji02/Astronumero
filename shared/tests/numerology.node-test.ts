import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBasicNumber,
  calculateDestinyNumber,
  calculateNatalGrid,
  calculateMahadashaPeriods,
  getActiveMahadasha,
  calculatePersonalYearForBirthday,
  getActivePersonalYear,
  calculatePratyantarPeriods,
  getActivePratyantar,
  calculateDayLord,
  calculateAnnualGrid,
  calculateDailyGrid,
  calculateHundredYearTimeline,
  reduceToSingleDigit,
} from '../src/index.ts';

describe('1. Single Digit Reduction (reduceToSingleDigit)', () => {
  it('handles sums below 10 correctly', () => {
    assert.equal(reduceToSingleDigit(1), 1);
    assert.equal(reduceToSingleDigit(5), 5);
    assert.equal(reduceToSingleDigit(9), 9);
    assert.equal(reduceToSingleDigit(8), 8);
  });

  it('handles sums equal to 10 correctly', () => {
    assert.equal(reduceToSingleDigit(10), 1); // 1 + 0 = 1
  });

  it('handles sums greater than 10 correctly', () => {
    assert.equal(reduceToSingleDigit(14), 5); // 1 + 4 = 5 (Prompt Addendum Example)
    assert.equal(reduceToSingleDigit(23), 5); // 2 + 3 = 5 (Prompt Example)
    assert.equal(reduceToSingleDigit(35), 8); // 3 + 5 = 8 (Prompt Example)
    assert.equal(reduceToSingleDigit(99), 9); // 9 + 9 = 18 -> 1 + 8 = 9
  });
});

describe('2. Basic Number / Mulank (Section 9.1)', () => {
  it('calculates Basic Number for 13th of month as 4 (1 + 3)', () => {
    assert.equal(calculateBasicNumber(13), 4);
  });

  it('calculates Basic Number for 28th as 1 (2 + 8 = 10 -> 1)', () => {
    assert.equal(calculateBasicNumber(28), 1);
  });

  it('calculates single-digit days directly', () => {
    assert.equal(calculateBasicNumber(7), 7);
  });
});

describe('3. Destiny Number / Bhagyank (Section 9.2)', () => {
  it('calculates Destiny Number for 1994-08-13 as 8 (35 -> 8)', () => {
    // 1 + 3 + 0 + 8 + 1 + 9 + 9 + 4 = 35 -> 3 + 5 = 8
    assert.equal(calculateDestinyNumber('1994-08-13'), 8);
  });
});

describe('4. Natal Grid (Section 9.3)', () => {
  const result = calculateNatalGrid({
    fullName: 'Test User',
    dateOfBirth: '1994-08-13',
  });

  it('excludes century digits "19" from 1994 and keeps "94"', () => {
    assert.equal(result.centuryDigitsExcluded, '19');
    assert.equal(result.remainingYearDigits, '94');
  });

  it('includes non-zero date digits [1, 3, 8, 9, 4]', () => {
    assert.deepEqual(result.includedDateDigits, [1, 3, 8, 9, 4]);
  });

  it('adds Basic Number (4) and Destiny Number (8)', () => {
    assert.equal(result.basicNumber, 4);
    assert.equal(result.destinyNumber, 8);
  });

  it('has final natal digits containing 1, 3, 8, 9, 4, 4, 8 with repeated occurrences', () => {
    const values = result.finalNatalDigits.map((i) => i.value).sort();
    assert.deepEqual(values, [1, 3, 4, 4, 8, 8, 9]);
  });

  it('places numbers in the exact fixed 3x3 layout with repeated occurrences', () => {
    // Cell for position 4 (row 2, col 2)
    const cell4 = result.grid.cells.find((c) => c.positionNumber === 4);
    assert.equal(cell4?.items.length, 2); // 44
    assert.deepEqual(cell4?.items.map((i) => i.value), [4, 4]);

    // Cell for position 8 (row 2, col 1)
    const cell8 = result.grid.cells.find((c) => c.positionNumber === 8);
    assert.equal(cell8?.items.length, 2); // 88
    assert.deepEqual(cell8?.items.map((i) => i.value), [8, 8]);

    // Cells 2, 5, 6, 7 are empty
    for (const emptyPos of [2, 5, 6, 7]) {
      const cell = result.grid.cells.find((c) => c.positionNumber === emptyPos);
      assert.equal(cell?.items.length, 0);
    }

    // Cells 1, 3, 9 each have 1 item
    for (const singlePos of [1, 3, 9]) {
      const cell = result.grid.cells.find((c) => c.positionNumber === singlePos);
      assert.equal(cell?.items.length, 1);
      assert.equal(cell?.items[0].value, singlePos);
    }
  });

  it('does NOT duplicate Basic Number for single-digit birth day (e.g. 5th of month)', () => {
    // DOB 1994-08-05: day is 5 (single digit)
    const singleDigitResult = calculateNatalGrid({
      fullName: 'Single Digit User',
      dateOfBirth: '1994-08-05',
    });
    // Basic number = 5. Since day is single-digit, basic number is NOT added again.
    // Date digits non-zero: [5, 8, 9, 4]
    // Destiny: 5 + 8 + 1 + 9 + 9 + 4 = 36 -> 9
    // Final natal digits: 5 (natal), 8 (natal), 9 (natal), 4 (natal), 9 (destiny)
    const cell5 = singleDigitResult.grid.cells.find((c) => c.positionNumber === 5);
    assert.equal(cell5?.items.length, 1); // Only 1 occurrence of 5 (not duplicated)
    assert.equal(cell5?.items[0].source, 'natal');
  });
});

describe('5. Mahadasha Calculation (Section 10)', () => {
  const periods = calculateMahadashaPeriods('1994-08-13', 4, 100);

  it('matches all specified periods from Section 10', () => {
    // 4 | 13 Aug 1994 | 12 Aug 1998
    assert.equal(periods[0].number, 4);
    assert.equal(periods[0].startDate, '1994-08-13');
    assert.equal(periods[0].endDate, '1998-08-12');
    assert.equal(periods[0].durationYears, 4);

    // 5 | 13 Aug 1998 | 12 Aug 2003
    assert.equal(periods[1].number, 5);
    assert.equal(periods[1].startDate, '1998-08-13');
    assert.equal(periods[1].endDate, '2003-08-12');

    // 6 | 13 Aug 2003 | 12 Aug 2009
    assert.equal(periods[2].number, 6);
    assert.equal(periods[2].startDate, '2003-08-13');
    assert.equal(periods[2].endDate, '2009-08-12');

    // 7 | 13 Aug 2009 | 12 Aug 2016
    assert.equal(periods[3].number, 7);
    assert.equal(periods[3].startDate, '2009-08-13');
    assert.equal(periods[3].endDate, '2016-08-12');

    // 8 | 13 Aug 2016 | 12 Aug 2024
    assert.equal(periods[4].number, 8);
    assert.equal(periods[4].startDate, '2016-08-13');
    assert.equal(periods[4].endDate, '2024-08-12');

    // 9 | 13 Aug 2024 | 12 Aug 2033
    assert.equal(periods[5].number, 9);
    assert.equal(periods[5].startDate, '2024-08-13');
    assert.equal(periods[5].endDate, '2033-08-12');

    // 1 | 13 Aug 2033 | 12 Aug 2034
    assert.equal(periods[6].number, 1);
    assert.equal(periods[6].startDate, '2033-08-13');
    assert.equal(periods[6].endDate, '2034-08-12');

    // 2 | 13 Aug 2034 | 12 Aug 2036
    assert.equal(periods[7].number, 2);
    assert.equal(periods[7].startDate, '2034-08-13');
    assert.equal(periods[7].endDate, '2036-08-12');

    // 3 | 13 Aug 2036 | 12 Aug 2039
    assert.equal(periods[8].number, 3);
    assert.equal(periods[8].startDate, '2036-08-13');
    assert.equal(periods[8].endDate, '2039-08-12');
  });

  it('restarts from Basic Number (4) at age 45 (13 Aug 2039)', () => {
    assert.equal(periods[9].number, 4);
    assert.equal(periods[9].startDate, '2039-08-13');
    assert.equal(periods[9].endDate, '2043-08-12');
    assert.equal(periods[9].isRestartAt45, true);
    assert.equal(periods[9].ageAtStart, 45);
  });

  it('retrieves active Mahadasha correctly for target date 2026-08-13', () => {
    const active = getActiveMahadasha(periods, '2026-08-13');
    assert.equal(active?.number, 9);
    assert.equal(active?.startDate, '2024-08-13');
    assert.equal(active?.endDate, '2033-08-12');
  });
});

describe('6. Personal Year / Antardasha (Section 11)', () => {
  it('calculates Personal Year for 13 Aug 2026 to 12 Aug 2027 as 5', () => {
    const py = calculatePersonalYearForBirthday('1994-08-13', 2026);
    assert.equal(py.startDate, '2026-08-13');
    assert.equal(py.endDate, '2027-08-12');
    assert.equal(py.birthdayWeekday, 'Thursday');
    assert.equal(py.birthdayWeekdayNumber, 3); // Thursday is 3
    assert.equal(py.calculationSum, 23); // 1 + 3 + 8 + 2 + 6 + 3 = 23
    assert.equal(py.personalYearNumber, 5); // 2 + 3 = 5
  });

  it('determines active personal year for date within period', () => {
    const py = getActivePersonalYear('1994-08-13', '2026-10-15');
    assert.equal(py.personalYearNumber, 5);
    assert.equal(py.calendarYear, 2026);
  });

  it('determines active personal year for date before birthday in same year', () => {
    const py = getActivePersonalYear('1994-08-13', '2026-05-10');
    assert.equal(py.calendarYear, 2025);
  });
});

describe('7. Pratyantar Dasha (Section 13)', () => {
  const periods = calculatePratyantarPeriods('2026-08-13', '2027-08-12', 5);

  it('generates 9 active periods plus 1 blank remainder period', () => {
    assert.equal(periods.length, 10);
  });

  it('matches all specified Pratyantar dates and durations from Section 13 exactly', () => {
    // 5 | 13 Aug 2026 | 21 Sep 2026 | 40 days
    assert.equal(periods[0].pratyantarNumber, 5);
    assert.equal(periods[0].startDate, '2026-08-13');
    assert.equal(periods[0].endDate, '2026-09-21');
    assert.equal(periods[0].durationDays, 40);

    // 6 | 22 Sep 2026 | 08 Nov 2026 | 48 days
    assert.equal(periods[1].pratyantarNumber, 6);
    assert.equal(periods[1].startDate, '2026-09-22');
    assert.equal(periods[1].endDate, '2026-11-08');
    assert.equal(periods[1].durationDays, 48);

    // 7 | 09 Nov 2026 | 03 Jan 2027 | 56 days
    assert.equal(periods[2].pratyantarNumber, 7);
    assert.equal(periods[2].startDate, '2026-11-09');
    assert.equal(periods[2].endDate, '2027-01-03');
    assert.equal(periods[2].durationDays, 56);

    // 8 | 04 Jan 2027 | 08 Mar 2027 | 64 days
    assert.equal(periods[3].pratyantarNumber, 8);
    assert.equal(periods[3].startDate, '2027-01-04');
    assert.equal(periods[3].endDate, '2027-03-08');
    assert.equal(periods[3].durationDays, 64);

    // 9 | 09 Mar 2027 | 19 May 2027 | 72 days
    assert.equal(periods[4].pratyantarNumber, 9);
    assert.equal(periods[4].startDate, '2027-03-09');
    assert.equal(periods[4].endDate, '2027-05-19');
    assert.equal(periods[4].durationDays, 72);

    // 1 | 20 May 2027 | 27 May 2027 | 8 days
    assert.equal(periods[5].pratyantarNumber, 1);
    assert.equal(periods[5].startDate, '2027-05-20');
    assert.equal(periods[5].endDate, '2027-05-27');
    assert.equal(periods[5].durationDays, 8);

    // 2 | 28 May 2027 | 12 Jun 2027 | 16 days
    assert.equal(periods[6].pratyantarNumber, 2);
    assert.equal(periods[6].startDate, '2027-05-28');
    assert.equal(periods[6].endDate, '2027-06-12');
    assert.equal(periods[6].durationDays, 16);

    // 3 | 13 Jun 2027 | 06 Jul 2027 | 24 days
    assert.equal(periods[7].pratyantarNumber, 3);
    assert.equal(periods[7].startDate, '2027-06-13');
    assert.equal(periods[7].endDate, '2027-07-06');
    assert.equal(periods[7].durationDays, 24);

    // 4 | 07 Jul 2027 | 07 Aug 2027 | 32 days
    assert.equal(periods[8].pratyantarNumber, 4);
    assert.equal(periods[8].startDate, '2027-07-07');
    assert.equal(periods[8].endDate, '2027-08-07');
    assert.equal(periods[8].durationDays, 32);

    // Blank | 08 Aug 2027 | 12 Aug 2027 | 5 days
    assert.equal(periods[9].isBlank, true);
    assert.equal(periods[9].startDate, '2027-08-08');
    assert.equal(periods[9].endDate, '2027-08-12');
    assert.equal(periods[9].durationDays, 5);
  });

  it('sums exactly to 360 days for active periods + 5 blank days = 365 total', () => {
    const activeDaysSum = periods.slice(0, 9).reduce((sum, p) => sum + p.durationDays, 0);
    assert.equal(activeDaysSum, 360);
    assert.equal(periods[9].durationDays, 5);
  });
});

describe('8. Day Lord Calculation (Section 14 & Addendum 1)', () => {
  it('calculates Day Lord for 13 Aug 2026 (Pratyantar 5 + Thursday 3 = 8)', () => {
    const dayLord = calculateDayLord('2026-08-13', 5);
    assert.equal(dayLord.weekday, 'Thursday');
    assert.equal(dayLord.weekdayNumber, 3);
    assert.equal(dayLord.rawSum, 8);
    assert.equal(dayLord.dayLordNumber, 8);
  });

  it('calculates Day Lord with reduction > 10 (Pratyantar 8 + Friday 6 = 14 -> 5)', () => {
    const dayLord = calculateDayLord('2026-08-14', 8); // 14 Aug 2026 is Friday
    assert.equal(dayLord.weekday, 'Friday');
    assert.equal(dayLord.weekdayNumber, 6);
    assert.equal(dayLord.rawSum, 14);
    assert.equal(dayLord.dayLordNumber, 5); // 1 + 4 = 5
  });

  it('calculates Day Lord with sum equal to 10 (Pratyantar 8 + Monday 2 = 10 -> 1)', () => {
    const dayLord = calculateDayLord('2026-08-17', 8); // 17 Aug 2026 is Monday
    assert.equal(dayLord.weekday, 'Monday');
    assert.equal(dayLord.weekdayNumber, 2);
    assert.equal(dayLord.rawSum, 10);
    assert.equal(dayLord.dayLordNumber, 1); // 1 + 0 = 1
  });
});

describe('9. Annual Grid & Daily Grid Integration', () => {
  const natalResult = calculateNatalGrid({
    fullName: 'Test User',
    dateOfBirth: '1994-08-13',
  });

  it('creates Annual Grid containing Natal, Mahadasha, and Personal Year', () => {
    const annualResult = calculateAnnualGrid(
      natalResult.grid,
      9,
      5,
      '2026-08-13',
      '2027-08-12'
    );

    const cell9 = annualResult.annualGrid.cells.find((c) => c.positionNumber === 9);
    assert.equal(cell9?.items.length, 2);
    assert.equal(cell9?.items.some((i) => i.source === 'mahadasha'), true);

    const cell5 = annualResult.annualGrid.cells.find((c) => c.positionNumber === 5);
    assert.equal(cell5?.items.length, 1);
    assert.equal(cell5?.items[0].source, 'personal_year');
  });

  it('creates Daily Grid with Natal, Mahadasha, Personal Year, Pratyantar, and Day Lord', () => {
    const dailyResult = calculateDailyGrid(
      natalResult.grid,
      9,
      5,
      5,
      8,
      '2026-08-13',
      'Thursday'
    );

    const cell8 = dailyResult.dailyGrid.cells.find((c) => c.positionNumber === 8);
    assert.equal(cell8?.items.length, 3);
    assert.equal(
      cell8?.items.filter((i) => i.source === 'natal' || i.source === 'destiny').length,
      2
    );
    assert.equal(cell8?.items.filter((i) => i.source === 'day_lord').length, 1);

    const cell5 = dailyResult.dailyGrid.cells.find((c) => c.positionNumber === 5);
    assert.equal(cell5?.items.length, 2);
  });
});

describe('10. 100-Year Timeline (Section 16)', () => {
  it('generates 100 annual periods from birth to age 99', () => {
    const timeline = calculateHundredYearTimeline('1994-08-13', 4);
    assert.equal(timeline.timelineYears.length, 100);

    // First year: Age 0, 1994-08-13 to 1995-08-12
    assert.equal(timeline.timelineYears[0].age, 0);
    assert.equal(timeline.timelineYears[0].startDate, '1994-08-13');
    assert.equal(timeline.timelineYears[0].endDate, '1995-08-12');
    assert.equal(timeline.timelineYears[0].mahadashaNumber, 4);

    // Age 45 (year 2039) restarts Mahadasha from 4
    assert.equal(timeline.timelineYears[45].age, 45);
    assert.equal(timeline.timelineYears[45].startDate, '2039-08-13');
    assert.equal(timeline.timelineYears[45].mahadashaNumber, 4);

    // Last year: Age 99, ends 2094-08-12
    assert.equal(timeline.timelineYears[99].age, 99);
    assert.equal(timeline.timelineYears[99].endDate, '2094-08-12');
    assert.equal(timeline.endDate, '2094-08-12');
  });
});
