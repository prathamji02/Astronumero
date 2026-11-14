import { describe, it, expect } from 'vitest';
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
} from '../src/index.js';

describe('1. Single Digit Reduction (reduceToSingleDigit)', () => {
  it('handles sums below 10 correctly', () => {
    expect(reduceToSingleDigit(1)).toBe(1);
    expect(reduceToSingleDigit(5)).toBe(5);
    expect(reduceToSingleDigit(9)).toBe(9);
    expect(reduceToSingleDigit(8)).toBe(8);
  });

  it('handles sums equal to 10 correctly', () => {
    expect(reduceToSingleDigit(10)).toBe(1); // 1 + 0 = 1
  });

  it('handles sums greater than 10 correctly', () => {
    expect(reduceToSingleDigit(14)).toBe(5); // 1 + 4 = 5 (Prompt Addendum Example)
    expect(reduceToSingleDigit(23)).toBe(5); // 2 + 3 = 5 (Prompt Example)
    expect(reduceToSingleDigit(35)).toBe(8); // 3 + 5 = 8 (Prompt Example)
    expect(reduceToSingleDigit(99)).toBe(9); // 9 + 9 = 18 -> 1 + 8 = 9
  });
});

describe('2. Basic Number / Mulank (Section 9.1)', () => {
  it('calculates Basic Number for 13th of month as 4 (1 + 3)', () => {
    expect(calculateBasicNumber(13)).toBe(4);
  });

  it('calculates Basic Number for 28th as 1 (2 + 8 = 10 -> 1)', () => {
    expect(calculateBasicNumber(28)).toBe(1);
  });

  it('calculates single-digit days directly', () => {
    expect(calculateBasicNumber(7)).toBe(7);
  });
});

describe('3. Destiny Number / Bhagyank (Section 9.2)', () => {
  it('calculates Destiny Number for 1994-08-13 as 8 (35 -> 8)', () => {
    // 1 + 3 + 0 + 8 + 1 + 9 + 9 + 4 = 35 -> 3 + 5 = 8
    expect(calculateDestinyNumber('1994-08-13')).toBe(8);
  });
});

describe('4. Natal Grid (Section 9.3)', () => {
  const result = calculateNatalGrid({
    fullName: 'Test User',
    dateOfBirth: '1994-08-13',
  });

  it('excludes century digits "19" from 1994 and keeps "94"', () => {
    expect(result.centuryDigitsExcluded).toBe('19');
    expect(result.remainingYearDigits).toBe('94');
  });

  it('includes non-zero date digits [1, 3, 8, 9, 4]', () => {
    expect(result.includedDateDigits).toEqual([1, 3, 8, 9, 4]);
  });

  it('adds Basic Number (4) and Destiny Number (8)', () => {
    expect(result.basicNumber).toBe(4);
    expect(result.destinyNumber).toBe(8);
  });

  it('has final natal digits containing 1, 3, 8, 9, 4, 4, 8 with repeated occurrences', () => {
    const values = result.finalNatalDigits.map((i) => i.value).sort();
    expect(values).toEqual([1, 3, 4, 4, 8, 8, 9]);
  });

  it('places numbers in the exact fixed 3x3 layout with repeated occurrences', () => {
    // Find cell for position 4 (row 2, col 2)
    const cell4 = result.grid.cells.find((c) => c.positionNumber === 4);
    expect(cell4?.items).toHaveLength(2); // 44
    expect(cell4?.items.map((i) => i.value)).toEqual([4, 4]);

    // Find cell for position 8 (row 2, col 1)
    const cell8 = result.grid.cells.find((c) => c.positionNumber === 8);
    expect(cell8?.items).toHaveLength(2); // 88
    expect(cell8?.items.map((i) => i.value)).toEqual([8, 8]);

    // Check cells 2, 5, 6, 7 are empty
    for (const emptyPos of [2, 5, 6, 7]) {
      const cell = result.grid.cells.find((c) => c.positionNumber === emptyPos);
      expect(cell?.items).toHaveLength(0);
    }

    // Cells 1, 3, 9 each have 1 item
    for (const singlePos of [1, 3, 9]) {
      const cell = result.grid.cells.find((c) => c.positionNumber === singlePos);
      expect(cell?.items).toHaveLength(1);
      expect(cell?.items[0].value).toBe(singlePos);
    }
  });
});

