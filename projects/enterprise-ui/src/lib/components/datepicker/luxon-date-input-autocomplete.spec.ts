import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";
import { LuxonDateInputAutocomplete } from "./luxon-date-input-autocomplete";

const DEFAULT_DATETIME_FORMAT = "dd.MM.yyyy HH:mm 'Uhr'";

type FormatCase = Readonly<{
  format: string;
  locale: "de-DE" | "en-US";
  smart: boolean;
}>;

const SUPPORTED_FORMATS: readonly FormatCase[] = [
  // German — dots, padded
  { format: "dd.MM.yyyy", locale: "de-DE", smart: true },
  { format: "dd.MM.yyyy HH:mm", locale: "de-DE", smart: true },
  { format: DEFAULT_DATETIME_FORMAT, locale: "de-DE", smart: true },
  { format: "dd.MM.yyyy HH:mm:ss", locale: "de-DE", smart: true },
  { format: "dd.MM.yyyy HH:mm:ss 'Uhr'", locale: "de-DE", smart: true },

  // German — dots, unpadded
  { format: "d.M.yyyy", locale: "de-DE", smart: true },
  { format: "d.M.yyyy H:mm", locale: "de-DE", smart: true },
  { format: "d.M.yyyy H:mm 'Uhr'", locale: "de-DE", smart: true },
  { format: "d.M.yyyy H:mm:ss", locale: "de-DE", smart: true },
  { format: "d.M.yyyy H:mm:ss 'Uhr'", locale: "de-DE", smart: true },

  // ISO 8601-style — hyphen and space
  { format: "yyyy-MM-dd", locale: "de-DE", smart: true },
  { format: "yyyy-MM-dd HH:mm", locale: "de-DE", smart: true },
  { format: "yyyy-MM-dd HH:mm:ss", locale: "de-DE", smart: true },

  // ISO 8601-style — T separator
  { format: "yyyy-MM-dd'T'HH:mm", locale: "de-DE", smart: true },
  { format: "yyyy-MM-dd'T'HH:mm:ss", locale: "de-DE", smart: true },

  // Year first — slash
  { format: "yyyy/MM/dd", locale: "de-DE", smart: true },
  { format: "yyyy/MM/dd HH:mm", locale: "de-DE", smart: true },
  { format: "yyyy/MM/dd HH:mm:ss", locale: "de-DE", smart: true },

  // European — slash, padded
  { format: "dd/MM/yyyy", locale: "de-DE", smart: true },
  { format: "dd/MM/yyyy HH:mm", locale: "de-DE", smart: true },
  { format: "dd/MM/yyyy HH:mm:ss", locale: "de-DE", smart: true },

  // European — slash, unpadded
  { format: "d/M/yyyy", locale: "de-DE", smart: true },
  { format: "d/M/yyyy H:mm", locale: "de-DE", smart: true },
  { format: "d/M/yyyy H:mm:ss", locale: "de-DE", smart: true },

  // European — hyphen, padded
  { format: "dd-MM-yyyy", locale: "de-DE", smart: true },
  { format: "dd-MM-yyyy HH:mm", locale: "de-DE", smart: true },
  { format: "dd-MM-yyyy HH:mm:ss", locale: "de-DE", smart: true },

  // European — hyphen, unpadded
  { format: "d-M-yyyy", locale: "de-DE", smart: true },
  { format: "d-M-yyyy H:mm", locale: "de-DE", smart: true },
  { format: "d-M-yyyy H:mm:ss", locale: "de-DE", smart: true },

  // US — slash, padded, 12-hour
  { format: "MM/dd/yyyy", locale: "en-US", smart: true },
  { format: "MM/dd/yyyy hh:mm a", locale: "en-US", smart: true },
  { format: "MM/dd/yyyy hh:mm:ss a", locale: "en-US", smart: true },

  // US — slash, unpadded, 12-hour
  { format: "M/d/yyyy", locale: "en-US", smart: true },
  { format: "M/d/yyyy h:mm a", locale: "en-US", smart: true },
  { format: "M/d/yyyy h:mm:ss a", locale: "en-US", smart: true },

  // US — hyphen, padded, 12-hour
  { format: "MM-dd-yyyy", locale: "en-US", smart: true },
  { format: "MM-dd-yyyy hh:mm a", locale: "en-US", smart: true },
  { format: "MM-dd-yyyy hh:mm:ss a", locale: "en-US", smart: true },

  // US — hyphen, unpadded, 12-hour
  { format: "M-d-yyyy", locale: "en-US", smart: true },
  { format: "M-d-yyyy h:mm a", locale: "en-US", smart: true },
  { format: "M-d-yyyy h:mm:ss a", locale: "en-US", smart: true },

  // Short year — German
  { format: "dd.MM.yy", locale: "de-DE", smart: true },
  { format: "dd.MM.yy HH:mm", locale: "de-DE", smart: true },
  { format: "dd.MM.yy HH:mm:ss", locale: "de-DE", smart: true },

  // Short year — European slash
  { format: "dd/MM/yy", locale: "de-DE", smart: true },
  { format: "dd/MM/yy HH:mm", locale: "de-DE", smart: true },
  { format: "dd/MM/yy HH:mm:ss", locale: "de-DE", smart: true },

  // Short year — European hyphen
  { format: "dd-MM-yy", locale: "de-DE", smart: true },
  { format: "dd-MM-yy HH:mm", locale: "de-DE", smart: true },
  { format: "dd-MM-yy HH:mm:ss", locale: "de-DE", smart: true },

  // Short year — US slash
  { format: "MM/dd/yy", locale: "en-US", smart: true },
  { format: "MM/dd/yy hh:mm a", locale: "en-US", smart: true },
  { format: "MM/dd/yy hh:mm:ss a", locale: "en-US", smart: true },

  // Short year — US hyphen
  { format: "MM-dd-yy", locale: "en-US", smart: true },
  { format: "MM-dd-yy hh:mm a", locale: "en-US", smart: true },
  { format: "MM-dd-yy hh:mm:ss a", locale: "en-US", smart: true },

  // European — abbreviated month name
  { format: "dd MMM yyyy", locale: "de-DE", smart: false },
  { format: "dd MMM yyyy HH:mm", locale: "de-DE", smart: false },
  { format: "dd MMM yyyy HH:mm:ss", locale: "de-DE", smart: false },

  // European — abbreviated month name, unpadded
  { format: "d MMM yyyy", locale: "de-DE", smart: false },
  { format: "d MMM yyyy H:mm", locale: "de-DE", smart: false },
  { format: "d MMM yyyy H:mm:ss", locale: "de-DE", smart: false },

  // European — full month name
  { format: "dd MMMM yyyy", locale: "de-DE", smart: false },
  { format: "dd MMMM yyyy HH:mm", locale: "de-DE", smart: false },
  { format: "dd MMMM yyyy HH:mm:ss", locale: "de-DE", smart: false },

  // European — full month name, unpadded
  { format: "d MMMM yyyy", locale: "de-DE", smart: false },
  { format: "d MMMM yyyy H:mm", locale: "de-DE", smart: false },
  { format: "d MMMM yyyy H:mm:ss", locale: "de-DE", smart: false },

  // US — abbreviated month name
  { format: "MMM dd, yyyy", locale: "en-US", smart: false },
  { format: "MMM dd, yyyy hh:mm a", locale: "en-US", smart: false },
  { format: "MMM dd, yyyy hh:mm:ss a", locale: "en-US", smart: false },

  // US — abbreviated month name, unpadded
  { format: "MMM d, yyyy", locale: "en-US", smart: false },
  { format: "MMM d, yyyy h:mm a", locale: "en-US", smart: false },
  { format: "MMM d, yyyy h:mm:ss a", locale: "en-US", smart: false },

  // US — full month name
  { format: "MMMM dd, yyyy", locale: "en-US", smart: false },
  { format: "MMMM dd, yyyy hh:mm a", locale: "en-US", smart: false },
  { format: "MMMM dd, yyyy hh:mm:ss a", locale: "en-US", smart: false },

  // US — full month name, unpadded
  { format: "MMMM d, yyyy", locale: "en-US", smart: false },
  { format: "MMMM d, yyyy h:mm a", locale: "en-US", smart: false },
  { format: "MMMM d, yyyy h:mm:ss a", locale: "en-US", smart: false },
] as const;

