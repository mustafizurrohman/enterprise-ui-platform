import { DateTime } from "luxon";

export type LuxonDateField = "year" | "month" | "day" | "hour" | "minute" | "second";

type FieldToken = Readonly<{
  type: "field";
  field: LuxonDateField;
  token: string;
  width: number;
}>;

type LiteralToken = Readonly<{
  type: "literal";
  value: string;
}>;

type FormatToken = FieldToken | LiteralToken;

export type DateInputErrorCode =
  | "UNSUPPORTED_FORMAT"
  | "INVALID_CHARACTER"
  | "OUT_OF_RANGE"
  | "INVALID_DAY_FOR_MONTH"
  | "INVALID_DATE";

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
}>;

const FIELD_TOKENS: Readonly<Record<string, Omit<FieldToken, "type" | "token">>> = {
  yyyy: { field: "year", width: 4 },
  yy: { field: "year", width: 2 },
  MM: { field: "month", width: 2 },
  M: { field: "month", width: 2 },
  dd: { field: "day", width: 2 },
  d: { field: "day", width: 2 },
  HH: { field: "hour", width: 2 },
  H: { field: "hour", width: 2 },
  mm: { field: "minute", width: 2 },
  m: { field: "minute", width: 2 },
  ss: { field: "second", width: 2 },
  s: { field: "second", width: 2 },
};

const ORDERED_FIELD_TOKENS = Object.keys(FIELD_TOKENS).sort(
  (left, right) => right.length - left.length,
);

export class LuxonDateInputAutocomplete {
  private readonly tokens: readonly FormatToken[];

  constructor(private readonly format: string) {
    this.tokens = tokenizeFormat(format);

    if (!this.tokens.some((token) => token.type === "field")) {
      throw new Error(`Unsupported Luxon date format: ${format}`);
    }
  }

  process(
    rawValue: string,
    options: DateInputAutocompleteOptions = {},
  ): DateInputAutocompleteResult {
    const now = options.now ?? DateTime.now();
    const locale = options.locale ?? "de-DE";
    const normalized = this.normalize(rawValue, options.commit === true);
    const error = normalized.error ?? this.validateKnownFields(normalized.fields);
    const complete = this.isComplete(normalized.fields);
    let date: DateTime | null = null;
    let parseError = error;

    if (!parseError && complete) {
      const parsed = DateTime.fromFormat(normalized.value, this.format, {
        locale,
        setZone: true,
      });

      if (parsed.isValid) {
        date = parsed;
      } else {
        parseError = {
          code: "INVALID_DATE",
          message: parsed.invalidExplanation ?? "The entered date is invalid.",
        };
      }
    }

    const suggestedValue = this.buildSuggestion(normalized.fields, now);

    return {
      value: normalized.value,
      suggestedValue,
      completionSuffix: suggestedValue.startsWith(normalized.value)
        ? suggestedValue.slice(normalized.value.length)
        : "",
      complete,
      valid: !parseError,
      date,
      error: parseError,
    };
  }

