import { DateTime } from "luxon";
import type { DatepickerWeek } from "./datepicker-grid.types";
import type { LuxonFormatCapabilities } from "./datepicker.types";

const TIME_FIELD_TOKENS = new Set([
  "H",
  "HH",
  "h",
  "hh",
  "m",
  "mm",
  "s",
  "ss",
  "S",
  "SSS",
  "u",
  "uu",
  "uuu",
  "a",
]);

const SECOND_FIELD_TOKENS = new Set([
  "s",
  "ss",
  "S",
  "SSS",
  "u",
  "uu",
  "uuu",
]);

const TIME_MACRO_TOKENS = new Set([
  "t",
  "tt",
  "ttt",
  "tttt",
  "T",
  "TT",
  "TTT",
  "TTTT",
  "f",
  "ff",
  "fff",
  "ffff",
  "F",
  "FF",
  "FFF",
  "FFFF",
]);

const SECOND_MACRO_TOKENS = new Set([
  "tt",
  "ttt",
  "tttt",
  "TT",
  "TTT",
  "TTTT",
  "F",
  "FF",
  "FFF",
  "FFFF",
]);

/** Builds a Monday-first calendar grid without rendering adjacent-month days. */
export function buildCalendarWeeks(viewDate: DateTime): DatepickerWeek[] {
  const startOfMonth = viewDate.startOf("month");
  const cells: (DateTime | null)[] = Array.from(
    { length: startOfMonth.weekday - 1 },
    () => null,
  );

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

/** Keeps the selected value aligned with the configured date format. */
export function normalizeDateForFormat(
  date: DateTime,
  dateOnly: boolean,
  showSeconds: boolean,
): DateTime {
  if (dateOnly) {
    return date.startOf("day");
  }

  return showSeconds ? date : date.set({ second: 0, millisecond: 0 });
}

export function getLuxonFormatCapabilities(
  format: string,
  locale = resolveDatepickerLocale(null),
): LuxonFormatCapabilities {
  const tokens = getUnquotedLuxonTokens(format);
  const hasTimeMacro = tokens.some((token) => TIME_MACRO_TOKENS.has(token));
  const hasExplicit12HourToken = tokens.some(
    (token) => token === "h" || token === "hh",
  );
  const hasExplicit24HourToken = tokens.some(
    (token) => token === "H" || token === "HH",
  );
  const usesLocale12HourClock =
    hasTimeMacro && !hasExplicit24HourToken && is12HourLocale(locale);
  const uses12HourClock = hasExplicit12HourToken || usesLocale12HourClock;

  return {
    hasTime: tokens.some(
      (token) => TIME_FIELD_TOKENS.has(token) || TIME_MACRO_TOKENS.has(token),
    ),
    hasSeconds: tokens.some(
      (token) =>
        SECOND_FIELD_TOKENS.has(token) || SECOND_MACRO_TOKENS.has(token),
    ),
    uses12HourClock,
    showMeridiem:
      uses12HourClock &&
      (tokens.includes("a") || hasExplicit12HourToken || hasTimeMacro),
  };
}

export function resolveDatepickerLocale(configuredLocale: string | null): string {
  const normalizedLocale = configuredLocale?.trim();

  if (normalizedLocale) {
    return normalizedLocale;
  }

  if (typeof navigator !== "undefined") {
    const browserLocale =
      navigator.languages?.find((locale) => locale.trim().length > 0) ??
      navigator.language;

    if (browserLocale?.trim()) {
      return browserLocale;
    }
  }

  return Intl.DateTimeFormat().resolvedOptions().locale || "en-US";
}

function is12HourLocale(locale: string): boolean {
  const hourCycle = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
  }).resolvedOptions().hourCycle;

  return hourCycle === "h11" || hourCycle === "h12";
}

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