const now = DateTime.fromISO("2026-07-14T18:30:45");
const sampleDate = DateTime.fromISO("2026-07-15T16:59:12");

describe("LuxonDateInputAutocomplete", () => {
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

  it("keeps unpadded tokens unpadded", () => {
    const result = new LuxonDateInputAutocomplete("M/d/yyyy H:mm").process(
      "7/5/2026 4:09",
      { now, commit: true },
    );

    expect(result.value).toBe("7/5/2026 4:09");
    expect(result.date?.toISO()).toBe(
      DateTime.fromISO("2026-07-05T04:09:00").toISO(),
    );
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

  it("validates 12-hour values independently from 24-hour values", () => {
    const invalid = new LuxonDateInputAutocomplete(
      "MM/dd/yyyy hh:mm a",
      "en-US",
    ).process("07/15/2026 13:59 PM", { commit: true, now });
    const valid = new LuxonDateInputAutocomplete(
      "MM/dd/yyyy hh:mm a",
      "en-US",
    ).process("07/15/2026 04:59 PM", { commit: true, now });

    expect(invalid.valid).toBe(false);
    expect(invalid.error?.field).toBe("hour");
    expect(valid.date?.hour).toBe(16);
  });

  it("normalizes one-letter meridiem values on commit", () => {
    const result = new LuxonDateInputAutocomplete(
      "M/d/yyyy h:mm a",
      "en-US",
    ).process("7/15/2026 4:59 p", { commit: true, now });

    expect(result.value).toBe("7/15/2026 4:59 PM");
    expect(result.date?.hour).toBe(16);
  });

  it("builds a completion suggestion from the current date and time", () => {
    const result = new LuxonDateInputAutocomplete(
      "yyyy-MM-dd HH:mm:ss",
    ).process("2026-07-", { now });

    expect(result.suggestedValue).toBe("2026-07-14 18:30:45");
  });

  describe("all requested formats", () => {
    it.each(SUPPORTED_FORMATS)(
      "parses and round-trips $format",
      ({ format, locale }) => {
        const input = sampleDate.setLocale(locale).toFormat(format);
        const result = new LuxonDateInputAutocomplete(format, locale).process(
          input,
          { commit: true, locale, now },
        );

        expect(result.valid).toBe(true);
        expect(result.complete).toBe(true);
        expect(result.error).toBeNull();
        expect(result.date?.year).toBe(2026);
        expect(result.date?.month).toBe(7);
        expect(result.date?.day).toBe(15);
        expect(result.value).toBe(input);
        expect(
          DateTime.fromFormat(result.value, format, { locale, setZone: true })
            .isValid,
        ).toBe(true);
      },
    );

    it.each(SUPPORTED_FORMATS.filter(({ smart }) => smart))(
      "autocompletes the first numeric field for $format",
      ({ format, locale }) => {
        const fullValue = sampleDate.setLocale(locale).toFormat(format);
        const firstLiteralIndex = fullValue.search(/[^0-9]/u);
        const firstField =
          firstLiteralIndex === -1
            ? fullValue
            : fullValue.slice(0, firstLiteralIndex);
        const firstLiteral =
          firstLiteralIndex === -1 ? "" : fullValue[firstLiteralIndex];
        const result = new LuxonDateInputAutocomplete(format, locale).process(
          firstField,
          { locale, now },
        );

        expect(result.valid).toBe(true);
        expect(result.value).toBe(`${firstField}${firstLiteral}`);
      },
    );
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
        expect(result.date?.isValid).toBe(true);
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
      expect(result.date?.isValid).toBe(true);
    });

    it("does not accept a duplicated Uhr suffix", () => {
      const result = new LuxonDateInputAutocomplete(
        "dd.MM.yyyy HH:mm 'Uhr'",
      ).processPastedValue("15.07.2026 16:59 Uhr Uhr", { now });

      expect(result.valid).toBe(false);
      expect(result.date).toBeNull();
      expect(result.error?.code).toBe("INVALID_CHARACTER");
    });

    it("does not silently ignore trailing pasted input", () => {
      const result = new LuxonDateInputAutocomplete(
        "dd.MM.yyyy",
      ).processPastedValue("15.07.2026 extra", { now });

      expect(result.valid).toBe(false);
      expect(result.date).toBeNull();
      expect(result.error?.code).toBe("INVALID_CHARACTER");
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
  });

  describe("generic Luxon format support", () => {
    it("keeps an incomplete textual-month value editable until commit", () => {
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
      ["textual month", "dd MMMM yyyy", "15 Juli 2026", "de-DE"],
      ["ISO week date", "kkkk-'W'WW-E", "2026-W29-3", "de-DE"],
      ["ordinal date", "yyyy-ooo", "2026-196", "de-DE"],
      ["localized macro", "D", "15.7.2026", "de-DE"],
      [
        "IANA zone",
        "yyyy-MM-dd HH:mm z",
        "2026-07-15 16:59 Europe/Berlin",
        "de-DE",
      ],
    ])("parses a %s format", (_, format, value, locale) => {
      const result = new LuxonDateInputAutocomplete(format, locale).process(
        value,
        { commit: true, locale, now },
      );

      expect(result.valid).toBe(true);
      expect(result.complete).toBe(true);
      expect(result.date?.isValid).toBe(true);
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

  describe("additional regression coverage", () => {
    it("normalizes configured literals case-insensitively", () => {
      const result = new LuxonDateInputAutocomplete(
        "dd.MM.yyyy 'um' HH:mm 'Uhr'",
      ).processPastedValue("15.07.2026 UM 16:59 UHR", { now });

      expect(result.value).toBe("15.07.2026 um 16:59 Uhr");
      expect(result.date?.isValid).toBe(true);
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

    it.each([
      ["abbreviated era", "G y-MM-dd", "AD 2026-07-15", "en-US"],
      ["full era", "GG y-MM-dd", "Anno Domini 2026-07-15", "en-US"],
      ["five-digit year", "yyyyy-MM-dd", "02026-07-15", "en-US"],
      ["six-digit year", "yyyyyy-MM-dd", "002026-07-15", "en-US"],
      ["localized short weekday", "yyyy-MM-dd EEE", "2026-07-15 Mi", "de-DE"],
      [
        "localized long weekday",
        "yyyy-MM-dd EEEE",
        "2026-07-15 Mittwoch",
        "de-DE",
      ],
      ["quarter", "yyyy-'Q'q", "2026-Q3", "en-US"],
      ["padded quarter", "yyyy-'Q'qq", "2026-Q03", "en-US"],
      [
        "milliseconds",
        "yyyy-MM-dd HH:mm:ss.SSS",
        "2026-07-15 16:59:12.125",
        "en-US",
      ],
      [
        "fractional seconds",
        "yyyy-MM-dd HH:mm:ss.u",
        "2026-07-15 16:59:12.125",
        "en-US",
      ],
      [
        "two-digit fractional seconds",
        "yyyy-MM-dd HH:mm:ss.uu",
        "2026-07-15 16:59:12.12",
        "en-US",
      ],
      [
        "one-digit fractional seconds",
        "yyyy-MM-dd HH:mm:ss.uuu",
        "2026-07-15 16:59:12.1",
        "en-US",
      ],
    ])("parses a %s parser-compatible format", (_, format, value, locale) => {
      const result = new LuxonDateInputAutocomplete(format, locale).process(
        value,
        { commit: true, locale, now },
      );

      expect(result.valid).toBe(true);
      expect(result.complete).toBe(true);
      expect(result.date?.isValid).toBe(true);
      expect(
        DateTime.fromFormat(result.value, format, { locale, setZone: true })
          .isValid,
      ).toBe(true);
    });

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
