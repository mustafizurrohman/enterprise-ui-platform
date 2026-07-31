/**
 * Context object containing state and configuration for the DatepickerHeaderComponent.
 */
export type DatepickerHeaderContext = Readonly<{
  /** Unique ID for the parent dialog. */
  dialogId: string;
  /** Prefix for test IDs. */
  testIdPrefix: string;
  /** Unique ID for the calendar grid. */
  calendarGridId: string;
  /** Unique ID for the month heading. */
  monthHeadingId: string;
  /** Formatted month and year for display. */
  formattedMonth: string;
  /** The currently selected month as a string. */
  selectedMonth: string;
  /** List of short month names for the selector. */
  shortMonths: readonly string[];
  /** Today's month number (1-12). */
  todayMonth: number;
  /** Today's year. */
  todayYear: number;
  /** The year currently being viewed. */
  viewYear: number;
}>;
