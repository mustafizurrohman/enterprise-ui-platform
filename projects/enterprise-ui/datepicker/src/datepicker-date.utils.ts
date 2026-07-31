import { DateTime } from 'luxon';
import type { DatepickerWeek } from './datepicker-grid.types';
import type { LuxonFormatCapabilities } from './datepicker.types';

/**
 * Set of tokens that represent time fields in Luxon formats.
 */
const TIME_FIELD_TOKENS = new Set([
  'H',
  'HH',
  'h',
  'hh',
  'm',
  'mm',
  's',
  'ss',
  'S',
  'SSS',
  'u',
  'uu',
  'uuu',
  'a',
]);

/**
 * Set of tokens that represent second-level precision fields in Luxon formats.
 */
const SECOND_FIELD_TOKENS = new Set(['s', 'ss', 'S', 'SSS', 'u', 'uu', 'uuu']);

/**
 * Set of macro tokens that include time components in Luxon formats.
 */
const TIME_MACRO_TOKENS = new Set([
  't',
  'tt',
  'ttt',
  'tttt',
  'T',
  'TT',
  'TTT',
  'TTTT',
  'f',
  'ff',
  'fff',
  'ffff',
  'F',
  'FF',
  'FFF',
  'FFFF',
]);

/**
 * Set of macro tokens that include second-level precision in Luxon formats.
 */
const SECOND_MACRO_TOKENS = new Set([
  'tt',
  'ttt',
  'tttt',
  'TT',
  'TTT',
  'TTTT',
  'F',
  'FF',
  'FFF',
  'FFFF',
]);

/**
 * Builds a Monday-first calendar grid without rendering adjacent-month days.
 * Adjacent days are represented as null values to maintain the grid structure.
 *
 * @param viewDate The date indicating the month to build the grid for.
 * @returns An array of DatepickerWeek objects representing the calendar grid.
 */
export function buildCalendarWeeks(viewDate: DateTime): DatepickerWeek[] {
  const startOfMonth = viewDate.startOf('month');
  const cells: (DateTime | null)[] = Array.from({ length: startOfMonth.weekday - 1 }, () => null);

  for (let day = 1; day <= (startOfMonth.daysInMonth ?? 0); day++) {
    cells.push(startOfMonth.set({ day }));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return Array.from({ length: cells.length / 7 }, (_, weekIndex) => {
    const days = cells.slice(weekIndex * 7, weekIndex * 7 + 7);

    return {
      weekNumber:
        days.find((date): date is DateTime => date !== null)?.weekNumber ??
        startOfMonth.minus({ weeks: 1 }).weekNumber,
      days,
    };
  });
}

/**
 * Keeps the selected value aligned with the configured date format by stripping
 * unnecessary time components.
 *
 * @param date The date to normalize.
 * @param dateOnly Whether the format supports only date components.
 * @param showSeconds Whether the format supports second-level precision.
 * @returns A normalized DateTime object.
 */
export function normalizeDateForFormat(
  date: DateTime,
  dateOnly: boolean,
  showSeconds: boolean,
): DateTime {
  if (dateOnly) {
    return date.startOf('day');
  }

  return showSeconds ? date : date.set({ second: 0, millisecond: 0 });
}

/**
 * Analyzes a Luxon format string and its locale to determine the datepicker's
 * functional capabilities (e.g., if it has time, seconds, or uses a 12-hour clock).
 *
 * @param format The Luxon format string.
 * @param locale The locale to use for determining defaults.
 * @returns A LuxonFormatCapabilities object.
 */
export function getLuxonFormatCapabilities(
  format: string,
  locale = resolveDatepickerLocale(null),
): LuxonFormatCapabilities {
  const tokens = getUnquotedLuxonTokens(format);
  const hasTimeMacro = tokens.some((token) => TIME_MACRO_TOKENS.has(token));
  const hasExplicit12HourToken = tokens.some((token) => token === 'h' || token === 'hh');
  const hasExplicit24HourToken = tokens.some((token) => token === 'H' || token === 'HH');
  const usesLocale12HourClock = hasTimeMacro && !hasExplicit24HourToken && is12HourLocale(locale);
  const uses12HourClock = hasExplicit12HourToken || usesLocale12HourClock;

  return {
    hasTime: tokens.some((token) => TIME_FIELD_TOKENS.has(token) || TIME_MACRO_TOKENS.has(token)),
    hasSeconds: tokens.some(
      (token) => SECOND_FIELD_TOKENS.has(token) || SECOND_MACRO_TOKENS.has(token),
    ),
    uses12HourClock,
    showMeridiem:
      uses12HourClock && (tokens.includes('a') || hasExplicit12HourToken || hasTimeMacro),
  };
}

/**
 * Resolves the locale to be used by the datepicker, falling back to browser settings
 * or a default 'en-US' locale if none is provided.
 *
 * @param configuredLocale An optional explicitly configured locale.
 * @returns The resolved locale string.
 */
export function resolveDatepickerLocale(configuredLocale: string | null): string {
  const normalizedLocale = configuredLocale?.trim();

  if (normalizedLocale) {
    return normalizedLocale;
  }

  if (typeof navigator !== 'undefined') {
    const browserLocale =
      navigator.languages?.find((locale) => locale.trim().length > 0) ?? navigator.language;

    if (browserLocale?.trim()) {
      return browserLocale;
    }
  }

  return Intl.DateTimeFormat().resolvedOptions().locale || 'en-US';
}

/**
 * Determines if a given locale uses a 12-hour clock by default.
 *
 * @param locale The locale to check.
 * @returns True if the locale uses a 12-hour clock, false otherwise.
 */
function is12HourLocale(locale: string): boolean {
  const hourCycle = new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
  }).resolvedOptions().hourCycle;

  return hourCycle === 'h11' || hourCycle === 'h12';
}

/**
 * Extracts all non-literal (unquoted) tokens from a Luxon format string.
 *
 * @param format The Luxon format string.
 * @returns An array of extracted tokens.
 */
function getUnquotedLuxonTokens(format: string): string[] {
  const tokens: string[] = [];
  let insideLiteral = false;

  for (let index = 0; index < format.length; ) {
    const character = format[index];

    if (character === "'") {
      if (format[index + 1] === "'") {
        index += 2;
        continue;
      }

      insideLiteral = !insideLiteral;
      index += 1;
      continue;
    }

    if (!insideLiteral && /[A-Za-z]/u.test(character)) {
      let tokenEnd = index + 1;

      while (format[tokenEnd] === character) {
        tokenEnd += 1;
      }

      tokens.push(format.slice(index, tokenEnd));
      index = tokenEnd;
      continue;
    }

    index += 1;
  }

  return tokens;
}
