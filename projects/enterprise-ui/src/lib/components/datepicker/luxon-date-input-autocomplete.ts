import { DateTime } from "luxon";
import {
  type DateInputAutocompleteOptions,
  type DateInputAutocompleteResult,
  type DateInputError,
  type LiteralToken,
  type LuxonDateField,
  type LuxonFormatPart,
  type MeridiemToken,
  type NormalizedInput,
  type NumericFieldToken,
  type SmartToken,
} from "./luxon-date-input-autocomplete.types";

const NUMERIC_FIELD_TOKENS: Readonly<
  Record<string, Omit<NumericFieldToken, "type" | "token">>
> = {
  yyyy: {
    field: "year",
    minimumWidth: 4,
    maximumWidth: 4,
    padded: true,
  },
  yy: {
    field: "year",
    minimumWidth: 2,
    maximumWidth: 2,
    padded: true,
  },
  MM: {
    field: "month",
    minimumWidth: 2,
    maximumWidth: 2,
    padded: true,
  },
  M: {
    field: "month",
    minimumWidth: 1,
    maximumWidth: 2,
    padded: false,
  },
  dd: {
    field: "day",
    minimumWidth: 2,
    maximumWidth: 2,
    padded: true,
  },
  d: {
    field: "day",
    minimumWidth: 1,
    maximumWidth: 2,
    padded: false,
  },
  HH: {
    field: "hour",
    minimumWidth: 2,
    maximumWidth: 2,
    padded: true,
    hourCycle: 24,
  },
  H: {
    field: "hour",
    minimumWidth: 1,
    maximumWidth: 2,
    padded: false,
    hourCycle: 24,
  },
  hh: {
    field: "hour",
    minimumWidth: 2,
    maximumWidth: 2,
    padded: true,
    hourCycle: 12,
  },
  h: {
    field: "hour",
    minimumWidth: 1,
    maximumWidth: 2,
    padded: false,
    hourCycle: 12,
  },
  mm: {
    field: "minute",
    minimumWidth: 2,
    maximumWidth: 2,
    padded: true,
  },
  m: {
    field: "minute",
    minimumWidth: 1,
    maximumWidth: 2,
    padded: false,
  },
  ss: {
    field: "second",
    minimumWidth: 2,
    maximumWidth: 2,
    padded: true,
  },
  s: {
    field: "second",
    minimumWidth: 1,
    maximumWidth: 2,
    padded: false,
  },
};

