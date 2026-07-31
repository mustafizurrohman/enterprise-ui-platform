/**
 * Represents the functional capabilities inferred from a Luxon date/time format.
 */
export type LuxonFormatCapabilities = Readonly<{
  /** Whether the format includes any time components. */
  hasTime: boolean;
  /** Whether the format includes seconds. */
  hasSeconds: boolean;
  /** Whether the format uses a 12-hour clock (with AM/PM). */
  uses12HourClock: boolean;
  /** Whether the format explicitly shows a meridiem (AM/PM) indicator. */
  showMeridiem: boolean;
}>;
