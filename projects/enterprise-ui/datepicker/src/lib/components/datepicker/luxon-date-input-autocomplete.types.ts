import { DateTime } from "luxon";

export type LuxonDateField =
  | "year"
  | "month"
  | "day"
  | "hour"
  | "minute"
  | "second";

export type DateInputErrorCode =
  | "UNSUPPORTED_FORMAT"
  | "INVALID_CHARACTER"
  | "OUT_OF_RANGE"
  | "INVALID_DAY_FOR_MONTH"
  | "INVALID_DATE"
  | "UNEXPECTED_INPUT";

export type NumericFieldToken = Readonly<{
  type: "field";
  field: LuxonDateField;
  token: string;
  minimumWidth: number;
  maximumWidth: number;
  padded: boolean;
  hourCycle?: 12 | 24;
}>;

export type MeridiemToken = Readonly<{
  type: "meridiem";
  token: "a";
}>;

export type LiteralToken = Readonly<{
  type: "literal";
  value: string;
  isLuxonToken?: boolean;
}>;

export type SmartToken = NumericFieldToken | MeridiemToken | LiteralToken;

export type LuxonFormatPart = Readonly<{
  literal: boolean;
  value: string;
}>;

export type NormalizedInput = Readonly<{
  value: string;
  fields: Partial<Record<LuxonDateField, string>>;
  meridiem: "AM" | "PM" | null;
  error: DateInputError | null;
}>;

export type DateInputError = Readonly<{
  code: DateInputErrorCode;
  message: string;
  field?: LuxonDateField;
}>;

export type DateInputAutocompleteResult = Readonly<{
  value: string;
  suggestedValue: string;
  completionSuffix: string;
  complete: boolean;
  valid: boolean;
  date: DateTime | null;
  error: DateInputError | null;
}>;

export type DateInputAutocompleteOptions = Readonly<{
  commit?: boolean;
  now?: DateTime;
  locale?: string;
  isDeletion?: boolean;
}>;
