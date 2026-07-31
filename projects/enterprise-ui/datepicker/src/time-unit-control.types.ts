/**
 * Supported time units in the datepicker.
 */
export type TimeUnit = 'hour' | 'minute' | 'second';

/**
 * Supported hour cycles for time selection.
 */
export type TimeUnitControlHourCycle = 'h12' | 'h23';

/**
 * Supported meridiem indicators for 12-hour clock formats.
 */
export type TimeUnitControlMeridiem = 'AM' | 'PM';

/**
 * Context object containing state and configuration for a TimeUnitControlComponent.
 */
export type TimeUnitControlContext = Readonly<{
  /** The time unit this control handles. */
  unit: TimeUnit;
  /** The current numeric value of the unit. */
  value: number;
  /** Unique ID for the control. */
  controlId: string;
  /** Unique ID for the label. */
  labelId: string;
  /** Optional unique ID for the description. */
  descriptionId?: string;
  /** Prefix for test IDs. */
  testIdPrefix: string;
  /** Optional hour cycle for the control. */
  hourCycle?: TimeUnitControlHourCycle;
  /** Optional meridiem value for 12-hour controls. */
  meridiem?: TimeUnitControlMeridiem;
}>;

/**
 * Configuration for a specific time unit, defining its labels and bounds.
 */
export type TimeUnitConfiguration = {
  /** Short label for the unit (e.g., 'Std'). */
  label: string;
  /** Full singular label for the unit (e.g., 'Stunde'). */
  singularLabel: string;
  /** Suffix to append to the value for accessibility (e.g., 'Uhr'). */
  valueTextSuffix: string;
  /** Minimum valid value for the unit. */
  minimum: number;
  /** Maximum valid value for the unit. */
  maximum: number;
};

/**
 * Possible animation directions for the time unit control.
 */
export type TimeUnitControlAnimationDirection = 'increment' | 'decrement';

/**
 * Phases for CSS animations to ensure triggers always restart the animation.
 */
export type TimeUnitControlAnimationPhase = 'a' | 'b';

/**
 * Represents the current animation state of a time unit control.
 */
export type TimeUnitControlAnimationState = Readonly<{
  /** The direction of the change. */
  direction: TimeUnitControlAnimationDirection;
  /** The current animation phase. */
  phase: TimeUnitControlAnimationPhase;
  /** Whether the change is occurring rapidly (e.g., on button hold). */
  rapid: boolean;
}>;