describe('5. Mahadasha Calculation (Section 10)', () => {
  const periods = calculateMahadashaPeriods('1994-08-13', 4, 100);

  it('matches all specified periods from Section 10', () => {
    // 4 | 13 Aug 1994 | 12 Aug 1998
    expect(periods[0].number).toBe(4);
    expect(periods[0].startDate).toBe('1994-08-13');
    expect(periods[0].endDate).toBe('1998-08-12');
    expect(periods[0].durationYears).toBe(4);

    // 5 | 13 Aug 1998 | 12 Aug 2003
    expect(periods[1].number).toBe(5);
    expect(periods[1].startDate).toBe('1998-08-13');
    expect(periods[1].endDate).toBe('2003-08-12');

    // 6 | 13 Aug 2003 | 12 Aug 2009
    expect(periods[2].number).toBe(6);
    expect(periods[2].startDate).toBe('2003-08-13');
    expect(periods[2].endDate).toBe('2009-08-12');

    // 7 | 13 Aug 2009 | 12 Aug 2016
    expect(periods[3].number).toBe(7);
    expect(periods[3].startDate).toBe('2009-08-13');
    expect(periods[3].endDate).toBe('2016-08-12');

    // 8 | 13 Aug 2016 | 12 Aug 2024
    expect(periods[4].number).toBe(8);
    expect(periods[4].startDate).toBe('2016-08-13');
    expect(periods[4].endDate).toBe('2024-08-12');

    // 9 | 13 Aug 2024 | 12 Aug 2033
    expect(periods[5].number).toBe(9);
    expect(periods[5].startDate).toBe('2024-08-13');
    expect(periods[5].endDate).toBe('2033-08-12');

    // 1 | 13 Aug 2033 | 12 Aug 2034
    expect(periods[6].number).toBe(1);
    expect(periods[6].startDate).toBe('2033-08-13');
    expect(periods[6].endDate).toBe('2034-08-12');

    // 2 | 13 Aug 2034 | 12 Aug 2036
    expect(periods[7].number).toBe(2);
    expect(periods[7].startDate).toBe('2034-08-13');
    expect(periods[7].endDate).toBe('2036-08-12');

    // 3 | 13 Aug 2036 | 12 Aug 2039
    expect(periods[8].number).toBe(3);
    expect(periods[8].startDate).toBe('2036-08-13');
    expect(periods[8].endDate).toBe('2039-08-12');
  });

  it('restarts from Basic Number (4) at age 45 (13 Aug 2039)', () => {
    // Period index 9 is at age 45
    expect(periods[9].number).toBe(4);
    expect(periods[9].startDate).toBe('2039-08-13');
    expect(periods[9].endDate).toBe('2043-08-12');
    expect(periods[9].isRestartAt45).toBe(true);
    expect(periods[9].ageAtStart).toBe(45);
  });

  it('retrieves active Mahadasha correctly for target date 2026-08-13', () => {
    const active = getActiveMahadasha(periods, '2026-08-13');
    expect(active?.number).toBe(9);
    expect(active?.startDate).toBe('2024-08-13');
    expect(active?.endDate).toBe('2033-08-12');
  });
});

describe('6. Personal Year / Antardasha (Section 11)', () => {
  it('calculates Personal Year for 13 Aug 2026 to 12 Aug 2027 as 5', () => {
    const py = calculatePersonalYearForBirthday('1994-08-13', 2026);
    expect(py.startDate).toBe('2026-08-13');
    expect(py.endDate).toBe('2027-08-12');
    expect(py.birthdayWeekday).toBe('Thursday');
    expect(py.birthdayWeekdayNumber).toBe(3); // Thursday is 3
    expect(py.calculationSum).toBe(23); // 1 + 3 + 8 + 2 + 6 + 3 = 23
    expect(py.personalYearNumber).toBe(5); // 2 + 3 = 5
  });

  it('determines active personal year for date within period', () => {
    const py = getActivePersonalYear('1994-08-13', '2026-10-15');
    expect(py.personalYearNumber).toBe(5);
    expect(py.calendarYear).toBe(2026);
  });

  it('determines active personal year for date before birthday in same year', () => {
    // 2026-05-10 is before 2026-08-13 birthday, so active year is based on 2025 birthday
    const py = getActivePersonalYear('1994-08-13', '2026-05-10');
    expect(py.calendarYear).toBe(2025);
  });
});

