import { Injectable } from '@angular/core';
import { DateTime } from 'luxon';
import { LuxonDateInputAutocomplete, parseLuxonFormat } from './luxon-date-input-autocomplete';
import type {
  DateInputAutocompleteResult,
  DateInputAutocompleteOptions,
} from './luxon-date-input-autocomplete.types';
import type { DatepickerInputState, NormalizedSelection } from './datepicker-parser.types';

const NUMERIC_SEGMENT_TOKENS = new Set([
  'y',
  'yy',
  'yyyy',
  'yyyyy',
  'yyyyyy',
  'M',
  'MM',
  'L',
  'LL',
  'd',
  'dd',
  'o',
  'ooo',
  'H',
  'HH',
  'h',
  'hh',
  'm',
  'mm',
  's',
  'ss',
  'S',
  'SSS',
  'u',
  'uu',
  'uuu',
  'q',
  'qq',
  'kk',
  'kkkk',
  'W',
  'WW',
  'E',
  'c',
]);

const TEXT_SEGMENT_TOKENS = new Set([
  'MMM',
  'MMMM',
  'LLL',
  'LLLL',
  'a',
  'EEE',
  'EEEE',
  'ccc',
  'cccc',
]);

const SEGMENT_PATTERN = /[\p{L}\p{M}\d]+/gu;

@Injectable({
  providedIn: 'root',
})
export class DatepickerParserService {
  /**
   * Parses clipboard input either as a complete standalone value or as a
   * partial replacement within the current input value.
   *
   * A pasted value that independently produces a complete Luxon date always
   * wins. This deliberately relies on the configured autocomplete parser
   * instead of punctuation-based heuristics, so textual months, localized
   * macros, ISO week dates, ordinal dates, zones, literals, compact formats,
   * and Unix epochs are handled consistently.
   *
   * @param pastedValue The raw clipboard value.
   * @param inputState The current value and selection of the HTML input.
   * @param autocomplete The configured autocomplete/parser instance.
   * @param options Date, time, and locale context used for parsing.
   * @returns The standalone pasted result when complete; otherwise the result
   *   of inserting the pasted text into the current input value.
   */
  parse(
    pastedValue: string,
    inputState: DatepickerInputState,
    autocomplete: LuxonDateInputAutocomplete,
    options: DateInputAutocompleteOptions,
  ): DateInputAutocompleteResult {
    const now = options.now ?? DateTime.now();
    const locale = options.locale ?? autocomplete.getLocale();
    const parseOptions = { ...options, now, locale };

    const format = autocomplete.getDateFormat();
    const normalizedPastedValue = normalizeSeparators(pastedValue, format);

    const pastedResult = autocomplete.processPastedValue(pastedValue, parseOptions);
    if (isCompleteDateResult(pastedResult)) {
      return pastedResult;
    }

    if (normalizedPastedValue !== pastedValue) {
      const normalizedPastedResult = autocomplete.processPastedValue(
        normalizedPastedValue,
        parseOptions,
      );
      if (isCompleteDateResult(normalizedPastedResult)) {
        return normalizedPastedResult;
      }
    }

    const selection = normalizeSelection(inputState);
    const nextValue = replaceSelection(inputState.value, pastedValue, selection);
    const combinedResult = autocomplete.processPastedValue(nextValue, parseOptions);
    if (isCompleteDateResult(combinedResult)) {
      return combinedResult;
    }

    const nextValueNormalized = replaceSelection(
      inputState.value,
      normalizedPastedValue,
      selection,
    );
    let normalizedCombinedResult: DateInputAutocompleteResult | null = null;

    if (nextValueNormalized !== nextValue) {
      normalizedCombinedResult = autocomplete.processPastedValue(nextValueNormalized, parseOptions);
      if (isCompleteDateResult(normalizedCombinedResult)) {
        return normalizedCombinedResult;
      }
    }

    if (hasRelevantNormalizedError(normalizedCombinedResult)) {
      return normalizedCombinedResult;
    }

    return combinedResult;
  }
}

/**
 * Rebuilds a supported date/time value with the separators and literals from
 * its configured Luxon format. Input separators may be mixed or completely
 * different, while field order remains defined exclusively by the format.
 *
 * Complex Luxon tokens such as macros, eras, offsets, and IANA zones are left
 * untouched. Their values can contain meaningful punctuation or multiple word
 * segments and are therefore delegated to the original parser unchanged.
 */
