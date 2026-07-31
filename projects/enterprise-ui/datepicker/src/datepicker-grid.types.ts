import { DateTime } from 'luxon';

/**
 * Represents a single weekday in the calendar header.
 */
export type DatepickerWeekday = {
  /** Short label for the weekday (e.g., 'Mo'). */
  short: string;
  /** Full label for the weekday (e.g., 'Montag'). */
  long: string;
  /** The weekday number (1-7, where 1 is Monday). */
  weekday: number;
};

/**
 * Represents a single week in the calendar grid.
 */
export type DatepickerWeek = {
  /** The ISO week number. */
  weekNumber: number;
  /** The list of dates in the week, with null values for padding. */
  days: (DateTime | null)[];
};

/**
 * Event payload for keydown events within the calendar grid.
 */
export type DatepickerGridKeydown = {
  /** The original keyboard event. */
  event: KeyboardEvent;
  /** The date that was focused when the event occurred. */
  date: DateTime;
};

/**
 * Context object containing state and configuration for the DatepickerGridComponent.
 */
export type DatepickerGridContext = Readonly<{
  /** Unique ID for the grid element. */
  gridId: string;
  /** List of weekdays to display in the header. */
  daysOfWeek: readonly DatepickerWeekday[];
  /** The weeks and days to display in the grid. */
  weeks: readonly DatepickerWeek[];
  /** The currently selected date. */
  selectedDate: DateTime | null;
  /** The date currently having active focus in the grid. */
  activeDate: DateTime;
  /** Today's date. */
  today: DateTime;
  /** The date currently being viewed in the calendar. */
  viewDate: DateTime;
  /** Unique ID for the month heading. */
  monthHeadingId: string;
  /** Prefix for test IDs. */
  testIdPrefix: string;
  /** The locale string being used. */
  locale: string;
  /** Predicate function to determine if a date is disabled. */
  isDateDisabled: (date: DateTime) => boolean;
}>;
