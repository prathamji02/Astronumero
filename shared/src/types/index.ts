export type NumberSource =
  | 'natal'
  | 'basic'
  | 'destiny'
  | 'mahadasha'
  | 'personal_year'
  | 'pratyantar'
  | 'day_lord';

export interface GridNumberItem {
  value: number;
  source: NumberSource;
}

export interface GridCell {
  positionNumber: number; // 1 to 9
  row: number; // 0 to 2
  col: number; // 0 to 2
  items: GridNumberItem[];
}

export interface NumerologyGrid {
  cells: GridCell[]; // Array of 9 cells (positions 1 through 9)
  allNumbers: GridNumberItem[];
}

export interface BirthInput {
  fullName: string;
  dateOfBirth: string; // YYYY-MM-DD
  timeOfBirth?: string; // HH:mm
  placeOfBirth?: string;
}

export interface NatalCalculationResult {
  birthInput: BirthInput;
  basicNumber: number;
  destinyNumber: number;
  centuryDigitsExcluded: string;
  remainingYearDigits: string;
  includedDateDigits: number[];
  finalNatalDigits: GridNumberItem[];
  grid: NumerologyGrid;
}

export interface MahadashaPeriod {
  cycle: number;
  number: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  durationYears: number;
  ageAtStart: number;
  ageAtEnd: number;
  isRestartAt45?: boolean;
}

export interface PersonalYearCalculation {
  calendarYear: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  birthdayDate: string; // YYYY-MM-DD
  birthdayWeekday: string;
  birthdayWeekdayNumber: number;
  birthDayDigits: number[];
  birthMonthDigits: number[];
  yearLastTwoDigits: number[];
  calculationSum: number;
  personalYearNumber: number;
}

export interface PratyantarPeriod {
  periodOrder: number; // 1 to 9 (or 10 for blank remainder)
  pratyantarNumber: number | null; // null if blank
  durationDays: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  isBlank: boolean;
}

export interface DayLordCalculation {
  date: string; // YYYY-MM-DD
  weekday: string;
  weekdayNumber: number;
  activePratyantarNumber: number;
  rawSum: number;
  dayLordNumber: number;
}

export interface AnnualGridResult {
  startDate: string;
  endDate: string;
  natalGrid: NumerologyGrid;
  activeMahadasha: number;
  activePersonalYear: number;
  annualGrid: NumerologyGrid;
}

export interface DailyGridResult {
  date: string;
  weekday: string;
  activeMahadasha: number;
  activePersonalYear: number;
  activePratyantar: number;
  dayLord: number;
  dailyGrid: NumerologyGrid;
}

export interface TimelineYearItem {
  age: number;
  calendarYear: number;
  startDate: string;
  endDate: string;
  mahadashaNumber: number;
  personalYearNumber: number;
  pratyantarPeriods: PratyantarPeriod[];
}

export interface HundredYearTimelineResult {
  birthDate: string;
  endDate: string;
  timelineYears: TimelineYearItem[];
}