function normalizeSeparators(pastedValue: string, format: string): string {
  const formatParts = parseLuxonFormat(format);
  if (!supportsSeparatorNormalization(formatParts)) {
    return pastedValue;
  }

  const segments = extractValueSegments(pastedValue, formatParts);
  if (segments.length === 0) {
    return pastedValue;
  }

  let normalizedValue = '';
  let segmentIndex = 0;
  let consumedTokenCount = 0;
  let hasIncompatibleSegment = false;
  let allLiteralsMatched = true;

  for (let partIndex = 0; partIndex < formatParts.length; partIndex++) {
    const formatPart = formatParts[partIndex];

    if (!formatPart.literal) {
      const segment = segments[segmentIndex];
      if (!segment) {
        break;
      }
      if (!matchesTokenSegment(segment, formatPart.value)) {
        hasIncompatibleSegment = true;
        break;
      }

      normalizedValue += segment;
      segmentIndex++;
      consumedTokenCount++;
      continue;
    }

    const literalWords = formatPart.value.match(SEGMENT_PATTERN) ?? [];
    const consumedLiteralWordCount = countMatchingLiteralWords(
      segments,
      segmentIndex,
      literalWords,
    );
    const hasMatchedLiteralWords =
      literalWords.length > 0 && consumedLiteralWordCount === literalWords.length;

    if (hasMatchedLiteralWords) {
      segmentIndex += consumedLiteralWordCount;
    } else if (literalWords.length > 0) {
      allLiteralsMatched = false;
    }

    const remainingTokenCount = countRemainingTokens(formatParts, partIndex + 1);
    const hasSegmentForNextToken = segmentIndex < segments.length;
    const isLeadingLiteral = consumedTokenCount === 0;
    const isTrailingLiteral = remainingTokenCount === 0;

    if (isLeadingLiteral) {
      if (hasMatchedLiteralWords) {
        normalizedValue += formatPart.value;
      }
      continue;
    }

    if (isTrailingLiteral) {
      if (hasMatchedLiteralWords || literalWords.length === 0) {
        normalizedValue += formatPart.value;
      }
      continue;
    }

    if (hasSegmentForNextToken) {
      normalizedValue += formatPart.value;
    }
  }

  const allSegmentsConsumed = segmentIndex === segments.length;

  return consumedTokenCount > 0 &&
    !hasIncompatibleSegment &&
    (allSegmentsConsumed || allLiteralsMatched)
    ? normalizedValue
    : pastedValue;
}

function extractValueSegments(
  pastedValue: string,
  formatParts: ReturnType<typeof parseLuxonFormat>,
): readonly string[] {
  const literalWords = formatParts
    .filter((part) => part.literal)
    .flatMap((part) => part.value.match(SEGMENT_PATTERN) ?? [])
    .sort((left, right) => right.length - left.length);
  let tokenizableValue = pastedValue;

  for (const literalWord of literalWords) {
    const escapedLiteral = escapeRegExp(literalWord);
    const literalPattern = new RegExp(
      `(^|[^\\p{L}\\p{M}])(${escapedLiteral})(?=$|[^\\p{L}\\p{M}])`,
      'giu',
    );
    tokenizableValue = tokenizableValue.replace(
      literalPattern,
      (_match, prefix: string, matchedLiteral: string) => `${prefix} ${matchedLiteral} `,
    );
  }

  return tokenizableValue.match(SEGMENT_PATTERN) ?? [];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

function supportsSeparatorNormalization(formatParts: ReturnType<typeof parseLuxonFormat>): boolean {
  return (
    formatParts.some((part) => !part.literal) &&
    formatParts
      .filter((part) => !part.literal)
      .every(
        (part) => NUMERIC_SEGMENT_TOKENS.has(part.value) || TEXT_SEGMENT_TOKENS.has(part.value),
      )
  );
}

function matchesTokenSegment(segment: string, token: string): boolean {
  if (NUMERIC_SEGMENT_TOKENS.has(token)) {
    return /^\d+$/u.test(segment);
  }

  return TEXT_SEGMENT_TOKENS.has(token) && /^[\p{L}\p{M}]+$/u.test(segment);
}

function countMatchingLiteralWords(
  segments: readonly string[],
  startIndex: number,
  literalWords: readonly string[],
): number {
  if (literalWords.length === 0) {
    return 0;
  }

  for (let index = 0; index < literalWords.length; index++) {
    const segment = segments[startIndex + index];
    if (!segment || segment.toLocaleLowerCase() !== literalWords[index].toLocaleLowerCase()) {
      return 0;
    }
  }

  return literalWords.length;
}

function countRemainingTokens(
  formatParts: ReturnType<typeof parseLuxonFormat>,
  startIndex: number,
): number {
  let count = 0;

  for (let index = startIndex; index < formatParts.length; index++) {
    if (!formatParts[index].literal) {
      count++;
    }
  }

  return count;
}

function normalizeSelection(inputState: DatepickerInputState): NormalizedSelection {
  const valueLength = inputState.value.length;
  const rawStart = inputState.selectionStart ?? 0;
  const rawEnd = inputState.selectionEnd ?? valueLength;
  const start = clamp(Math.min(rawStart, rawEnd), 0, valueLength);
  const end = clamp(Math.max(rawStart, rawEnd), 0, valueLength);

  return { start, end };
}

function replaceSelection(
  currentValue: string,
  pastedValue: string,
  selection: NormalizedSelection,
): string {
  return currentValue.slice(0, selection.start) + pastedValue + currentValue.slice(selection.end);
}

function hasRelevantNormalizedError(
  result: DateInputAutocompleteResult | null,
): result is DateInputAutocompleteResult {
  return result?.error?.code === 'INVALID_DAY_FOR_MONTH' || result?.error?.code === 'OUT_OF_RANGE';
}

function isCompleteDateResult(result: DateInputAutocompleteResult): boolean {
  return result.complete && result.valid && result.date !== null;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}
