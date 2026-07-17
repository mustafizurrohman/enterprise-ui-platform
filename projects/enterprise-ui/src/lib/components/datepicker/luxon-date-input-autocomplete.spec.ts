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

  describe("pasted formatted values", () => {
    it("normalizes surrounding whitespace and adds an omitted Uhr suffix", () => {
      const result = new LuxonDateInputAutocomplete(
        "dd.MM.yyyy HH:mm 'Uhr'",
      ).processPastedValue("\u00a0 15.07.2026 16:59 \u00a0", { now });

      expect(result.value).toBe("15.07.2026 16:59 Uhr");
      expect(result.date?.toISO()).toBe(
        DateTime.fromISO("2026-07-15T16:59:00").toISO(),
      );
    });

    it.each(["uhr", "UHR", "uHr"])(
      "normalizes a case-insensitive %s suffix",
      (suffix) => {
        const result = new LuxonDateInputAutocomplete(
          "dd.MM.yyyy HH:mm 'Uhr'",
        ).processPastedValue(`15.07.2026 16:59 ${suffix}`, { now });

        expect(result.value).toBe("15.07.2026 16:59 Uhr");
        expect(result.date?.toISO()).toBe(
          DateTime.fromISO("2026-07-15T16:59:00").toISO(),
        );
      },
    );

    it("accepts a missing space before an optional Uhr suffix", () => {
      const result = new LuxonDateInputAutocomplete(
        "dd.MM.yyyy HH:mm 'Uhr'",
      ).processPastedValue("15.07.2026 16:59Uhr", { now });

      expect(result.value).toBe("15.07.2026 16:59 Uhr");
      expect(result.date?.isValid).toBe(true);
    });

    it("ignores a single Uhr suffix when the configured format omits it", () => {
      const result = new LuxonDateInputAutocomplete(
        "dd.MM.yyyy HH:mm",
      ).processPastedValue("15.07.2026 16:59 Uhr", { now });

      expect(result.value).toBe("15.07.2026 16:59");
      expect(result.date?.toISO()).toBe(
        DateTime.fromISO("2026-07-15T16:59:00").toISO(),
      );
    });

    it("does not accept a duplicated Uhr suffix", () => {
      const result = new LuxonDateInputAutocomplete(
        "dd.MM.yyyy HH:mm 'Uhr'",
      ).processPastedValue("15.07.2026 16:59 Uhr Uhr", { now });

      expect(result.valid).toBe(false);
      expect(result.date).toBeNull();
      expect(result.error?.code).toBe("INVALID_CHARACTER");
    });

    it("normalizes configured literals case-insensitively", () => {
      const result = new LuxonDateInputAutocomplete(
        "dd.MM.yyyy 'um' HH:mm 'Uhr'",
      ).processPastedValue("15.07.2026 UM 16:59 UHR", { now });

      expect(result.value).toBe("15.07.2026 um 16:59 Uhr");
      expect(result.date?.isValid).toBe(true);
    });

    it("does not silently ignore trailing pasted input", () => {
      const result = new LuxonDateInputAutocomplete(
        "dd.MM.yyyy",
      ).processPastedValue("15.07.2026 extra", { now });

      expect(result.valid).toBe(false);
      expect(result.date).toBeNull();
      expect(result.error?.code).toBe("INVALID_CHARACTER");
    });

    it("reports unexpected trailing numeric input", () => {
      const result = new LuxonDateInputAutocomplete(
        "dd.MM.yyyy",
      ).processPastedValue("15.07.2026 99", { now });

      expect(result.valid).toBe(false);
      expect(result.date).toBeNull();
      expect(result.error?.code).toBe("UNEXPECTED_INPUT");
    });

    it("keeps compact dates distinct from epoch values", () => {
      const result = new LuxonDateInputAutocomplete(
        "ddMMyyyy",
      ).processPastedValue("15072026", { now });

      expect(result.value).toBe("15072026");
      expect(result.date?.toISODate()).toBe("2026-07-15");
    });
  });

  describe("pasted epoch values", () => {
    it.each([
      ["seconds", "1752598751", 1_752_598_751_000],
      ["milliseconds", "1752598751000", 1_752_598_751_000],
      ["seconds with suffix", "1752598751 Uhr", 1_752_598_751_000],
      ["epoch origin", "0", 0],
      ["negative seconds", "-1", -1_000],
      ["explicit positive seconds", "+1", 1_000],
    ])(
      "parses %s and renders the configured format",
      (_, epoch, expectedMilliseconds) => {
        const result = new LuxonDateInputAutocomplete(
          "dd.MM.yyyy HH:mm:ss 'Uhr'",
        ).processPastedValue(epoch, { now });
        const expected = DateTime.fromMillis(expectedMilliseconds);

        expect(result.valid).toBe(true);
        expect(result.complete).toBe(true);
        expect(result.date?.toMillis()).toBe(expected.toMillis());
        expect(result.value).toBe(
          expected.toFormat("dd.MM.yyyy HH:mm:ss 'Uhr'"),
        );
      },
    );

    it("uses the seconds/milliseconds boundary consistently", () => {
      const autocomplete = new LuxonDateInputAutocomplete(
        "yyyy-MM-dd HH:mm:ss",
      );
      const seconds = autocomplete.processPastedValue("9999999999", { now });
      const milliseconds = autocomplete.processPastedValue("10000000000", {
        now,
      });

      expect(seconds.date?.toMillis()).toBe(9_999_999_999_000);
      expect(milliseconds.date?.toMillis()).toBe(10_000_000_000);
    });

    it.each([
      ["ambiguous short unsigned integer", "16"],
      ["decimal seconds", "1752598751.5"],
      ["scientific notation", "1.752598751e9"],
      ["microseconds", "1752598751000000"],
      ["sign only", "+"],
    ])("rejects %s as an epoch", (_, value) => {
      const result = new LuxonDateInputAutocomplete(
        "dd.MM.yyyy HH:mm:ss 'Uhr'",
      ).processPastedValue(value, { now });

      expect(result.date).toBeNull();
    });
  });

  describe("Luxon format support", () => {
    it.each([
      ["textual month", "dd MMMM yyyy", "15 Juli 2026", "2026-07-15"],
      [
        "12-hour time with meridiem",
        "MM/dd/yyyy h:mm a",
        "07/15/2026 4:59 PM",
        "2026-07-15T16:59:00",
      ],
      ["ISO week date", "kkkk-'W'WW-E", "2026-W29-3", "2026-07-15"],
      ["ordinal date", "yyyy-ooo", "2026-196", "2026-07-15"],
      ["localized macro", "D", "15.7.2026", "2026-07-15"],
      [
        "numeric offset",
        "yyyy-MM-dd HH:mm ZZZ",
        "2026-07-15 16:59 +0200",
        "2026-07-15T16:59:00+02:00",
      ],
      [
        "IANA zone",
        "yyyy-MM-dd HH:mm z",
        "2026-07-15 16:59 Europe/Berlin",
        "2026-07-15T16:59:00+02:00",
      ],
    ])("parses a %s format", (_, format, value, expectedIso) => {
      const result = new LuxonDateInputAutocomplete(format, "de-DE").process(
        value,
        { commit: true, locale: "de-DE", now },
      );

      expect(result.valid).toBe(true);
      expect(result.complete).toBe(true);
      expect(result.date?.toMillis()).toBe(
        DateTime.fromISO(expectedIso, { setZone: true }).toMillis(),
      );
      expect(result.value).toBe(
        result.date?.setLocale("de-DE").toFormat(format),
      );
    });

    it("keeps an incomplete generic-format value editable until commit", () => {
      const autocomplete = new LuxonDateInputAutocomplete("dd MMMM yyyy");

      const editing = autocomplete.process("15 Jul", { now });
      const committed = autocomplete.process("15 Jul", { now, commit: true });

      expect(editing.value).toBe("15 Jul");
      expect(editing.valid).toBe(true);
      expect(editing.complete).toBe(false);
      expect(committed.valid).toBe(false);
      expect(committed.error?.code).toBe("INVALID_DATE");
    });

    it.each([
      ["empty", ""],
      ["whitespace-only", "   "],
      ["unknown token", "dd.MM.yyy"],
      ["unclosed literal", "dd.MM.yyyy 'Uhr"],
      ["literal-only", "'Datum'"],
      ["conflicting meridiem", "HH:mm a"],
      ["format-only zone name", "yyyy-MM-dd ZZZZ"],
      ["format-only epoch token", "X"],
    ])("throws for an invalid %s format", (_, format) => {
      expect(() => new LuxonDateInputAutocomplete(format)).toThrowError(
        /Invalid Luxon date format/u,
      );
    });
  });

  it("provides default formats and descriptions", () => {
    expect(LuxonDateInputAutocomplete.getFormat({ dateOnly: true })).toBe(
      "dd.MM.yyyy",
    );
    expect(
      LuxonDateInputAutocomplete.getFormatDescription({ dateOnly: true }),
    ).toBe("TT.MM.JJJJ");
    expect(LuxonDateInputAutocomplete.getFormat({ showSeconds: true })).toBe(
      "dd.MM.yyyy HH:mm:ss 'Uhr'",
    );
    expect(
      LuxonDateInputAutocomplete.getFormatDescription({ showSeconds: true }),
    ).toBe("TT.MM.JJJJ HH:mm:ss Uhr");
  });
});
