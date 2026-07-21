import { TestBed } from "@angular/core/testing";
import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";
import { DatepickerPasteParserService } from "./datepicker-paste-parser.service";
import { LuxonDateInputAutocomplete } from "./luxon-date-input-autocomplete";

describe("DatepickerPasteParserService", () => {
  let service: DatepickerPasteParserService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DatepickerPasteParserService],
    });
    service = TestBed.inject(DatepickerPasteParserService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should return pastedResult when it contains a date and replaces complete value", () => {
    const autocomplete = new LuxonDateInputAutocomplete("dd.MM.yyyy", "de-DE");
    const pastedValue = "15.07.2026";
    const inputState = {
      value: "01.01.2026",
      selectionStart: 0,
      selectionEnd: 10,
    };
    const options = { now: DateTime.now(), locale: "de-DE" };

    const result = service.parse(pastedValue, inputState, autocomplete, options);

    expect(result.date).not.toBeNull();
    expect(result.value).toBe("15.07.2026");
  });

  it("should return combinedResult when pasted value is partial and does not replace everything", () => {
    const autocomplete = new LuxonDateInputAutocomplete("dd.MM.yyyy", "de-DE");
    const pastedValue = "15";
    const inputState = {
      value: ".07.2026",
      selectionStart: 0,
      selectionEnd: 0,
    };
    const options = { now: DateTime.now(), locale: "de-DE" };

    const result = service.parse(pastedValue, inputState, autocomplete, options);

    expect(result.value).toBe("15.07.2026");
  });

  it("should use pasted value if it looks like an epoch even if not replacing everything", () => {
    const autocomplete = new LuxonDateInputAutocomplete("dd.MM.yyyy", "de-DE");
    const pastedValue = "1752598751000";
    const inputState = {
      value: "partial",
      selectionStart: 0,
      selectionEnd: 7,
    };
    const options = { now: DateTime.now(), locale: "de-DE" };

    const result = service.parse(pastedValue, inputState, autocomplete, options);

    expect(result.date).not.toBeNull();
  });
});
