import { DateTime } from 'luxon';

/**
 * Supported date and time fields in a Luxon format.
 */
export type LuxonDateField = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second';

/**
 * Error codes that can occur during date input parsing and validation.
 */
export type DateInputErrorCode =
  | 'UNSUPPORTED_FORMAT'
  | 'INVALID_CHARACTER'
  | 'OUT_OF_RANGE'
  | 'INVALID_DAY_FOR_MONTH'
  | 'INVALID_DATE'
  | 'UNEXPECTED_INPUT';

/**
 * Definition of a numeric field token (e.g., 'yyyy', 'MM').
 */
export type NumericFieldToken = Readonly<{
  type: 'field';
  /** The logic field this token represents. */
  field: LuxonDateField;
  /** The raw Luxon token string. */
  token: string;
  /** Minimum width for the numeric value. */
  minimumWidth: number;
  /** Maximum width for the numeric value. */
  maximumWidth: number;
  /** Whether the value should be zero-padded. */
  padded: boolean;
  /** Optional hour cycle (12 or 24). */
  hourCycle?: 12 | 24;
}>;

/**
 * Definition of a meridiem token ('a').
 */
export type MeridiemToken = Readonly<{
  type: 'meridiem';
  token: 'a';
}>;

/**
 * Definition of a literal token (e.g., '/', ' Uhr').
 */
export type LiteralToken = Readonly<{
  type: 'literal';
  /** The literal string value. */
  value: string;
  /** Whether the literal was originally a Luxon token (like 'cccc'). */
  isLuxonToken?: boolean;
}>;

/**
 * Union type for all supported smart autocomplete tokens.
 */
export type SmartToken = NumericFieldToken | MeridiemToken | LiteralToken;

/**
 * Represents a single part of a parsed Luxon format string.
 */
export type LuxonFormatPart = Readonly<{
  /** Whether this part is a literal or a token. */
  literal: boolean;
  /** The string value of the part. */
  value: string;
}>;

/**
 * Intermediate state of the normalized input during parsing.
 */
export type NormalizedInput = Readonly<{
  /** The normalized string value. */
  value: string;
  /** Extracted raw string values for each field. */
  fields: Partial<Record<LuxonDateField, string>>;
  /** Extracted meridiem value if applicable. */
  meridiem: 'AM' | 'PM' | null;
  /** Any error encountered during normalization. */
  error: DateInputError | null;
}>;

/**
 * Represents an error encountered during date input processing.
 */
export type DateInputError = Readonly<{
  /** The error code. */
  code: DateInputErrorCode;
  /** A human-readable error message. */
  message: string;
  /** The field that caused the error, if applicable. */
  field?: LuxonDateField;
}>;

/**
 * Result of the autocomplete and parsing process.
 */
export type DateInputAutocompleteResult = Readonly<{
  /** The current value of the input. */
  value: string;
  /** The full suggested value (autocomplete result). */
  suggestedValue: string;
  /** The suffix to append to the current value to complete it. */
  completionSuffix: string;
  /** Whether the input represents a complete and valid date/time. */
  complete: boolean;
  /** Whether the input is currently valid (or a valid prefix). */
  valid: boolean;
  /** The parsed Luxon DateTime object, if complete and valid. */
  date: DateTime | null;
  /** Any error encountered during processing. */
  error: DateInputError | null;
}>;

/**
 * Options for the date input autocomplete and parsing process.
 */
export type DateInputAutocompleteOptions = Readonly<{
  /** Whether to treat the input as final (e.g., on blur). */
  commit?: boolean;
  /** The "now" reference date to use for filling missing components. */
  now?: DateTime;
  /** The locale to use for localized components. */
  locale?: string;
  /** Whether the operation was a deletion (backspace/delete). */
  isDeletion?: boolean;
}>;
