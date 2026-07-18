import { DateTime } from "luxon";

export type LuxonDateField =
  "year" | "month" | "day" | "hour" | "minute" | "second";

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

type LuxonFormatPart = Readonly<{
  literal: boolean;
  value: string;
}>;

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

const FIELD_TOKENS: Readonly<
  Record<string, Omit<FieldToken, "type" | "token">>
> = {
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

const PARSEABLE_LUXON_TOKENS = new Set([
  // Era
  "G",
  "GG",
  // Calendar years
  "y",
  "yy",
  "yyyy",
  "yyyyyy",
  // Months
  "M",
  "MM",
  "MMM",
  "MMMM",
  "L",
  "LL",
  "LLL",
  "LLLL",
  // Calendar dates and ordinals
  "d",
  "dd",
  "o",
  "ooo",
  // Time
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
  // Quarter and ISO week date
  "q",
  "qq",
  "kk",
  "kkkk",
  "W",
  "WW",
  "E",
  "EEE",
  "EEEE",
  "c",
  "ccc",
  "cccc",
  // Offset and IANA zone
  "Z",
  "ZZ",
  "ZZZ",
  "z",
]);

const LUXON_MACRO_TOKENS = new Set([
  "D",
  "DD",
  "DDD",
  "DDDD",
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

const FORMAT_VALIDATION_DATE = DateTime.fromObject(
  {
    year: 2024,
    month: 11,
    day: 23,
    hour: 17,
    minute: 42,
    second: 31,
    millisecond: 456,
  },
  { zone: "Europe/Berlin" },
);

export class LuxonDateInputAutocomplete {
  public static readonly DEFAULT_FORMAT = "dd.MM.yyyy";
  public static readonly DEFAULT_DATETIME_FORMAT = "dd.MM.yyyy HH:mm 'Uhr'";
  public static readonly DEFAULT_DATETIME_SECONDS_FORMAT =
    "dd.MM.yyyy HH:mm:ss 'Uhr'";

  private readonly dateFormat: string;
  private readonly locale: string;
  private readonly tokens: readonly FormatToken[];
  private readonly usesSmartAutocomplete: boolean;
  private readonly hasUhrLiteral: boolean;

  constructor(dateFormat: string, locale = "de-DE") {
    this.locale = locale;
    this.dateFormat = LuxonDateInputAutocomplete.assertValidFormat(
      dateFormat,
      locale,
    );

    const formatParts = parseLuxonFormat(this.dateFormat);
    const smartTokens = toSmartAutocompleteTokens(formatParts);

    this.usesSmartAutocomplete = smartTokens !== null;
    this.tokens = smartTokens ?? [];
    this.hasUhrLiteral = formatParts.some(
      (part) => part.literal && /uhr/iu.test(part.value),
    );
  }

  public static assertValidFormat(
    dateFormat: string,
    locale = "de-DE",
  ): string {
    if (typeof dateFormat !== "string") {
      throw invalidFormatError(
        String(dateFormat),
        "the format must be a string",
      );
    }

    const normalizedFormat = dateFormat.trim();

    if (!normalizedFormat) {
      throw invalidFormatError(dateFormat, "the format must not be empty");
    }

    const parts = parseLuxonFormat(normalizedFormat);
    const meaningfulTokens = parts.filter((part) => !part.literal);

    if (meaningfulTokens.length === 0) {
      throw invalidFormatError(
        dateFormat,
        "the format must contain at least one Luxon date or time token",
      );
    }

    for (const part of meaningfulTokens) {
      if (
        !PARSEABLE_LUXON_TOKENS.has(part.value) &&
        !LUXON_MACRO_TOKENS.has(part.value)
      ) {
        throw invalidFormatError(
          dateFormat,
          `unsupported or non-parseable token "${part.value}"`,
        );
      }
    }

    try {
      const validationDate = FORMAT_VALIDATION_DATE.setLocale(locale);
      const formattedValue = validationDate.toFormat(normalizedFormat);
      const parsedValue = DateTime.fromFormat(
        formattedValue,
        normalizedFormat,
        {
          locale,
          setZone: true,
        },
      );

      if (!parsedValue.isValid) {
        throw invalidFormatError(
          dateFormat,
          parsedValue.invalidExplanation ??
            parsedValue.invalidReason ??
            "the formatted value cannot be parsed back by Luxon",
        );
      }
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("Invalid Luxon")) {
        throw error;
      }

      const reason = error instanceof Error ? error.message : String(error);
      throw invalidFormatError(dateFormat, reason);
    }

    return normalizedFormat;
  }

  public static getFormat(options: {
    dateOnly?: boolean;
    showSeconds?: boolean;
  }): string {
    if (options.dateOnly) {
      return this.DEFAULT_FORMAT;
    }
    return options.showSeconds
      ? this.DEFAULT_DATETIME_SECONDS_FORMAT
      : this.DEFAULT_DATETIME_FORMAT;
  }

  public static getFormatDescription(options: {
    dateOnly?: boolean;
    showSeconds?: boolean;
  }): string {
    if (options.dateOnly) {
      return "TT.MM.JJJJ";
    }
    return options.showSeconds
      ? "TT.MM.JJJJ HH:mm:ss Uhr"
      : "TT.MM.JJJJ HH:mm Uhr";
  }

  process(
    rawValue: string,
    options: DateInputAutocompleteOptions = {},
  ): DateInputAutocompleteResult {
    if (!this.usesSmartAutocomplete) {
      return this.processWithLuxon(rawValue, options);
    }

    const now = options.now ?? DateTime.now();
    const locale = options.locale ?? this.locale;
    const normalized = this.normalize(rawValue, options);
    const error =
      normalized.error ?? this.validateKnownFields(normalized.fields);
    const complete = this.isComplete(normalized.fields);
    let date: DateTime | null = null;
    let parseError = error;

    if (!parseError && complete) {
      const parsed = DateTime.fromFormat(normalized.value, this.dateFormat, {
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

  public processPastedValue(
    rawValue: string,
    options: Omit<DateInputAutocompleteOptions, "commit" | "isDeletion"> = {},
  ): DateInputAutocompleteResult {
    const locale = options.locale ?? this.locale;
    const trimmedValue = rawValue.trim();
    const directResult = this.process(trimmedValue, {
      ...options,
      commit: true,
    });

    if (directResult.date) {
      return directResult;
    }

    const valueWithoutUhr = removeOptionalUhrSuffix(trimmedValue);
    let fallbackResult = directResult;

    if (!this.hasUhrLiteral && valueWithoutUhr !== trimmedValue) {
      fallbackResult = this.process(valueWithoutUhr, {
        ...options,
        commit: true,
      });

      if (fallbackResult.date) {
        return fallbackResult;
      }
    }

    const epochDate = parseEpoch(valueWithoutUhr, locale);
    if (!epochDate) {
      return fallbackResult;
    }

    const value = epochDate.setLocale(locale).toFormat(this.dateFormat);

    return {
      value,
      suggestedValue: value,
      completionSuffix: "",
      complete: true,
      valid: true,
      date: epochDate,
      error: null,
    };
  }

  private processWithLuxon(
    rawValue: string,
    options: DateInputAutocompleteOptions,
  ): DateInputAutocompleteResult {
    const locale = options.locale ?? this.locale;
    const now = (options.now ?? DateTime.now()).setLocale(locale);
    const commit = options.commit === true;
    const value = commit ? rawValue.trim() : rawValue;
    const suggestedValue = now.toFormat(this.dateFormat);

    if (!value) {
      return {
        value,
        suggestedValue,
        completionSuffix: "",
        complete: false,
        valid: true,
        date: null,
        error: null,
      };
    }

    const candidateValues = [value];
    if (
      commit &&
      this.hasUhrLiteral &&
      removeOptionalUhrSuffix(value) === value
    ) {
      candidateValues.unshift(`${value.trimEnd()} Uhr`);
    }

    for (const candidateValue of candidateValues) {
      const parsed = DateTime.fromFormat(candidateValue, this.dateFormat, {
        locale,
        setZone: true,
      });

      if (!parsed.isValid) {
        continue;
      }

      const formattedValue = parsed.setLocale(locale).toFormat(this.dateFormat);
      return {
        value: formattedValue,
        suggestedValue: formattedValue,
        completionSuffix: "",
        complete: true,
        valid: true,
        date: parsed,
        error: null,
      };
    }

    return {
      value,
      suggestedValue,
      completionSuffix: suggestedValue.startsWith(value)
        ? suggestedValue.slice(value.length)
        : "",
      complete: false,
      valid: !commit,
      date: null,
      error: commit
        ? {
            code: "INVALID_DATE",
            message: `The entered value does not match Luxon format "${this.dateFormat}".`,
          }
        : null,
    };
  }

  private normalize(
    rawValue: string,
    options: DateInputAutocompleteOptions,
  ): {
    value: string;
    fields: Partial<Record<LuxonDateField, string>>;
    error: DateInputError | null;
  } {
    const fields: Partial<Record<LuxonDateField, string>> = {};
    const commit = options.commit === true;
    const isDeletion = options.isDeletion === true;
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

        const isTrailing = sourceIndex === rawValue.length;

        if (
          !isDeletion ||
          (consumed === token.value.length && !isTrailing) ||
          commit
        ) {
          value += token.value;
        } else if (isDeletion && consumed > 0 && !isTrailing) {
          value += rawValue.slice(sourceIndex - consumed, sourceIndex);
        }
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
        (commit ||
          explicitlyCommitted ||
          isUnambiguousSingleDigit(token.field, digits.value));
      const fieldValue = shouldPad
        ? digits.value.padStart(2, "0")
        : digits.value;

      fields[token.field] = fieldValue;
      value += fieldValue;

      const fieldComplete = fieldValue.length === token.width;
      if (!fieldComplete) {
        break;
      }
    }

    const remaining = rawValue.slice(sourceIndex);
    const unexpectedInput = remaining.trim();
    const invalidCharacter = [...unexpectedInput].find(
      (character) => !/[0-9\s./:\-']/u.test(character),
    );

    return {
      value: invalidCharacter || unexpectedInput ? rawValue : value,
      fields,
      error: invalidCharacter
        ? {
            code: "INVALID_CHARACTER",
            message: `Unsupported character: ${invalidCharacter}`,
          }
        : unexpectedInput
          ? {
              code: "UNEXPECTED_INPUT",
              message: `Unexpected trailing input: ${unexpectedInput}`,
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

  private isComplete(fields: Partial<Record<LuxonDateField, string>>): boolean {
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
        const fallback = String(defaults[token.field]).padStart(
          token.width,
          "0",
        );
        if (!current) {
          return token.width === 2
            ? fallback.slice(-2)
            : fallback.slice(-token.width);
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

function removeOptionalUhrSuffix(value: string): string {
  return value.replace(/(?:\s|\u00a0)*uhr(?:\s|\u00a0)*$/iu, "").trimEnd();
}

function parseEpoch(value: string, locale: string): DateTime | null {
  const match = /^([+-]?)(\d+)$/u.exec(value);

  if (!match) {
    return null;
  }

  const [, sign, digits] = match;
  const hasUnambiguousLength = digits.length >= 9 && digits.length <= 13;
  const isExplicitlySigned = sign.length > 0 && digits.length <= 13;
  const isEpochOrigin = sign.length === 0 && digits === "0";

  if (!hasUnambiguousLength && !isExplicitlySigned && !isEpochOrigin) {
    return null;
  }

  const epoch = Number(value);
  if (!Number.isSafeInteger(epoch)) {
    return null;
  }

  const milliseconds = Math.abs(epoch) < 10_000_000_000 ? epoch * 1_000 : epoch;
  const date = DateTime.fromMillis(milliseconds).setLocale(locale);

  return date.isValid ? date : null;
}

function parseLuxonFormat(format: string): readonly LuxonFormatPart[] {
  const parts: LuxonFormatPart[] = [];
  let index = 0;
  let quotedLiteral = "";
  let insideLiteral = false;

  while (index < format.length) {
    const character = format[index];

    if (character === "'") {
      if (format[index + 1] === "'") {
        if (insideLiteral) {
          quotedLiteral += "'";
        } else {
          appendFormatPart(parts, true, "'");
        }
        index += 2;
        continue;
      }

      if (insideLiteral) {
        appendFormatPart(parts, true, quotedLiteral);
        quotedLiteral = "";
        insideLiteral = false;
      } else {
        insideLiteral = true;
      }
      index++;
      continue;
    }

    if (insideLiteral) {
      quotedLiteral += character;
      index++;
      continue;
    }

    let value = character;
    index++;
    while (index < format.length && format[index] === character) {
      value += format[index];
      index++;
    }

    const isLiteral = /^\s+$/u.test(value) || !/^\p{L}+$/u.test(value);
    appendFormatPart(parts, isLiteral, value);
  }

  if (insideLiteral) {
    throw invalidFormatError(
      format,
      "an apostrophe-delimited literal is not closed",
    );
  }

  return parts;
}

function appendFormatPart(
  parts: LuxonFormatPart[],
  literal: boolean,
  value: string,
): void {
  if (!value) {
    return;
  }

  const previous = parts.at(-1);
  if (literal && previous?.literal) {
    parts[parts.length - 1] = { literal: true, value: previous.value + value };
    return;
  }

  parts.push({ literal, value });
}

function toSmartAutocompleteTokens(
  parts: readonly LuxonFormatPart[],
): readonly FormatToken[] | null {
  const tokens: FormatToken[] = [];
  const usedFields = new Set<LuxonDateField>();

  for (const part of parts) {
    if (part.literal) {
      pushLiteral(tokens, part.value);
      continue;
    }

    const definition = FIELD_TOKENS[part.value];
    if (!definition || usedFields.has(definition.field)) {
      return null;
    }

    usedFields.add(definition.field);
    tokens.push({ type: "field", token: part.value, ...definition });
  }

  return tokens.some((token) => token.type === "field") ? tokens : null;
}

function invalidFormatError(format: string, reason: string): Error {
  return new Error(`Invalid Luxon date format "${format}": ${reason}.`);
}

function pushLiteral(tokens: FormatToken[], value: string): void {
  if (!value) return;
  const previous = tokens.at(-1);
  if (previous?.type === "literal") {
    tokens[tokens.length - 1] = {
      type: "literal",
      value: previous.value + value,
    };
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

function consumeLiteral(
  source: string,
  startIndex: number,
  literal: string,
): number {
  let sourceIndex = startIndex;
  let literalIndex = 0;

  while (literalIndex < literal.length) {
    const literalCharacter = literal[literalIndex];

    if (/\s/u.test(literalCharacter)) {
      while (
        literalIndex < literal.length &&
        /\s/u.test(literal[literalIndex])
      ) {
        literalIndex++;
      }

      while (sourceIndex < source.length && /\s/u.test(source[sourceIndex])) {
        sourceIndex++;
      }
      continue;
    }

    const sourceCharacter = source[sourceIndex];
    if (
      !sourceCharacter ||
      sourceCharacter.toLocaleLowerCase() !==
        literalCharacter.toLocaleLowerCase()
    ) {
      return 0;
    }

    sourceIndex++;
    literalIndex++;
  }

  return sourceIndex - startIndex;
}

function isUnambiguousSingleDigit(
  field: LuxonDateField,
  digit: string,
): boolean {
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
