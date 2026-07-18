import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";
import { LuxonDateInputAutocomplete } from "./luxon-date-input-autocomplete";

const DEFAULT_DATETIME_FORMAT = "dd.MM.yyyy HH:mm 'Uhr'";

const COMMON_LUXON_DATE_FORMATS = [
  // German — dots, padded
  "dd.MM.yyyy",
  "dd.MM.yyyy HH:mm",
  DEFAULT_DATETIME_FORMAT,
  "dd.MM.yyyy HH:mm:ss",
  "dd.MM.yyyy HH:mm:ss 'Uhr'",

  // German — dots, unpadded
  "d.M.yyyy",
  "d.M.yyyy H:mm",
  "d.M.yyyy H:mm 'Uhr'",
  "d.M.yyyy H:mm:ss",
  "d.M.yyyy H:mm:ss 'Uhr'",

  // ISO 8601-style — hyphen and space
  "yyyy-MM-dd",
  "yyyy-MM-dd HH:mm",
  "yyyy-MM-dd HH:mm:ss",

  // ISO 8601-style — T separator
  "yyyy-MM-dd'T'HH:mm",
  "yyyy-MM-dd'T'HH:mm:ss",

  // Year first — slash
  "yyyy/MM/dd",
  "yyyy/MM/dd HH:mm",
  "yyyy/MM/dd HH:mm:ss",

  // European — slash, padded
  "dd/MM/yyyy",
  "dd/MM/yyyy HH:mm",
  "dd/MM/yyyy HH:mm:ss",

  // European — slash, unpadded
  "d/M/yyyy",
  "d/M/yyyy H:mm",
  "d/M/yyyy H:mm:ss",

  // European — hyphen, padded
  "dd-MM-yyyy",
  "dd-MM-yyyy HH:mm",
  "dd-MM-yyyy HH:mm:ss",

  // European — hyphen, unpadded
  "d-M-yyyy",
  "d-M-yyyy H:mm",
  "d-M-yyyy H:mm:ss",

  // US — slash, padded, 12-hour
  "MM/dd/yyyy",
  "MM/dd/yyyy hh:mm a",
  "MM/dd/yyyy hh:mm:ss a",

  // US — slash, unpadded, 12-hour
  "M/d/yyyy",
  "M/d/yyyy h:mm a",
  "M/d/yyyy h:mm:ss a",

  // US — hyphen, padded, 12-hour
  "MM-dd-yyyy",
  "MM-dd-yyyy hh:mm a",
  "MM-dd-yyyy hh:mm:ss a",

  // US — hyphen, unpadded, 12-hour
  "M-d-yyyy",
  "M-d-yyyy h:mm a",
  "M-d-yyyy h:mm:ss a",

  // Short year — German
  "dd.MM.yy",
  "dd.MM.yy HH:mm",
  "dd.MM.yy HH:mm:ss",

  // Short year — European slash
  "dd/MM/yy",
  "dd/MM/yy HH:mm",
  "dd/MM/yy HH:mm:ss",

  // Short year — European hyphen
  "dd-MM-yy",
  "dd-MM-yy HH:mm",
  "dd-MM-yy HH:mm:ss",

  // Short year — US slash
  "MM/dd/yy",
  "MM/dd/yy hh:mm a",
  "MM/dd/yy hh:mm:ss a",

  // Short year — US hyphen
  "MM-dd-yy",
  "MM-dd-yy hh:mm a",
  "MM-dd-yy hh:mm:ss a",

  // European — abbreviated month name
  "dd MMM yyyy",
  "dd MMM yyyy HH:mm",
  "dd MMM yyyy HH:mm:ss",

  // European — abbreviated month name, unpadded
  "d MMM yyyy",
  "d MMM yyyy H:mm",
  "d MMM yyyy H:mm:ss",

  // European — full month name
  "dd MMMM yyyy",
  "dd MMMM yyyy HH:mm",
  "dd MMMM yyyy HH:mm:ss",

  // European — full month name, unpadded
  "d MMMM yyyy",
  "d MMMM yyyy H:mm",
  "d MMMM yyyy H:mm:ss",

  // US — abbreviated month name
  "MMM dd, yyyy",
  "MMM dd, yyyy hh:mm a",
  "MMM dd, yyyy hh:mm:ss a",

  // US — abbreviated month name, unpadded
  "MMM d, yyyy",
  "MMM d, yyyy h:mm a",
  "MMM d, yyyy h:mm:ss a",

  // US — full month name
  "MMMM dd, yyyy",
  "MMMM dd, yyyy hh:mm a",
  "MMMM dd, yyyy hh:mm:ss a",

  // US — full month name, unpadded
  "MMMM d, yyyy",
  "MMMM d, yyyy h:mm a",
  "MMMM d, yyyy h:mm:ss a",

  // European — abbreviated weekday and month
  "ccc, dd MMM yyyy",
  "ccc, dd MMM yyyy HH:mm",
  "ccc, dd MMM yyyy HH:mm:ss",

  // European — full weekday and month
  "cccc, dd MMMM yyyy",
  "cccc, dd MMMM yyyy HH:mm",
  "cccc, dd MMMM yyyy HH:mm:ss",

  // US — abbreviated weekday and month
  "ccc, MMM dd, yyyy",
  "ccc, MMM dd, yyyy hh:mm a",
  "ccc, MMM dd, yyyy hh:mm:ss a",

  // US — full weekday and month
  "cccc, MMMM dd, yyyy",
  "cccc, MMMM dd, yyyy hh:mm a",
  "cccc, MMMM dd, yyyy hh:mm:ss a",
] as const;

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

  describe("common Luxon date formats", () => {
    const testDate = DateTime.fromObject(
      {
        year: 2026,
        month: 7,
        day: 5,
        hour: 4,
        minute: 9,
        second: 8,
      },
      { zone: "Europe/Berlin" },
    );

    it("contains no duplicate formats", () => {
      expect(new Set(COMMON_LUXON_DATE_FORMATS).size).toBe(
        COMMON_LUXON_DATE_FORMATS.length,
      );
    });

    it.each(COMMON_LUXON_DATE_FORMATS)(
      'round-trips the "%s" format',
      (format) => {
        const locale = isUsDateFormat(format) ? "en-US" : "de-DE";
        const expectedValue = testDate.setLocale(locale).toFormat(format);
        const expectedDate = DateTime.fromFormat(expectedValue, format, {
          locale,
          setZone: true,
        });
        const result = new LuxonDateInputAutocomplete(
          format,
          locale,
        ).processPastedValue(expectedValue, { locale, now });

        expect(expectedDate.isValid).toBe(true);
        expect(result.valid).toBe(true);
        expect(result.complete).toBe(true);
        expect(result.error).toBeNull();
        expect(result.date?.toMillis()).toBe(expectedDate.toMillis());
        expect(result.value).toBe(expectedValue);
        expect(
          DateTime.fromFormat(result.value, format, {
            locale,
            setZone: true,
          }).isValid,
        ).toBe(true);
      },
    );
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

    it.each([
      ["abbreviated era", "G y-MM-dd", "AD 2026-07-15", "en-US", "2026-07-15"],
      [
        "full era",
        "GG y-MM-dd",
        "Anno Domini 2026-07-15",
        "en-US",
        "2026-07-15",
      ],
      [
        "four-to-six-digit year",
        "yyyyy-MM-dd",
        "02026-07-15",
        "en-US",
        "2026-07-15",
      ],
      ["six-digit year", "yyyyyy-MM-dd", "002026-07-15", "en-US", "2026-07-15"],
      [
        "localized short weekday",
        "yyyy-MM-dd EEE",
        "2026-07-15 Mi",
        "de-DE",
        "2026-07-15",
      ],
      [
        "localized long weekday",
        "yyyy-MM-dd EEEE",
        "2026-07-15 Mittwoch",
        "de-DE",
        "2026-07-15",
      ],
      [
        "standalone short weekday",
        "yyyy-MM-dd ccc",
        "2026-07-15 Mi",
        "de-DE",
        "2026-07-15",
      ],
      [
        "standalone long weekday",
        "yyyy-MM-dd cccc",
        "2026-07-15 Mittwoch",
        "de-DE",
        "2026-07-15",
      ],
      ["quarter", "yyyy-'Q'q", "2026-Q3", "en-US", "2026-07-01"],
      ["padded quarter", "yyyy-'Q'qq", "2026-Q03", "en-US", "2026-07-01"],
      [
        "milliseconds",
        "yyyy-MM-dd HH:mm:ss.SSS",
        "2026-07-15 16:59:12.125",
        "en-US",
        "2026-07-15",
      ],
      [
        "fractional seconds",
        "yyyy-MM-dd HH:mm:ss.u",
        "2026-07-15 16:59:12.125",
        "en-US",
        "2026-07-15",
      ],
      [
        "two-digit fractional seconds",
        "yyyy-MM-dd HH:mm:ss.uu",
        "2026-07-15 16:59:12.12",
        "en-US",
        "2026-07-15",
      ],
      [
        "one-digit fractional seconds",
        "yyyy-MM-dd HH:mm:ss.uuu",
        "2026-07-15 16:59:12.1",
        "en-US",
        "2026-07-15",
      ],
    ])(
      "parses a %s parser-compatible format",
      (_, format, value, locale, expectedIsoDate) => {
        const result = new LuxonDateInputAutocomplete(format, locale).process(
          value,
          { commit: true, locale, now },
        );

        expect(result.valid).toBe(true);
        expect(result.complete).toBe(true);
        expect(result.date?.toISODate()).toBe(expectedIsoDate);
        expect(
          DateTime.fromFormat(result.value, format, {
            locale,
            setZone: true,
          }).isValid,
        ).toBe(true);
      },
    );

    it.each([
      ["localized time with short zone", "ttt", "16:59:12 +0200"],
      [
        "localized date-time with short zone",
        "fff",
        "15. Juli 2026 um 16:59 +0200",
      ],
    ])("keeps a %s value parser-compatible", (_, format, value) => {
      const result = new LuxonDateInputAutocomplete(format, "de-DE").process(
        value,
        { commit: true, locale: "de-DE", now },
      );

      expect(result.valid).toBe(true);
      expect(result.complete).toBe(true);
      expect(
        DateTime.fromFormat(result.value, format, {
          locale: "de-DE",
          setZone: true,
        }).isValid,
      ).toBe(true);
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

function isUsDateFormat(format: string): boolean {
  return /^(?:M{1,4}|c{3,4}, M{3,4})/u.test(format);
}
