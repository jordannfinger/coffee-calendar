/**
 * Calendar-date (not instant-in-time) helpers.
 *
 * Every date in this module is treated as a *calendar date* — a day, with no
 * meaningful time-of-day or timezone component. We deliberately avoid
 * `toISOString()` / UTC conversion for these values because that can shift
 * the displayed day by one depending on the user's local timezone offset.
 * Instead we construct and format dates using local-calendar components only,
 * so "12 September" always means the same calendar day everywhere.
 */

/** Parses a "YYYY-MM-DD" string into a local-midnight Date (no TZ shifting). */
export function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Formats a Date as "YYYY-MM-DD" using local calendar components. */
export function formatDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Returns a new Date with time-of-day stripped to local midnight. */
export function toDateOnly(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Adds (or subtracts, if negative) whole calendar days to a date. */
export function addCalendarDays(date: Date, days: number): Date {
  const result = toDateOnly(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** Difference in whole calendar days between two dates (b - a). */
export function differenceInCalendarDays(a: Date, b: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / msPerDay);
}

export function isBeforeDay(a: Date, b: Date): boolean {
  return differenceInCalendarDays(a, b) > 0;
}

export function isAfterDay(a: Date, b: Date): boolean {
  return differenceInCalendarDays(a, b) < 0;
}

export function isSameDay(a: Date, b: Date): boolean {
  return differenceInCalendarDays(a, b) === 0;
}

/** Clamp a date to be within [min, max] (inclusive), by calendar day. */
export function clampDate(date: Date, min: Date, max: Date): Date {
  if (isBeforeDay(date, min)) return toDateOnly(min);
  if (isAfterDay(date, max)) return toDateOnly(max);
  return toDateOnly(date);
}

export function today(): Date {
  return toDateOnly(new Date());
}

const WEEKDAY_MONTH_DAY = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
});

const MONTH_DAY = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

const MONTH_DAY_YEAR = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function formatShort(date: Date): string {
  return MONTH_DAY.format(date);
}

export function formatLong(date: Date): string {
  return MONTH_DAY_YEAR.format(date);
}

export function formatWithWeekday(date: Date): string {
  return WEEKDAY_MONTH_DAY.format(date);
}
