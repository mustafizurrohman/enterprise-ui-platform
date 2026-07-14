import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";
import { LuxonDateInputAutocomplete } from "./luxon-date-input-autocomplete";

describe("LuxonDateInputAutocomplete", () => {
  const now = DateTime.fromISO("2026-07-14T18:30:45");

  it("pads an unambiguous month and appends its separator", () => {
    const result = new LuxonDateInputAutocomplete("MM-dd-yyyy").process("3", {
      now,
    });

    expect(result.value).toBe("03-");
    expect(result.valid).toBe(true);
  });

  it("commits an ambiguous single-digit day on submission", () => {
    const autocomplete = new LuxonDateInputAutocomplete("dd-MM-yyyy");

    expect(autocomplete.process("3", { now }).value).toBe("3");
    expect(autocomplete.process("3", { now, commit: true }).value).toBe("03-");
  });

  it("supports year-first formats and compact input", () => {
    const result = new LuxonDateInputAutocomplete("yyyy-MM-dd").process(
      "202603",
      { now },
    );

    expect(result.value).toBe("2026-03-");
  });

  it("rejects impossible day and month combinations", () => {
    const result = new LuxonDateInputAutocomplete("dd-MM-yyyy").process(
      "31-02",
      { now },
    );

    expect(result.valid).toBe(false);
    expect(result.error?.code).toBe("INVALID_DAY_FOR_MONTH");
  });

  it("validates leap years when the year is available", () => {
    const invalid = new LuxonDateInputAutocomplete("dd-MM-yyyy").process(
      "29-02-2025",
      { now },
    );
    const valid = new LuxonDateInputAutocomplete("dd-MM-yyyy").process(
      "29-02-2024",
      { now },
    );

    expect(invalid.valid).toBe(false);
    expect(valid.valid).toBe(true);
    expect(valid.date?.toISODate()).toBe("2024-02-29");
  });

  it("builds a completion suggestion from the current date and time", () => {
    const result = new LuxonDateInputAutocomplete(
      "yyyy-MM-dd HH:mm:ss",
    ).process("2026-07-", { now });

    expect(result.suggestedValue).toBe("2026-07-14 18:30:45");
  });
});
