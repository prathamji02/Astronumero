export type NavigationTab =
  | 'dashboard'
  | 'new_chart'
  | 'natal'
  | 'basic'
  | 'destiny'
  | 'mahadasha'
  | 'personal_year'
  | 'pratyantar'
  | 'daily'
  | 'timeline'
  | 'saved_charts'
  | 'compare'
  | 'profile'
  | 'admin';

export interface User {
  id: string;
  email: string | null;
  mobile: string | null;
  fullName: string;
  role: 'user' | 'super_admin' | 'admin' | 'support_admin';
  status: 'active' | 'suspended' | 'deactivated';
}

export interface UserProfile {
  date_of_birth: string | null;
  time_of_birth: string | null;
  place_of_birth: string | null;
  basic_number: number | null;
  destiny_number: number | null;
  profile_photo_url: string | null;
  timezone: string;
  language: string;
  updated_at: string;
}

export interface UserSubscription {
  subscriptionId: string;
  planId: string;
  planSlug: string;
  planName: string;
  status: 'active' | 'expired' | 'cancelled' | 'suspended' | 'trial';
  startDate: string;
  endDate: string;
  maxSavedCharts: number;
  allowComparison: boolean;
  allow100YearTimeline: boolean;
  allowExport: boolean;
}

export interface GridItem {
  value: number;
  source: 'natal' | 'basic' | 'destiny' | 'mahadasha' | 'personal_year' | 'pratyantar' | 'day_lord';
}

export interface GridCell {
  positionNumber: number;
  row: number;
  col: number;
  items: GridItem[];
}

export interface PratyantarPeriod {
  periodOrder: number;
  pratyantarNumber: number | null;
  durationDays: number;
  startDate: string;
  endDate: string;
  isBlank: boolean;
}

export interface NumerologyGrid {
  cells: GridCell[];
  allNumbers: GridItem[];
}

export interface CalculatedData {
  birthInput: {
    fullName: string;
    dateOfBirth: string;
    timeOfBirth?: string;
    placeOfBirth?: string;
  };
  targetDate: string;
  natal: {
    basicNumber: number;
    destinyNumber: number;
    centuryDigitsExcluded: string;
    remainingYearDigits: string;
    includedDateDigits: number[];
    finalNatalDigits: GridItem[];
    grid: NumerologyGrid;
  };
  mahadasha: {
    periods: Array<{
      cycle: number;
      number: number;
      startDate: string;
      endDate: string;
      durationYears: number;
      ageAtStart: number;
      ageAtEnd: number;
      isRestartAt45?: boolean;
    }>;
    active: {
      number: number;
      startDate: string;
      endDate: string;
      durationYears: number;
      ageAtStart: number;
      ageAtEnd: number;
    };
  };
  personalYear: {
    calendarYear: number;
    startDate: string;
    endDate: string;
    birthdayWeekday: string;
    birthdayWeekdayNumber: number;
    calculationSum: number;
    personalYearNumber: number;
  };
  pratyantar: {
    periods: Array<{
      periodOrder: number;
      pratyantarNumber: number | null;
      durationDays: number;
      startDate: string;
      endDate: string;
      isBlank: boolean;
    }>;
    active: {
      periodOrder: number;
      pratyantarNumber: number | null;
      durationDays: number;
      startDate: string;
      endDate: string;
      isBlank: boolean;
    } | null;
  };
  dayLord: {
    date: string;
    weekday: string;
    weekdayNumber: number;
    activePratyantarNumber: number;
    rawSum: number;
    dayLordNumber: number;
  } | null;
  annualGrid: {
    annualGrid: NumerologyGrid;
    startDate: string;
    endDate: string;
  };
  dailyGrid: {
    dailyGrid: NumerologyGrid;
    date: string;
    weekday: string;
  };
}