describe('7. Pratyantar Dasha (Section 13)', () => {
  const periods = calculatePratyantarPeriods('2026-08-13', '2027-08-12', 5);

  it('generates 9 active periods plus 1 blank remainder period', () => {
    expect(periods).toHaveLength(10);
  });

  it('matches all specified Pratyantar dates and durations from Section 13 exactly', () => {
    // 5 | 13 Aug 2026 | 21 Sep 2026 | 40 days
    expect(periods[0].pratyantarNumber).toBe(5);
    expect(periods[0].startDate).toBe('2026-08-13');
    expect(periods[0].endDate).toBe('2026-09-21');
    expect(periods[0].durationDays).toBe(40);

    // 6 | 22 Sep 2026 | 08 Nov 2026 | 48 days
    expect(periods[1].pratyantarNumber).toBe(6);
    expect(periods[1].startDate).toBe('2026-09-22');
    expect(periods[1].endDate).toBe('2026-11-08');
    expect(periods[1].durationDays).toBe(48);

    // 7 | 09 Nov 2026 | 03 Jan 2027 | 56 days
    expect(periods[2].pratyantarNumber).toBe(7);
    expect(periods[2].startDate).toBe('2026-11-09');
    expect(periods[2].endDate).toBe('2027-01-03');
    expect(periods[2].durationDays).toBe(56);

    // 8 | 04 Jan 2027 | 08 Mar 2027 | 64 days
    expect(periods[3].pratyantarNumber).toBe(8);
    expect(periods[3].startDate).toBe('2027-01-04');
    expect(periods[3].endDate).toBe('2027-03-08');
    expect(periods[3].durationDays).toBe(64);

    // 9 | 09 Mar 2027 | 19 May 2027 | 72 days
    expect(periods[4].pratyantarNumber).toBe(9);
    expect(periods[4].startDate).toBe('2027-03-09');
    expect(periods[4].endDate).toBe('2027-05-19');
    expect(periods[4].durationDays).toBe(72);

    // 1 | 20 May 2027 | 27 May 2027 | 8 days
    expect(periods[5].pratyantarNumber).toBe(1);
    expect(periods[5].startDate).toBe('2027-05-20');
    expect(periods[5].endDate).toBe('2027-05-27');
    expect(periods[5].durationDays).toBe(8);

    // 2 | 28 May 2027 | 12 Jun 2027 | 16 days
    expect(periods[6].pratyantarNumber).toBe(2);
    expect(periods[6].startDate).toBe('2027-05-28');
    expect(periods[6].endDate).toBe('2027-06-12');
    expect(periods[6].durationDays).toBe(16);

    // 3 | 13 Jun 2027 | 06 Jul 2027 | 24 days
    expect(periods[7].pratyantarNumber).toBe(3);
    expect(periods[7].startDate).toBe('2027-06-13');
    expect(periods[7].endDate).toBe('2027-07-06');
    expect(periods[7].durationDays).toBe(24);

    // 4 | 07 Jul 2027 | 07 Aug 2027 | 32 days
    expect(periods[8].pratyantarNumber).toBe(4);
    expect(periods[8].startDate).toBe('2027-07-07');
    expect(periods[8].endDate).toBe('2027-08-07');
    expect(periods[8].durationDays).toBe(32);

    // Blank | 08 Aug 2027 | 12 Aug 2027 | 5 days
    expect(periods[9].isBlank).toBe(true);
    expect(periods[9].startDate).toBe('2027-08-08');
    expect(periods[9].endDate).toBe('2027-08-12');
    expect(periods[9].durationDays).toBe(5);
  });

  it('sums exactly to 360 days for active periods + 5 blank days = 365 total', () => {
    const activeDaysSum = periods.slice(0, 9).reduce((sum, p) => sum + p.durationDays, 0);
    expect(activeDaysSum).toBe(360);
    expect(periods[9].durationDays).toBe(5);
  });
});

