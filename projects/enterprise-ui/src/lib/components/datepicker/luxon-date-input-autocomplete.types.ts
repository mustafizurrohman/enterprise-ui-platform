import { DateTime } from "luxon";

export type LuxonDateField =
  "year" | "month" | "day" | "hour" | "minute" | "second";

export type DateInputErrorCode =
  | "UNSUPPORTED_FORMAT"
  | "INVALID_CHARACTER"
  | "OUT_OF_RANGE"
  | "INVALID_DAY_FOR_MONTH"
  | "INVALID_DATE"
  | "UNEXPECTED_INPUT";

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
