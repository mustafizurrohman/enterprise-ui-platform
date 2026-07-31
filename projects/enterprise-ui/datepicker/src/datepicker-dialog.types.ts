import { DateTime } from 'luxon';
import { type DatepickerWeek, type DatepickerWeekday } from './datepicker-grid.types';
import { type TimeUnit } from './time-unit-control.types';

/**
 * Represents a change in a time unit (hour, minute, or second).
 */
export type DatepickerTimeChange = {
  /** The unit being changed. */
  unit: TimeUnit;
  /** The new value for the unit. */
  value: number;
};

/**
 * Supported meridiem indicators for 12-hour clock formats.
 */
export type DatepickerMeridiem = 'AM' | 'PM';

/**
 * Context object containing all the necessary state and configuration for
 * the datepicker dialog and its sub-components.
 */
export type DatepickerDialogContext = Readonly<{
  /** Unique ID for the dialog container. */
  dialogId: string;
  /** Unique ID for the dialog title element. */
  dialogTitleId: string;
  /** Unique ID for the dialog description element. */
  dialogDescriptionId: string;
  /** Unique ID for the live region status element. */
  dialogStatusId: string;
  /** Unique ID for the month heading element. */
  monthHeadingId: string;
  /** Unique ID for the hour selection control. */
  hourSelectId: string;
  /** Unique ID for the minute selection control. */
  minuteSelectId: string;
  /** Unique ID for the second selection control. */
  secondSelectId: string;
  /** Unique ID for the hour label. */
  hourLabelId: string;
  /** Unique ID for the minute label. */
  minuteLabelId: string;
  /** Unique ID for the second label. */
  secondLabelId: string;
  /** Unique ID for the meridiem selection group. */
  meridiemGroupId: string;
  /** Unique ID for the meridiem label. */
  meridiemLabelId: string;
  /** Unique ID for the AM radio/button. */
  meridiemAmId: string;
  /** Unique ID for the PM radio/button. */
  meridiemPmId: string;
  /** Title text for the dialog. */
  dialogTitle: string;
  /** Formatted month and year for display. */
  formattedMonth: string;
  /** List of month names for the month selector. */
  months: readonly string[];
  /** List of weekdays with short and long labels. */
  daysOfWeek: readonly DatepickerWeekday[];
  /** The calendar grid weeks and days. */
  weeks: readonly DatepickerWeek[];
  /** The currently selected date. */
  selectedDate: DateTime | null;
  /** The date currently having active focus in the grid. */
  activeDate: DateTime;
  /** Today's date. */
  today: DateTime;
  /** The date currently being viewed in the calendar. */
  viewDate: DateTime;
  /** Prefix for test IDs. */
  testIdPrefix: string;
  /** Whether the component is in date-only mode. */
  dateOnly: boolean;
  /** Whether to show the seconds selector. */
  showSeconds: boolean;
  /** Whether to use a 12-hour clock. */
  uses12HourClock: boolean;
  /** Whether to show the meridiem (AM/PM) selector. */
  showMeridiem: boolean;
  /** The locale string being used. */
  locale: string;
  /** Predicate function to determine if a date is disabled. */
  isDateDisabled: (date: DateTime) => boolean;
  /** Accessibility announcement message for the dialog. */
  dialogAnnouncement: string;
  /** Whether to show quick time selection controls. */
  showQuickTimeControls: boolean;
}>;