  private normalize(
    rawValue: string,
    commit: boolean,
  ): {
    value: string;
    fields: Partial<Record<LuxonDateField, string>>;
    error: DateInputError | null;
  } {
    const fields: Partial<Record<LuxonDateField, string>> = {};
    let sourceIndex = 0;
    let value = "";

    for (let tokenIndex = 0; tokenIndex < this.tokens.length; tokenIndex++) {
      const token = this.tokens[tokenIndex];

      if (token.type === "literal") {
        if (!value) {
          break;
        }

        const consumed = consumeLiteral(rawValue, sourceIndex, token.value);
        if (consumed > 0) {
          sourceIndex += consumed;
        }
        value += token.value;
        continue;
      }

      const digits = readDigits(rawValue, sourceIndex, token.width);
      sourceIndex = digits.nextIndex;

      if (!digits.value) {
        break;
      }

      const nextCharacter = rawValue[sourceIndex] ?? "";
      const nextToken = this.tokens[tokenIndex + 1];
      const explicitlyCommitted =
        nextToken?.type === "literal" &&
        nextCharacter.length > 0 &&
        nextToken.value.startsWith(nextCharacter);
      const shouldPad =
        token.width === 2 &&
        digits.value.length === 1 &&
        (commit || explicitlyCommitted || isUnambiguousSingleDigit(token.field, digits.value));
      const fieldValue = shouldPad ? digits.value.padStart(2, "0") : digits.value;

      fields[token.field] = fieldValue;
      value += fieldValue;

      const fieldComplete = fieldValue.length === token.width;
      if (!fieldComplete) {
        break;
      }
    }

    const remaining = rawValue.slice(sourceIndex);
    const invalidCharacter = [...remaining].find(
      (character) => !/[0-9\s./:\-']/u.test(character),
    );

    return {
      value,
      fields,
      error: invalidCharacter
        ? {
            code: "INVALID_CHARACTER",
            message: `Unsupported character: ${invalidCharacter}`,
          }
        : null,
    };
  }

  private validateKnownFields(
    fields: Partial<Record<LuxonDateField, string>>,
  ): DateInputError | null {
    for (const [field, raw] of Object.entries(fields) as Array<
      [LuxonDateField, string]
    >) {
      if (!raw || !isFieldComplete(field, raw, this.tokens)) {
        continue;
      }

      const value = Number(raw);
      const [minimum, maximum] = rangeFor(field);
      if (value < minimum || value > maximum) {
        return {
          code: "OUT_OF_RANGE",
          field,
          message: `${field} must be between ${minimum} and ${maximum}.`,
        };
      }
    }

    const day = completedNumber("day", fields, this.tokens);
    const month = completedNumber("month", fields, this.tokens);
    const year = completedNumber("year", fields, this.tokens);

    if (day !== null && month !== null) {
      const maximumDay = maximumDayForKnownDate(month, year);
      if (day > maximumDay) {
        return {
          code: "INVALID_DAY_FOR_MONTH",
          field: "day",
          message: `Day ${day} is invalid for month ${month}.`,
        };
      }
    }

    return null;
  }

  private isComplete(
    fields: Partial<Record<LuxonDateField, string>>,
  ): boolean {
    return this.tokens
      .filter((token): token is FieldToken => token.type === "field")
      .every((token) => fields[token.field]?.length === token.width);
  }

  private buildSuggestion(
    fields: Partial<Record<LuxonDateField, string>>,
    now: DateTime,
  ): string {
    const defaults: Record<LuxonDateField, number> = {
      year: now.year,
      month: now.month,
      day: now.day,
      hour: now.hour,
      minute: now.minute,
      second: now.second,
    };

    return this.tokens
      .map((token) => {
        if (token.type === "literal") {
          return token.value;
        }

        const current = fields[token.field];
        const fallback = String(defaults[token.field]).padStart(token.width, "0");
        if (!current) {
          return token.width === 2 ? fallback.slice(-2) : fallback.slice(-token.width);
        }

        if (current.length >= token.width) {
          return current;
        }

        return fallback.startsWith(current)
          ? fallback
          : current.padStart(token.width, "0");
      })
      .join("");
  }
}

function tokenizeFormat(format: string): readonly FormatToken[] {
  const tokens: FormatToken[] = [];
  let index = 0;

  while (index < format.length) {
    if (format[index] === "'") {
      let literal = "";
      index++;
      while (index < format.length) {
        if (format[index] === "'" && format[index + 1] === "'") {
          literal += "'";
          index += 2;
          continue;
        }
        if (format[index] === "'") {
          index++;
          break;
        }
        literal += format[index++];
      }
      pushLiteral(tokens, literal);
      continue;
    }

    const fieldToken = ORDERED_FIELD_TOKENS.find((candidate) =>
      format.startsWith(candidate, index),
    );
    if (fieldToken) {
      const definition = FIELD_TOKENS[fieldToken];
      tokens.push({ type: "field", token: fieldToken, ...definition });
      index += fieldToken.length;
      continue;
    }

    pushLiteral(tokens, format[index]);
    index++;
  }

  return tokens;
}

function pushLiteral(tokens: FormatToken[], value: string): void {
  if (!value) return;
  const previous = tokens.at(-1);
  if (previous?.type === "literal") {
    tokens[tokens.length - 1] = { type: "literal", value: previous.value + value };
  } else {
    tokens.push({ type: "literal", value });
  }
}

function readDigits(
  source: string,
  startIndex: number,
  maximumLength: number,
): { value: string; nextIndex: number } {
  let value = "";
  let index = startIndex;
  while (index < source.length && value.length < maximumLength) {
    const character = source[index];
    if (/\d/u.test(character)) {
      value += character;
      index++;
      continue;
    }
    break;
  }
  return { value, nextIndex: index };
}

function consumeLiteral(source: string, startIndex: number, literal: string): number {
  let consumed = 0;
  while (
    consumed < literal.length &&
    source[startIndex + consumed] === literal[consumed]
  ) {
    consumed++;
  }
  return consumed;
}

function isUnambiguousSingleDigit(field: LuxonDateField, digit: string): boolean {
  const value = Number(digit);
  switch (field) {
    case "month":
      return value > 1;
    case "day":
      return value > 3;
    case "hour":
      return value > 2;
    case "minute":
    case "second":
      return value > 5;
    case "year":
      return false;
  }
}

function rangeFor(field: LuxonDateField): readonly [number, number] {
  switch (field) {
    case "year":
      return [0, 9999];
    case "month":
      return [1, 12];
    case "day":
      return [1, 31];
    case "hour":
      return [0, 23];
    case "minute":
    case "second":
      return [0, 59];
  }
}

function completedNumber(
  field: LuxonDateField,
  fields: Partial<Record<LuxonDateField, string>>,
  tokens: readonly FormatToken[],
): number | null {
  const raw = fields[field];
  return raw && isFieldComplete(field, raw, tokens) ? Number(raw) : null;
}

function isFieldComplete(
  field: LuxonDateField,
  raw: string,
  tokens: readonly FormatToken[],
): boolean {
  const token = tokens.find(
    (candidate): candidate is FieldToken =>
      candidate.type === "field" && candidate.field === field,
  );
  return !!token && raw.length === token.width;
}

function maximumDayForKnownDate(month: number, year: number | null): number {
  if (month === 2) {
    if (year === null) return 29;
    return DateTime.local(year, 2).daysInMonth ?? 29;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}
