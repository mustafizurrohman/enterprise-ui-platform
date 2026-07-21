import { Injectable } from "@angular/core";
import { DateTime } from "luxon";
import { LuxonDateInputAutocomplete } from "./luxon-date-input-autocomplete";
import { DateInputAutocompleteResult } from "./luxon-date-input-autocomplete.types";

@Injectable({
  providedIn: "root",
})
export class DatepickerPasteParserService {
  /**
   * Parses a pasted string and determines the resulting date and input value.
   *
   * @param pastedValue The raw string from the clipboard.
   * @param inputState The current state of the HTML input element.
   * @param autocomplete The autocomplete instance to use for parsing.
   * @param options Options for the autocomplete process.
   * @returns The result of the parsing process.
   */
  parse(
    pastedValue: string,
    inputState: {
      value: string;
      selectionStart: number | null;
      selectionEnd: number | null;
    },
    autocomplete: LuxonDateInputAutocomplete,
    options: { now: DateTime; locale: string },
  ): DateInputAutocompleteResult {
    const selectionStart = inputState.selectionStart ?? 0;
    const selectionEnd =
      inputState.selectionEnd ?? inputState.value.length;
    const replacesCompleteValue =
      selectionStart === 0 && selectionEnd === inputState.value.length;

    const nextValue =
      inputState.value.slice(0, selectionStart) +
      pastedValue +
      inputState.value.slice(selectionEnd);

    const combinedResult = autocomplete.processPastedValue(
      nextValue,
      options,
    );
    const pastedResult = autocomplete.processPastedValue(
      pastedValue,
      options,
    );

    const shouldUsePastedValue =
      !!pastedResult.date &&
      (replacesCompleteValue ||
        !inputState.value ||
        this.looksLikeCompleteDateOrEpoch(pastedValue));

    return shouldUsePastedValue ? pastedResult : combinedResult;
  }

  /**
   * Checks if a string looks like a complete date format or a Unix epoch.
   */
  private looksLikeCompleteDateOrEpoch(value: string): boolean {
    const normalizedValue = value
      .trim()
      .replace(/(?:\s|\u00a0)*uhr(?:\s|\u00a0)*$/iu, "")
      .trimEnd();

    return (
      /[./:\-T]/u.test(normalizedValue) ||
      /^[+-]?\d{8,13}$/u.test(normalizedValue)
    );
  }
}