const PARSEABLE_LUXON_TOKENS = new Set([
  "G",
  "GG",
  "y",
  "yy",
  "yyyy",
  "yyyyy",
  "yyyyyy",
  "M",
  "MM",
  "MMM",
  "MMMM",
  "L",
  "LL",
  "LLL",
  "LLLL",
  "d",
  "dd",
  "o",
  "ooo",
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
  "Z",
  "ZZ",
  "ZZZ",
  "z",
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
  private readonly tokens: readonly SmartToken[];
  private readonly usesSmartAutocomplete: boolean;
  private readonly hasUhrLiteral: boolean;
  private readonly hasMeridiem: boolean;

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
    this.hasMeridiem = formatParts.some(
      (part) => !part.literal && part.value === "a",
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

    parseLuxonFormat(normalizedFormat);

    try {
      const explanation = DateTime.fromFormatExplain("", normalizedFormat, {
        locale,
        setZone: true,
      });
      const meaningfulTokens = explanation.tokens.filter(
        (token) => !token.literal && /^\p{L}+$/u.test(token.val),
      );

      if (meaningfulTokens.length === 0) {
        throw invalidFormatError(
          dateFormat,
          "the format must contain at least one Luxon date or time token",
        );
      }

      for (const token of meaningfulTokens) {
        if (!PARSEABLE_LUXON_TOKENS.has(token.val)) {
          throw invalidFormatError(
            dateFormat,
            `unsupported or non-parseable token "${token.val}"`,
          );
        }
      }

      if (
        meaningfulTokens.some((token) => token.val === "a") &&
        meaningfulTokens.some(
          (token) => token.val === "H" || token.val === "HH",
        )
      ) {
        throw invalidFormatError(
          dateFormat,
          "24-hour tokens H/HH cannot be combined with meridiem token a",
        );
      }

      const validationDate = FORMAT_VALIDATION_DATE.setLocale(locale);
      const validationValue = buildParserCompatibleValue(
        explanation.tokens,
        validationDate,
      );
      const parsedValue = DateTime.fromFormat(
        validationValue,
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
            "the format cannot produce a valid Luxon DateTime",
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

  public getDateFormat(): string {
    return this.dateFormat;
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

  public process(
    rawValue: string,
    options: DateInputAutocompleteOptions = {},
  ): DateInputAutocompleteResult {
    if (!this.usesSmartAutocomplete) {
      return this.processWithLuxon(rawValue, options);
    }

    const now = (options.now ?? DateTime.now()).setLocale(
      options.locale ?? this.locale,
    );
    const locale = options.locale ?? this.locale;
    const normalizedRawValue = normalizeWhitespace(rawValue);

    if (!normalizedRawValue) {
      return {
        value: "",
        suggestedValue: formatInputValue(now, this.dateFormat, locale),
        completionSuffix: "",
        complete: false,
        valid: true,
        date: null,
        error: null,
      };
    }

    const normalized = this.normalize(normalizedRawValue, options, now);
    const validationError =
      normalized.error ?? this.validateKnownFields(normalized.fields);
    const complete = this.isComplete(normalized);
    let date: DateTime | null = null;
    let parseError = validationError;

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

    const suggestedValue = this.buildSuggestion(normalized, now, locale);

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
    const trimmedValue = normalizeWhitespace(rawValue.trim());
    const directResult = this.process(trimmedValue, {
      ...options,
      commit: true,
    });

    if (directResult.date) {
      return directResult;
    }

    const directLuxonResult = this.parseCompleteValueWithLuxon(
      trimmedValue,
      locale,
    );
    if (directLuxonResult) {
      return directLuxonResult;
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

      const fallbackLuxonResult = this.parseCompleteValueWithLuxon(
        valueWithoutUhr,
        locale,
      );
      if (fallbackLuxonResult) {
        return fallbackLuxonResult;
      }
    }

    const epochDate = parseEpoch(valueWithoutUhr, locale);
    if (!epochDate) {
      return fallbackResult;
    }

    const value = formatInputValue(epochDate, this.dateFormat, locale);

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

  private parseCompleteValueWithLuxon(
    value: string,
    locale: string,
  ): DateInputAutocompleteResult | null {
    if (!value) {
      return null;
    }

    const parsed = DateTime.fromFormat(value, this.dateFormat, {
      locale,
      setZone: true,
    });

    if (!parsed.isValid) {
      return null;
    }

    const formattedValue = formatInputValue(parsed, this.dateFormat, locale);

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

  private processWithLuxon(
    rawValue: string,
    options: DateInputAutocompleteOptions,
  ): DateInputAutocompleteResult {
    const locale = options.locale ?? this.locale;
    const now = (options.now ?? DateTime.now()).setLocale(locale);
    const commit = options.commit === true;
    const value = commit
      ? normalizeWhitespace(rawValue.trim())
      : normalizeWhitespace(rawValue);
    const suggestedValue = formatInputValue(now, this.dateFormat, locale);

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

      const formattedValue = formatInputValue(parsed, this.dateFormat, locale);
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
    now: DateTime,
  ): NormalizedInput {
    const fields: Partial<Record<LuxonDateField, string>> = {};
    const commit = options.commit === true;
    const isDeletion = options.isDeletion === true;
    const source = normalizeWhitespace(rawValue);
    let sourceIndex = 0;
    let value = "";
    let meridiem: "AM" | "PM" | null = null;
    let startedParsing = false;

    for (let tokenIndex = 0; tokenIndex < this.tokens.length; tokenIndex++) {
      const token = this.tokens[tokenIndex];

      if (token.type === "literal") {
        const expectedValue = token.isLuxonToken
          ? parserTokenValue(token.value, now)
          : token.value;
        const consumed = consumeLiteral(source, sourceIndex, expectedValue);

        if (!startedParsing && consumed === 0) {
          value += expectedValue;
          continue;
        }

        if (consumed > 0) {
          sourceIndex += consumed;
          startedParsing = true;
        }

        const sourceFinished = sourceIndex === source.length;
        if (!isDeletion || !sourceFinished || commit) {
          value += expectedValue;
        }
        continue;
      }

      if (token.type === "meridiem") {
        const parsedMeridiem = readMeridiem(source, sourceIndex, commit);

        if (!startedParsing && !parsedMeridiem.value) {
          // If next digit is still far away, we can fill meridiem
          if (!/^\s*\d/u.test(source.slice(sourceIndex))) {
            const meridiemValue = now.toFormat("a").toUpperCase();
            value += meridiemValue;
            continue;
          }
        }

        sourceIndex = parsedMeridiem.nextIndex;

        if (!parsedMeridiem.value) {
          break;
        }

        value += parsedMeridiem.value;
        meridiem = parsedMeridiem.complete
          ? (parsedMeridiem.value as "AM" | "PM")
          : null;

        startedParsing = true;
        if (!parsedMeridiem.complete) {
          break;
        }
        continue;
      }

      const numeric = readNumericField(
        source,
        sourceIndex,
        token,
        this.tokens[tokenIndex + 1],
        commit,
      );

      if (!startedParsing && !numeric.value) {
        // Look ahead to see if there's any digit in source at current sourceIndex
        if (/^\s*\d/u.test(source.slice(sourceIndex))) {
          // If there is a digit, we must have missed something or this token doesn't match
          // But since it's numeric and we have no digits, it's a non-match.
          // For leading tokens, we fill them.
          const fallbackValue =
            token.field === "hour" && token.hourCycle === 12
              ? now.hour % 12 || 12
              : now[token.field];
          const fallback = formatNumericTokenValue(token, fallbackValue);
          value += fallback;
          continue;
        } else {
          // No digits ahead, and this is leading.
          // If the source is just empty or whitespace, we can still fill it.
          const remainingTrimmed = source.slice(sourceIndex).trim();
          if (!remainingTrimmed) {
            const fallbackValue =
              token.field === "hour" && token.hourCycle === 12
                ? now.hour % 12 || 12
                : now[token.field];
            const fallback = formatNumericTokenValue(token, fallbackValue);
            value += fallback;
            continue;
          }
          // Some non-digit input but numeric token expects digits. Break.
          break;
        }
      }

      if (numeric.value) {
        startedParsing = true;
      }
      sourceIndex = numeric.nextIndex;

      if (!numeric.value) {
        break;
      }

      value += numeric.value;
      fields[token.field] = numeric.value;

      if (!numeric.complete) {
        break;
      }
    }

    const remaining = source.slice(sourceIndex);
    const unexpectedInput = remaining.trim();
    const invalidCharacter = [...unexpectedInput].find(
      (character) => !/[0-9\s.,/:\-']/u.test(character),
    );

    let finalValue = value;
    if (
      (!startedParsing && source.length > 0) ||
      (startedParsing && (invalidCharacter || unexpectedInput))
    ) {
      finalValue = source;
    }

    return {
      value: finalValue,
      fields,
      meridiem,
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
    for (const token of this.tokens) {
      if (token.type !== "field") {
        continue;
      }

      const raw = fields[token.field];
      if (!raw || !isNumericTokenComplete(token, raw)) {
        continue;
      }

      const value = Number(raw);
      const [minimum, maximum] = rangeForToken(token);
      if (value < minimum || value > maximum) {
        return {
          code: "OUT_OF_RANGE",
          field: token.field,
          message: `${token.field} must be between ${minimum} and ${maximum}.`,
        };
      }
    }

    const day = completedNumber("day", fields, this.tokens);
    const month = completedNumber("month", fields, this.tokens);
    const rawYear = completedRawValue("year", fields, this.tokens);
    const year = rawYear === null ? null : normalizeCalendarYear(rawYear);

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

  private isComplete(normalized: NormalizedInput): boolean {
    const fieldsComplete = this.tokens.every((token) => {
      if (token.type !== "field") {
        return true;
      }

      const value = normalized.fields[token.field];
      return value !== undefined && isNumericTokenComplete(token, value);
    });

    return (
      fieldsComplete && (!this.hasMeridiem || normalized.meridiem !== null)
    );
  }

  private buildSuggestion(
    normalized: NormalizedInput,
    now: DateTime,
    locale: string,
  ): string {
    const completeNowValue = formatInputValue(now, this.dateFormat, locale);
    if (!normalized.value) {
      return completeNowValue;
    }

    const valuesByField: Record<LuxonDateField, number> = {
      year: now.year,
      month: now.month,
      day: now.day,
      hour: now.hour,
      minute: now.minute,
      second: now.second,
    };

    const tokensWithLeadingValues: string[] = [];
    const fields = { ...normalized.fields };

    for (let i = 0; i < this.tokens.length; i++) {
      const token = this.tokens[i];

      if (token.type === "literal") {
        const expectedValue = token.isLuxonToken
          ? parserTokenValue(token.value, now)
          : token.value;
        tokensWithLeadingValues.push(expectedValue);
        continue;
      }

      if (token.type === "meridiem") {
        if (normalized.meridiem) {
          tokensWithLeadingValues.push(normalized.meridiem);
        } else {
          const fallback = now.toFormat("a").toUpperCase();
          tokensWithLeadingValues.push(fallback);
        }
        continue;
      }

      const current = fields[token.field];
      if (current) {
        if (isNumericTokenComplete(token, current)) {
          tokensWithLeadingValues.push(current);
        } else {
          const fallbackValue =
            token.field === "hour" && token.hourCycle === 12
              ? valuesByField.hour % 12 || 12
              : valuesByField[token.field];
          const fallback = formatNumericTokenValue(token, fallbackValue);
          tokensWithLeadingValues.push(
            fallback.startsWith(current) ? fallback : current,
          );
        }
      } else {
        const fallbackValue =
          token.field === "hour" && token.hourCycle === 12
            ? valuesByField.hour % 12 || 12
            : valuesByField[token.field];
        const fallback = formatNumericTokenValue(token, fallbackValue);
        tokensWithLeadingValues.push(fallback);
      }
    }

    return tokensWithLeadingValues.join("");
  }
}

function readNumericField(
  source: string,
  startIndex: number,
  token: NumericFieldToken,
  nextToken: SmartToken | undefined,
  commit: boolean,
): Readonly<{ value: string; nextIndex: number; complete: boolean }> {
  const digits = readDigits(source, startIndex, token.maximumWidth);
  if (!digits.value) {
    return { value: "", nextIndex: startIndex, complete: false };
  }

  const nextCharacter = source[digits.nextIndex] ?? "";
  const explicitlySeparated =
    nextToken?.type === "literal" &&
    nextCharacter.length > 0 &&
    literalStartsWith(nextToken.value, nextCharacter);
  const reachedMaximumWidth = digits.value.length === token.maximumWidth;
  const unambiguous = isUnambiguousSingleDigit(token, digits.value);
  const canPadSingleDigit =
    token.padded && token.maximumWidth === 2 && digits.value.length === 1;
  const canCompleteShortValue =
    (digits.value.length >= token.minimumWidth || canPadSingleDigit) &&
    (explicitlySeparated || commit || unambiguous);
  const complete = reachedMaximumWidth || canCompleteShortValue;

  if (!complete) {
    return {
      value: digits.value,
      nextIndex: digits.nextIndex,
      complete: false,
    };
  }

  const normalizedValue =
    token.padded && digits.value.length < token.maximumWidth
      ? digits.value.padStart(token.maximumWidth, "0")
      : digits.value;

  return {
    value: normalizedValue,
    nextIndex: digits.nextIndex,
    complete: true,
  };
}

function readMeridiem(
  source: string,
  startIndex: number,
  commit: boolean,
): Readonly<{
  value: "" | "A" | "P" | "AM" | "PM";
  nextIndex: number;
  complete: boolean;
}> {
  const match = /^[ap](?:m)?/iu.exec(source.slice(startIndex));
  if (!match) {
    return { value: "", nextIndex: startIndex, complete: false };
  }

  const raw = match[0].toUpperCase();
  const complete = raw.length === 2 || commit;
  const value = complete ? (`${raw[0]}M` as "AM" | "PM") : (raw as "A" | "P");

  return {
    value,
    nextIndex: startIndex + match[0].length,
    complete,
  };
}

function formatInputValue(
  date: DateTime,
  format: string,
  locale: string,
): string {
  const localizedDate = date.setLocale(locale);
  const formattedValue = localizedDate.toFormat(format);
  const roundTrip = DateTime.fromFormat(formattedValue, format, {
    locale,
    setZone: true,
  });

  if (roundTrip.isValid) {
    return formattedValue;
  }

  const explanation = DateTime.fromFormatExplain("", format, {
    locale,
    setZone: true,
  });
  return buildParserCompatibleValue(explanation.tokens, localizedDate);
}

function buildParserCompatibleValue(
  tokens: ReadonlyArray<Readonly<{ literal: boolean; val: string }>>,
  date: DateTime,
): string {
  return tokens
    .map((token) => {
      if (token.literal || token.val === " " || !/^\p{L}+$/u.test(token.val)) {
        return token.val;
      }

      return parserTokenValue(token.val, date);
    })
    .join("");
}

function parserTokenValue(token: string, date: DateTime): string {
  switch (token) {
    case "y":
      return String(date.year);
    case "yy":
      return String(Math.abs(date.year) % 100).padStart(2, "0");
    case "yyyy":
      return formatSignedYear(date.year, 4);
    case "yyyyy":
      return formatSignedYear(date.year, 5);
    case "yyyyyy":
      return formatSignedYear(date.year, 6);
    case "M":
    case "L":
      return String(date.month);
    case "MM":
    case "LL":
      return String(date.month).padStart(2, "0");
    case "d":
      return String(date.day);
    case "dd":
      return String(date.day).padStart(2, "0");
    case "o":
      return String(date.ordinal);
    case "ooo":
      return String(date.ordinal).padStart(3, "0");
    case "H":
      return String(date.hour);
    case "HH":
      return String(date.hour).padStart(2, "0");
    case "h":
      return String(date.hour % 12 || 12);
    case "hh":
      return String(date.hour % 12 || 12).padStart(2, "0");
    case "m":
      return String(date.minute);
    case "mm":
      return String(date.minute).padStart(2, "0");
    case "s":
      return String(date.second);
    case "ss":
      return String(date.second).padStart(2, "0");
    case "S":
      return String(date.millisecond);
    case "SSS":
    case "u":
      return String(date.millisecond).padStart(3, "0");
    case "uu":
      return String(Math.floor(date.millisecond / 10)).padStart(2, "0");
    case "uuu":
      return String(Math.floor(date.millisecond / 100));
    case "q":
      return String(date.quarter);
    case "qq":
      return String(date.quarter).padStart(2, "0");
    case "kk":
      return String(Math.abs(date.weekYear) % 100).padStart(2, "0");
    case "kkkk":
      return formatSignedYear(date.weekYear, 4);
    case "W":
      return String(date.weekNumber);
    case "WW":
      return String(date.weekNumber).padStart(2, "0");
    case "E":
    case "c":
      return String(date.weekday);
    case "Z":
    case "ZZ":
    case "ZZZ":
    case "z":
      return date.toFormat(token);
    case "G":
    case "GG":
    case "MMM":
    case "MMMM":
    case "LLL":
    case "LLLL":
    case "EEE":
    case "EEEE":
    case "ccc":
    case "cccc":
    case "a":
      return date.toFormat(token).replace(/\./gu, "");
    default:
      return date.toFormat(token);
  }
}

function formatSignedYear(year: number, width: number): string {
  const absoluteYear = String(Math.abs(year)).padStart(width, "0");
  return year < 0 ? `-${absoluteYear}` : absoluteYear;
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\u00a0/gu, " ");
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

export function parseLuxonFormat(format: string): readonly LuxonFormatPart[] {
  const parts: LuxonFormatPart[] = [];
  let index = 0;

  while (index < format.length) {
    if (format[index] === "'") {
      let literal = "";
      index++;
      let closed = false;

      while (index < format.length) {
        if (format[index] !== "'") {
          literal += format[index];
          index++;
          continue;
        }

        if (format[index + 1] === "'") {
          literal += "'";
          index += 2;
          continue;
        }

        index++;
        closed = true;
        break;
      }

      if (!closed) {
        throw invalidFormatError(
          format,
          "unclosed apostrophe-delimited literal",
        );
      }

      pushFormatPart(parts, { literal: true, value: literal });
      continue;
    }

    if (/\p{L}/u.test(format[index])) {
      let token = format[index];
      index++;
      while (index < format.length && format[index] === token[0]) {
        token += format[index];
        index++;
      }
      pushFormatPart(parts, { literal: false, value: token });
      continue;
    }

    pushFormatPart(parts, { literal: true, value: format[index] });
    index++;
  }

  return parts;
}

function pushFormatPart(parts: LuxonFormatPart[], part: LuxonFormatPart): void {
  if (!part.value) {
    return;
  }

  const previous = parts.at(-1);
  if (part.literal && previous?.literal) {
    parts[parts.length - 1] = {
      literal: true,
      value: previous.value + part.value,
    };
    return;
  }

  parts.push(part);
}

function toSmartAutocompleteTokens(
  parts: readonly LuxonFormatPart[],
): readonly SmartToken[] | null {
  const tokens: SmartToken[] = [];
  let sawNumericField = false;

  for (const part of parts) {
    if (part.literal) {
      tokens.push({ type: "literal", value: part.value, isLuxonToken: false });
      continue;
    }

    if (part.value === "a") {
      tokens.push({ type: "meridiem", token: "a" });
      continue;
    }

    const numericDefinition = NUMERIC_FIELD_TOKENS[part.value];
    if (numericDefinition) {
      tokens.push({
        type: "field",
        token: part.value,
        ...numericDefinition,
      });
      sawNumericField = true;
      continue;
    }

    // Treat unrecognized meaningful tokens as literals ONLY if they appear
    // before the first numeric field. This enables autocomplete for formats
    // starting with e.g. weekday (cccc) while maintaining compatibility
    // with existing formats where such tokens appear in the middle or end.
    if (!sawNumericField && /^\p{L}+$/u.test(part.value)) {
      tokens.push({ type: "literal", value: part.value, isLuxonToken: true });
      continue;
    }

    return null;
  }

  return sawNumericField ? tokens : null;
}

function invalidFormatError(format: string, reason: string): Error {
  return new Error(`Invalid Luxon date format "${format}": ${reason}.`);
}

function readDigits(
  source: string,
  startIndex: number,
  maximumLength: number,
): Readonly<{ value: string; nextIndex: number }> {
  let value = "";
  let index = startIndex;

  while (index < source.length && value.length < maximumLength) {
    const character = source[index];
    if (!/\d/u.test(character)) {
      break;
    }

    value += character;
    index++;
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

function literalStartsWith(literal: string, character: string): boolean {
  const firstVisibleCharacter = [...literal].find(
    (candidate) => !/\s/u.test(candidate),
  );

  if (!firstVisibleCharacter) {
    return /\s/u.test(character);
  }

  return (
    firstVisibleCharacter.toLocaleLowerCase() === character.toLocaleLowerCase()
  );
}

function isUnambiguousSingleDigit(
  token: NumericFieldToken,
  digits: string,
): boolean {
  if (digits.length !== 1) {
    return false;
  }

  const value = Number(digits);
  switch (token.field) {
    case "month":
      return value > 1;
    case "day":
      return value > 3;
    case "hour":
      return token.hourCycle === 12 ? value > 1 : value > 2;
    case "minute":
    case "second":
      return value > 5;
    case "year":
      return false;
  }
}

function rangeForToken(token: NumericFieldToken): readonly [number, number] {
  switch (token.field) {
    case "year":
      return [0, token.maximumWidth === 2 ? 99 : 9999];
    case "month":
      return [1, 12];
    case "day":
      return [1, 31];
    case "hour":
      return token.hourCycle === 12 ? [1, 12] : [0, 23];
    case "minute":
    case "second":
      return [0, 59];
  }
}

function isNumericTokenComplete(
  token: NumericFieldToken,
  raw: string,
): boolean {
  return raw.length >= token.minimumWidth && raw.length <= token.maximumWidth;
}

function completedRawValue(
  field: LuxonDateField,
  fields: Partial<Record<LuxonDateField, string>>,
  tokens: readonly SmartToken[],
): string | null {
  const raw = fields[field];
  const token = tokens.find(
    (candidate): candidate is NumericFieldToken =>
      candidate.type === "field" && candidate.field === field,
  );

  return raw && token && isNumericTokenComplete(token, raw) ? raw : null;
}

function completedNumber(
  field: LuxonDateField,
  fields: Partial<Record<LuxonDateField, string>>,
  tokens: readonly SmartToken[],
): number | null {
  const raw = completedRawValue(field, fields, tokens);
  return raw === null ? null : Number(raw);
}

function normalizeCalendarYear(rawYear: string): number {
  if (rawYear.length !== 2) {
    return Number(rawYear);
  }

  const parsed = DateTime.fromFormat(rawYear, "yy");
  return parsed.isValid ? parsed.year : Number(rawYear);
}

function maximumDayForKnownDate(month: number, year: number | null): number {
  if (month === 2) {
    if (year === null) {
      return 29;
    }

    return DateTime.local(year, 2).daysInMonth ?? 29;
  }

  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function formatNumericTokenValue(
  token: NumericFieldToken,
  value: number,
): string {
  if (token.token === "yy") {
    return String(Math.abs(value) % 100).padStart(2, "0");
  }

  const raw = String(value);
  return token.padded ? raw.padStart(token.maximumWidth, "0") : raw;
}