describe('8. Day Lord Calculation (Section 14 & Addendum 1)', () => {
  it('calculates Day Lord for 13 Aug 2026 (Pratyantar 5 + Thursday 3 = 8)', () => {
    const dayLord = calculateDayLord('2026-08-13', 5);
    expect(dayLord.weekday).toBe('Thursday');
    expect(dayLord.weekdayNumber).toBe(3);
    expect(dayLord.rawSum).toBe(8);
    expect(dayLord.dayLordNumber).toBe(8);
  });

  it('calculates Day Lord with reduction > 10 (Pratyantar 8 + Friday 6 = 14 -> 5)', () => {
    const dayLord = calculateDayLord('2026-08-14', 8); // 14 Aug 2026 is Friday
    expect(dayLord.weekday).toBe('Friday');
    expect(dayLord.weekdayNumber).toBe(6);
    expect(dayLord.rawSum).toBe(14);
    expect(dayLord.dayLordNumber).toBe(5); // 1 + 4 = 5
  });

  it('calculates Day Lord with sum equal to 10 (Pratyantar 8 + Monday 2 = 10 -> 1)', () => {
    const dayLord = calculateDayLord('2026-08-17', 8); // 17 Aug 2026 is Monday
    expect(dayLord.weekday).toBe('Monday');
    expect(dayLord.weekdayNumber).toBe(2);
    expect(dayLord.rawSum).toBe(10);
    expect(dayLord.dayLordNumber).toBe(1); // 1 + 0 = 1
  });
});

describe('9. Annual Grid & Daily Grid Integration', () => {
  const natalResult = calculateNatalGrid({
    fullName: 'Test User',
    dateOfBirth: '1994-08-13',
  });

  it('creates Annual Grid containing Natal, Mahadasha, and Personal Year', () => {
    // 2026: Mahadasha = 9, Personal Year = 5
    const annualResult = calculateAnnualGrid(
      natalResult.grid,
      9,
      5,
      '2026-08-13',
      '2027-08-12'
    );

    // Number 9 should appear twice: once from Natal, once from Mahadasha
    const cell9 = annualResult.annualGrid.cells.find((c) => c.positionNumber === 9);
    expect(cell9?.items).toHaveLength(2);
    expect(cell9?.items.some((i) => i.source === 'mahadasha')).toBe(true);

    // Number 5 should appear once (from Personal Year)
    const cell5 = annualResult.annualGrid.cells.find((c) => c.positionNumber === 5);
    expect(cell5?.items).toHaveLength(1);
    expect(cell5?.items[0].source).toBe('personal_year');
  });

  it('creates Daily Grid with Natal, Mahadasha, Personal Year, Pratyantar, and Day Lord', () => {
    // Date 2026-08-13: Mahadasha=9, Personal Year=5, Pratyantar=5, Day Lord=8
    const dailyResult = calculateDailyGrid(
      natalResult.grid,
      9,
      5,
      5,
      8,
      '2026-08-13',
      'Thursday'
    );

    // Number 8 has 2 from natal + 1 from Day Lord = 3 total items
    const cell8 = dailyResult.dailyGrid.cells.find((c) => c.positionNumber === 8);
    expect(cell8?.items).toHaveLength(3);
    expect(cell8?.items.filter((i) => i.source === 'natal' || i.source === 'destiny')).toHaveLength(2);
    expect(cell8?.items.filter((i) => i.source === 'day_lord')).toHaveLength(1);

    // Number 5 has 1 from Personal Year + 1 from Pratyantar = 2 total items
    const cell5 = dailyResult.dailyGrid.cells.find((c) => c.positionNumber === 5);
    expect(cell5?.items).toHaveLength(2);
  });
});

describe('10. 100-Year Timeline (Section 16)', () => {
  it('generates 100 annual periods from birth to age 99', () => {
    const timeline = calculateHundredYearTimeline('1994-08-13', 4);
    expect(timeline.timelineYears).toHaveLength(100);

    // First year: Age 0, 1994-08-13 to 1995-08-12
    expect(timeline.timelineYears[0].age).toBe(0);
    expect(timeline.timelineYears[0].startDate).toBe('1994-08-13');
    expect(timeline.timelineYears[0].endDate).toBe('1995-08-12');
    expect(timeline.timelineYears[0].mahadashaNumber).toBe(4);

    // Age 45 (year 2039) restarts Mahadasha from 4
    expect(timeline.timelineYears[45].age).toBe(45);
    expect(timeline.timelineYears[45].startDate).toBe('2039-08-13');
    expect(timeline.timelineYears[45].mahadashaNumber).toBe(4);

    // Last year: Age 99, ends 2094-08-12
    expect(timeline.timelineYears[99].age).toBe(99);
    expect(timeline.timelineYears[99].endDate).toBe('2094-08-12');
    expect(timeline.endDate).toBe('2094-08-12');
  });
});
