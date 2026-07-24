import { Injectable } from "@angular/core";
import type { DateTime } from "luxon";
import {
  LuxonDateInputAutocomplete,
  parseLuxonFormat,
} from "./luxon-date-input-autocomplete";
import type { DateInputAutocompleteResult } from "./luxon-date-input-autocomplete.types";
import type {
  DatepickerPasteInputState,
  NormalizedSelection,
} from "./datepicker-paste-parser.types";

@Injectable({
  providedIn: "root",
})
export class DatepickerPasteParserService {
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
    inputState: DatepickerPasteInputState,
    autocomplete: LuxonDateInputAutocomplete,
    options: { now: DateTime; locale: string },
  ): DateInputAutocompleteResult {
    const format = autocomplete.getDateFormat();
    const normalizedPastedValue = normalizeSeparators(pastedValue, format);

    const pastedResult = autocomplete.processPastedValue(pastedValue, options);
    if (isCompleteDateResult(pastedResult)) {
      return pastedResult;
    }

    if (normalizedPastedValue !== pastedValue) {
      const normalizedPastedResult = autocomplete.processPastedValue(
        normalizedPastedValue,
        options,
      );
      if (isCompleteDateResult(normalizedPastedResult)) {
        return normalizedPastedResult;
      }
    }

    const selection = normalizeSelection(inputState);
    const nextValue = replaceSelection(
      inputState.value,
      pastedValue,
      selection,
    );
    const combinedResult = autocomplete.processPastedValue(nextValue, options);
    if (isCompleteDateResult(combinedResult)) {
      return combinedResult;
    }

    const nextValueNormalized = replaceSelection(
      inputState.value,
      normalizedPastedValue,
      selection,
    );
    if (nextValueNormalized !== nextValue) {
      const normalizedCombinedResult = autocomplete.processPastedValue(
        nextValueNormalized,
        options,
      );
      if (isCompleteDateResult(normalizedCombinedResult)) {
        return normalizedCombinedResult;
      }
    }

    return combinedResult;
  }
}

function normalizeSeparators(pastedValue: string, format: string): string {
  const parts = pastedValue.match(/[\p{L}\d]+/ug);
  if (!parts || parts.length === 0) {
    return pastedValue;
  }

  const formatParts = parseLuxonFormat(format);
  let result = "";
  let partIndex = 0;

  for (const fp of formatParts) {
    if (fp.literal) {
      if (partIndex > 0) {
        const literalValue = fp.value.trim().toLowerCase();
        const isAlphanumericLiteral = /[\p{L}\d]/u.test(literalValue);

        if (isAlphanumericLiteral) {
          if (
            partIndex < parts.length &&
            parts[partIndex].toLowerCase() === literalValue
          ) {
            result += fp.value;
            partIndex++;
          } else {
            return pastedValue;
          }
        } else {
          if (partIndex < parts.length) {
            result += fp.value;
          }
        }
      }
    } else {
      if (partIndex < parts.length) {
        result += parts[partIndex];
        partIndex++;
      } else {
        break;
      }
    }
  }

  return result || pastedValue;
}

function normalizeSelection(
  inputState: DatepickerPasteInputState,
): NormalizedSelection {
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
  return (
    currentValue.slice(0, selection.start) +
    pastedValue +
    currentValue.slice(selection.end)
  );
}

function isCompleteDateResult(result: DateInputAutocompleteResult): boolean {
  return result.complete && result.valid && result.date !== null;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}
