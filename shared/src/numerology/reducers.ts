/**
 * Reduces any positive integer to a single digit (1-9) by repeatedly summing its digits.
 * If input is 0, returns 0.
 * Examples:
 *  14 -> 1 + 4 = 5
 *  35 -> 3 + 5 = 8
 *  23 -> 2 + 3 = 5
 *  99 -> 18 -> 9
 */
export function reduceToSingleDigit(num: number): number {
  if (num <= 0) return 0;
  let current = Math.floor(Math.abs(num));
  while (current > 9) {
    let sum = 0;
    while (current > 0) {
      sum += current % 10;
      current = Math.floor(current / 10);
    }
    current = sum;
  }
  return current;
}

/**
 * Extracts all non-zero digits from a string or number.
 */
export function extractDigits(value: string | number): number[] {
  return String(value)
    .replace(/\D/g, '')
    .split('')
    .map(Number);
}

/**
 * Formats a Date object as YYYY-MM-DD using local/UTC date components safely.
 */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Formats any Date object or ISO / YYYY-MM-DD date string to DD-MM-YYYY format.
 */
export function formatToDDMMYYYY(dateInput: Date | string): string {
  if (!dateInput) return '';
  if (dateInput instanceof Date) {
    const y = dateInput.getFullYear();
    const m = String(dateInput.getMonth() + 1).padStart(2, '0');
    const d = String(dateInput.getDate()).padStart(2, '0');
    return `${d}-${m}-${y}`;
  }
  const clean = String(dateInput).split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD -> DD-MM-YYYY
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    } else if (parts[2].length === 4) {
      // already DD-MM-YYYY
      return `${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[2]}`;
    }
  }
  return clean;
}

/**
 * Converts DD-MM-YYYY string to standard YYYY-MM-DD for backend APIs.
 */
export function formatToYYYYMMDD(dateInput: string): string {
  if (!dateInput) return '';
  const clean = dateInput.trim();
  const parts = clean.split('-');
  if (parts.length === 3 && parts[2].length === 4) {
    // DD-MM-YYYY -> YYYY-MM-DD
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return clean;
}

/**
 * Parses a YYYY-MM-DD string into a safe Date object (at 12:00:00 local to avoid timezone drift).
 */
export function parseDate(dateStr: string): Date {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);
  return new Date(year, month, day, 12, 0, 0, 0);
}

/**
 * Adds days to a Date object.
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Adds years to a Date object.
 */
export function addYears(date: Date, years: number): Date {
  const result = new Date(date.getTime());
  result.setFullYear(result.getFullYear() + years);
  return result;
}
