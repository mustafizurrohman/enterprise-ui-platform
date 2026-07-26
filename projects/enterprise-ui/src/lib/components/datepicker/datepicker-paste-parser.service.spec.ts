import { TestBed } from "@angular/core/testing";
import { DateTime } from "luxon";
import { beforeEach, describe, expect, it } from "vitest";
import { DatepickerPasteParserService } from "./datepicker-paste-parser.service";
import { LuxonDateInputAutocomplete } from "./luxon-date-input-autocomplete";

const DEFAULT_DATETIME_FORMAT = "dd.MM.yyyy HH:mm 'Uhr'";

type FormatCase = Readonly<{
  format: string;
  locale: string;
}>;

const SUPPORTED_PASTE_FORMATS: readonly FormatCase[] = [
  { format: "dd.MM.yyyy", locale: "de-DE" },
  { format: "dd.MM.yyyy HH:mm", locale: "de-DE" },
  { format: DEFAULT_DATETIME_FORMAT, locale: "de-DE" },
  { format: "dd.MM.yyyy HH:mm:ss", locale: "de-DE" },
  { format: "dd.MM.yyyy HH:mm:ss 'Uhr'", locale: "de-DE" },
  { format: "d.M.yyyy", locale: "de-DE" },
  { format: "d.M.yyyy H:mm", locale: "de-DE" },
  { format: "d.M.yyyy H:mm 'Uhr'", locale: "de-DE" },
  { format: "d.M.yyyy H:mm:ss", locale: "de-DE" },
  { format: "d.M.yyyy H:mm:ss 'Uhr'", locale: "de-DE" },
  { format: "yyyy-MM-dd", locale: "de-DE" },
  { format: "yyyy-MM-dd HH:mm", locale: "de-DE" },
  { format: "yyyy-MM-dd HH:mm:ss", locale: "de-DE" },
  { format: "yyyy-MM-dd'T'HH:mm", locale: "de-DE" },
  { format: "yyyy-MM-dd'T'HH:mm:ss", locale: "de-DE" },
  { format: "yyyy/MM/dd", locale: "de-DE" },
  { format: "yyyy/MM/dd HH:mm", locale: "de-DE" },
  { format: "yyyy/MM/dd HH:mm:ss", locale: "de-DE" },
  { format: "dd/MM/yyyy", locale: "de-DE" },
  { format: "dd/MM/yyyy HH:mm", locale: "de-DE" },
  { format: "dd/MM/yyyy HH:mm:ss", locale: "de-DE" },
  { format: "d/M/yyyy", locale: "de-DE" },
  { format: "d/M/yyyy H:mm", locale: "de-DE" },
  { format: "d/M/yyyy H:mm:ss", locale: "de-DE" },
  { format: "dd-MM-yyyy", locale: "de-DE" },
  { format: "dd-MM-yyyy HH:mm", locale: "de-DE" },
  { format: "dd-MM-yyyy HH:mm:ss", locale: "de-DE" },
  { format: "d-M-yyyy", locale: "de-DE" },
  { format: "d-M-yyyy H:mm", locale: "de-DE" },
  { format: "d-M-yyyy H:mm:ss", locale: "de-DE" },
  { format: "MM/dd/yyyy", locale: "en-US" },
  { format: "MM/dd/yyyy hh:mm a", locale: "en-US" },
  { format: "MM/dd/yyyy hh:mm:ss a", locale: "en-US" },
  { format: "M/d/yyyy", locale: "en-US" },
  { format: "M/d/yyyy h:mm a", locale: "en-US" },
  { format: "M/d/yyyy h:mm:ss a", locale: "en-US" },
  { format: "MM-dd-yyyy", locale: "en-US" },
  { format: "MM-dd-yyyy hh:mm a", locale: "en-US" },
  { format: "MM-dd-yyyy hh:mm:ss a", locale: "en-US" },
  { format: "M-d-yyyy", locale: "en-US" },
  { format: "M-d-yyyy h:mm a", locale: "en-US" },
  { format: "M-d-yyyy h:mm:ss a", locale: "en-US" },
  { format: "dd.MM.yy", locale: "de-DE" },
  { format: "dd.MM.yy HH:mm", locale: "de-DE" },
  { format: "dd.MM.yy HH:mm:ss", locale: "de-DE" },
  { format: "dd/MM/yy", locale: "de-DE" },
  { format: "dd/MM/yy HH:mm", locale: "de-DE" },
  { format: "dd/MM/yy HH:mm:ss", locale: "de-DE" },
  { format: "dd-MM-yy", locale: "de-DE" },
  { format: "dd-MM-yy HH:mm", locale: "de-DE" },
  { format: "dd-MM-yy HH:mm:ss", locale: "de-DE" },
  { format: "MM/dd/yy", locale: "en-US" },
  { format: "MM/dd/yy hh:mm a", locale: "en-US" },
  { format: "MM/dd/yy hh:mm:ss a", locale: "en-US" },
  { format: "MM-dd-yy", locale: "en-US" },
  { format: "MM-dd-yy hh:mm a", locale: "en-US" },
  { format: "MM-dd-yy hh:mm:ss a", locale: "en-US" },
  { format: "dd MMM yyyy", locale: "de-DE" },
  { format: "dd MMM yyyy HH:mm", locale: "de-DE" },
  { format: "dd MMM yyyy HH:mm:ss", locale: "de-DE" },
  { format: "d MMM yyyy", locale: "de-DE" },
  { format: "d MMM yyyy H:mm", locale: "de-DE" },
  { format: "d MMM yyyy H:mm:ss", locale: "de-DE" },
  { format: "dd MMMM yyyy", locale: "de-DE" },
  { format: "dd MMMM yyyy HH:mm", locale: "de-DE" },
  { format: "dd MMMM yyyy HH:mm:ss", locale: "de-DE" },
  { format: "d MMMM yyyy", locale: "de-DE" },
  { format: "d MMMM yyyy H:mm", locale: "de-DE" },
  { format: "d MMMM yyyy H:mm:ss", locale: "de-DE" },
  { format: "MMM dd, yyyy", locale: "en-US" },
  { format: "MMM dd, yyyy hh:mm a", locale: "en-US" },
  { format: "MMM dd, yyyy hh:mm:ss a", locale: "en-US" },
  { format: "MMM d, yyyy", locale: "en-US" },
  { format: "MMM d, yyyy h:mm a", locale: "en-US" },
  { format: "MMM d, yyyy h:mm:ss a", locale: "en-US" },
  { format: "MMMM dd, yyyy", locale: "en-US" },
  { format: "MMMM dd, yyyy hh:mm a", locale: "en-US" },
  { format: "MMMM dd, yyyy hh:mm:ss a", locale: "en-US" },
  { format: "MMMM d, yyyy", locale: "en-US" },
  { format: "MMMM d, yyyy h:mm a", locale: "en-US" },
  { format: "MMMM d, yyyy h:mm:ss a", locale: "en-US" },
] as const;

const GENERIC_PASTE_FORMATS = [
  { format: "kkkk-'W'WW-E", value: "2026-W29-3", locale: "de-DE" },
  { format: "yyyy-ooo", value: "2026-196", locale: "de-DE" },
  { format: "D", value: "15.7.2026", locale: "de-DE" },
  {
    format: "yyyy-MM-dd HH:mm z",
    value: "2026-07-15 16:59 Europe/Berlin",
    locale: "de-DE",
  },
  { format: "G y-MM-dd", value: "AD 2026-07-15", locale: "en-US" },
  {
    format: "GG y-MM-dd",
    value: "Anno Domini 2026-07-15",
    locale: "en-US",
  },
  { format: "yyyyy-MM-dd", value: "02026-07-15", locale: "en-US" },
  { format: "yyyyyy-MM-dd", value: "002026-07-15", locale: "en-US" },
  {
    format: "yyyy-MM-dd EEE",
    value: "2026-07-15 Mi",
    locale: "de-DE",
  },
  {
    format: "yyyy-MM-dd EEEE",
    value: "2026-07-15 Mittwoch",
    locale: "de-DE",
  },
  { format: "yyyy-'Q'q", value: "2026-Q3", locale: "en-US" },
  { format: "yyyy-'Q'qq", value: "2026-Q03", locale: "en-US" },
  {
    format: "yyyy-MM-dd HH:mm:ss.SSS",
    value: "2026-07-15 16:59:12.125",
    locale: "en-US",
  },
  {
    format: "yyyy-MM-dd HH:mm:ss.u",
    value: "2026-07-15 16:59:12.125",
    locale: "en-US",
  },
  {
    format: "yyyy-MM-dd HH:mm:ss.uu",
    value: "2026-07-15 16:59:12.12",
    locale: "en-US",
  },
  {
    format: "yyyy-MM-dd HH:mm:ss.uuu",
    value: "2026-07-15 16:59:12.1",
    locale: "en-US",
  },
  { format: "ttt", value: "16:59:12 +0200", locale: "de-DE" },
  {
    format: "fff",
    value: "15. Juli 2026 um 16:59 +0200",
    locale: "de-DE",
  },
  {
    format: "cccc, dd.MM.yyyy",
    value: "Mittwoch, 15.07.2026",
    locale: "de-DE",
  },
  {
    format: "MMMM dd, yyyy",
    value: "July 15, 2026",
    locale: "en-US",
  },
  {
    format: "'Date:' EEEE, dd.MM.yyyy",
    value: "Date: Wednesday, 15.07.2026",
    locale: "en-US",
  },
] as const;

const now = DateTime.fromISO("2026-07-14T18:30:45", {
  zone: "Europe/Berlin",
});
const sampleDate = DateTime.fromISO("2026-07-15T16:59:12", {
  zone: "Europe/Berlin",
});

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

    const result = service.parse(
      pastedValue,
      inputState,
      autocomplete,
      options,
    );

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

    const result = service.parse(
      pastedValue,
      inputState,
      autocomplete,
      options,
    );

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

    const result = service.parse(
      pastedValue,
      inputState,
      autocomplete,
      options,
    );

    expect(result.date).not.toBeNull();
  });

  describe("all autocomplete-supported paste formats", () => {
    it.each(SUPPORTED_PASTE_FORMATS)(
      "parses a complete $format value pasted into an existing input",
      ({ format, locale }) => {
        const pastedValue = sampleDate.setLocale(locale).toFormat(format);
        const autocomplete = new LuxonDateInputAutocomplete(format, locale);

        const result = service.parse(
          pastedValue,
          {
            value: "existing value",
            selectionStart: 4,
            selectionEnd: 4,
          },
          autocomplete,
          { now, locale },
        );

        expect(result.valid).toBe(true);
        expect(result.complete).toBe(true);
        expect(result.date?.isValid).toBe(true);
        expect(result.value).toBe(pastedValue);
      },
    );

    it.each(GENERIC_PASTE_FORMATS)(
      "parses a complete generic Luxon value for $format",
      ({ format, value, locale }) => {
        const autocomplete = new LuxonDateInputAutocomplete(format, locale);

        const result = service.parse(
          value,
          {
            value: "existing value",
            selectionStart: 3,
            selectionEnd: 3,
          },
          autocomplete,
          { now, locale },
        );

        expect(result.valid).toBe(true);
        expect(result.complete).toBe(true);
        expect(result.date?.isValid).toBe(true);
        expect(
          DateTime.fromFormat(result.value, format, {
            locale,
            setZone: true,
          }).isValid,
        ).toBe(true);
      },
    );
  });

  describe("standalone versus combined paste handling", () => {
    it("replaces an existing value with a complete textual date", () => {
      const autocomplete = new LuxonDateInputAutocomplete(
        "dd MMMM yyyy",
        "de-DE",
      );

      const result = service.parse(
        "15 Juli 2026",
        {
          value: "01 Januar 2026",
          selectionStart: 3,
          selectionEnd: 3,
        },
        autocomplete,
        { now, locale: "de-DE" },
      );

      expect(result.value).toBe("15 Juli 2026");
      expect(result.date?.toISODate()).toBe("2026-07-15");
    });

    it("combines a partial textual date paste with the current value", () => {
      const autocomplete = new LuxonDateInputAutocomplete(
        "dd MMMM yyyy",
        "de-DE",
      );

      const result = service.parse(
        "15",
        {
          value: " Juli 2026",
          selectionStart: 0,
          selectionEnd: 0,
        },
        autocomplete,
        { now, locale: "de-DE" },
      );

      expect(result.value).toBe("15 Juli 2026");
      expect(result.date?.toISODate()).toBe("2026-07-15");
    });

    it("keeps the combined invalid value when neither candidate is complete", () => {
      const autocomplete = new LuxonDateInputAutocomplete(
        "dd.MM.yyyy",
        "de-DE",
      );

      const result = service.parse(
        "x",
        {
          value: "15.07.2026",
          selectionStart: 0,
          selectionEnd: 0,
        },
        autocomplete,
        { now, locale: "de-DE" },
      );

      expect(result.value).toBe("x15.07.2026");
      expect(result.valid).toBe(false);
      expect(result.date).toBeNull();
      expect(result.error?.code).toBe("INVALID_CHARACTER");
    });

    it("normalizes non-breaking spaces and a case-insensitive Uhr literal", () => {
      const autocomplete = new LuxonDateInputAutocomplete(
        "dd.MM.yyyy HH:mm 'Uhr'",
        "de-DE",
      );

      const result = service.parse(
        "\u00a015.07.2026 16:59 uHr\u00a0",
        {
          value: "existing",
          selectionStart: 2,
          selectionEnd: 2,
        },
        autocomplete,
        { now, locale: "de-DE" },
      );

      expect(result.value).toBe("15.07.2026 16:59 Uhr");
      expect(result.date?.toISO()).toContain("2026-07-15T16:59:00");
    });

    it("uses a complete compact date instead of treating it as inserted text", () => {
      const autocomplete = new LuxonDateInputAutocomplete("ddMMyyyy", "de-DE");

      const result = service.parse(
        "15072026",
        {
          value: "01012026",
          selectionStart: 4,
          selectionEnd: 4,
        },
        autocomplete,
        { now, locale: "de-DE" },
      );

      expect(result.value).toBe("15072026");
      expect(result.date?.toISODate()).toBe("2026-07-15");
    });
  });

  describe("separator normalization", () => {
    it.each([
      ["hyphen", "20-07-2024"],
      ["slash", "20/07/2024"],
      ["space", "20 07 2024"],
      ["comma", "20,07,2024"],
      ["mixed separators", "20-07/2024"],
      ["Unicode and symbol separators", "20—07_2024"],
    ])(
      "parses a German date using %s",
      (_, pastedValue) => {
        const autocomplete = new LuxonDateInputAutocomplete(
          "dd.MM.yyyy",
          "de-DE",
        );

        const result = service.parse(
          pastedValue,
          { value: "", selectionStart: 0, selectionEnd: 0 },
          autocomplete,
          { now, locale: "de-DE" },
        );

        expect(result.valid).toBe(true);
        expect(result.complete).toBe(true);
        expect(result.value).toBe("20.07.2024");
        expect(result.date?.toISODate()).toBe("2024-07-20");
      },
    );

    it("normalizes mixed date and time separators including the Uhr literal", () => {
      const autocomplete = new LuxonDateInputAutocomplete(
        "dd.MM.yyyy HH:mm:ss 'Uhr'",
        "de-DE",
      );

      const result = service.parse(
        "20/07-2024,20.45-52 uHr",
        { value: "", selectionStart: 0, selectionEnd: 0 },
        autocomplete,
        { now, locale: "de-DE" },
      );

      expect(result.valid).toBe(true);
      expect(result.value).toBe("20.07.2024 20:45:52 Uhr");
      expect(result.date?.toISO()).toContain("2024-07-20T20:45:52");
    });

    it("inserts a required ISO T literal when a different separator is pasted", () => {
      const autocomplete = new LuxonDateInputAutocomplete(
        "yyyy-MM-dd'T'HH:mm:ss",
        "de-DE",
      );

      const result = service.parse(
        "2024/07.20 20-45,52",
        { value: "", selectionStart: 0, selectionEnd: 0 },
        autocomplete,
        { now, locale: "de-DE" },
      );

      expect(result.valid).toBe(true);
      expect(result.value).toBe("2024-07-20T20:45:52");
      expect(result.date?.toISO()).toContain("2024-07-20T20:45:52");
    });

    it.each([
      {
        name: "US month-first",
        format: "MM/dd/yyyy",
        locale: "en-US",
        pastedValue: "07-20.2024",
        expectedValue: "07/20/2024",
        expectedIsoDate: "2024-07-20",
      },
      {
        name: "British day-first",
        format: "dd/MM/yyyy",
        locale: "en-GB",
        pastedValue: "20.07-2024",
        expectedValue: "20/07/2024",
        expectedIsoDate: "2024-07-20",
      },
      {
        name: "French textual month",
        format: "dd MMMM yyyy",
        locale: "fr-FR",
        pastedValue: "20-juillet/2024",
        expectedValue: "20 juillet 2024",
        expectedIsoDate: "2024-07-20",
      },
      {
        name: "Japanese year-first",
        format: "yyyy/MM/dd",
        locale: "ja-JP",
        pastedValue: "2024-07.20",
        expectedValue: "2024/07/20",
        expectedIsoDate: "2024-07-20",
      },
    ])(
      "normalizes separators for $name format",
      ({ format, locale, pastedValue, expectedValue, expectedIsoDate }) => {
        const autocomplete = new LuxonDateInputAutocomplete(format, locale);

        const result = service.parse(
          pastedValue,
          { value: "", selectionStart: 0, selectionEnd: 0 },
          autocomplete,
          { now, locale },
        );

        expect(result.valid).toBe(true);
        expect(result.complete).toBe(true);
        expect(result.value).toBe(expectedValue);
        expect(result.date?.toISODate()).toBe(expectedIsoDate);
      },
    );

    it("uses the configured token order for an otherwise ambiguous value", () => {
      const pastedValue = "07-08-2024";
      const usResult = service.parse(
        pastedValue,
        { value: "", selectionStart: 0, selectionEnd: 0 },
        new LuxonDateInputAutocomplete("MM/dd/yyyy", "en-US"),
        { now, locale: "en-US" },
      );
      const britishResult = service.parse(
        pastedValue,
        { value: "", selectionStart: 0, selectionEnd: 0 },
        new LuxonDateInputAutocomplete("dd/MM/yyyy", "en-GB"),
        { now, locale: "en-GB" },
      );

      expect(usResult.date?.toISODate()).toBe("2024-07-08");
      expect(britishResult.date?.toISODate()).toBe("2024-08-07");
    });

    it.each([
      ["20.07.2024 20:45:52", "20.07.2024"],
      ["20-07/2024 20:45:52", "20.07.2024"],
    ])(
      "ignores trailing time fields when the configured format is date-only",
      (pastedValue, expectedValue) => {
        const autocomplete = new LuxonDateInputAutocomplete(
          "dd.MM.yyyy",
          "de-DE",
        );

        const result = service.parse(
          pastedValue,
          { value: "", selectionStart: 0, selectionEnd: 0 },
          autocomplete,
          { now, locale: "de-DE" },
        );

        expect(result.valid).toBe(true);
        expect(result.value).toBe(expectedValue);
      },
    );

    it("does not make an invalid calendar date valid", () => {
      const autocomplete = new LuxonDateInputAutocomplete(
        "dd.MM.yyyy",
        "de-DE",
      );

      const result = service.parse(
        "31-02/2024",
        { value: "", selectionStart: 0, selectionEnd: 0 },
        autocomplete,
        { now, locale: "de-DE" },
      );

      expect(result.valid).toBe(false);
      expect(result.date).toBeNull();
      expect(result.error?.code).toBe("INVALID_DAY_FOR_MONTH");
    });

    it("does not treat letters between numeric fields as separators", () => {
      const autocomplete = new LuxonDateInputAutocomplete(
        "dd.MM.yyyy",
        "de-DE",
      );

      const result = service.parse(
        "20x07x2024",
        { value: "", selectionStart: 0, selectionEnd: 0 },
        autocomplete,
        { now, locale: "de-DE" },
      );

      expect(result.valid).toBe(false);
      expect(result.date).toBeNull();
    });
  });

  describe("selection edge cases", () => {
    it("treats null selection bounds as replacing the complete value", () => {
      const autocomplete = new LuxonDateInputAutocomplete(
        "dd.MM.yyyy",
        "de-DE",
      );

      const result = service.parse(
        "15.07.2026",
        {
          value: "01.01.2026",
          selectionStart: null,
          selectionEnd: null,
        },
        autocomplete,
        { now, locale: "de-DE" },
      );

      expect(result.value).toBe("15.07.2026");
    });

    it("normalizes reversed selection bounds for partial paste insertion", () => {
      const autocomplete = new LuxonDateInputAutocomplete(
        "dd.MM.yyyy",
        "de-DE",
      );

      const result = service.parse(
        "15",
        {
          value: "xx.07.2026",
          selectionStart: 2,
          selectionEnd: 0,
        },
        autocomplete,
        { now, locale: "de-DE" },
      );

      expect(result.value).toBe("15.07.2026");
      expect(result.date?.toISODate()).toBe("2026-07-15");
    });

    it("clamps out-of-range selection bounds", () => {
      const autocomplete = new LuxonDateInputAutocomplete(
        "dd.MM.yyyy",
        "de-DE",
      );

      const result = service.parse(
        "15",
        {
          value: ".07.2026",
          selectionStart: -100,
          selectionEnd: -1,
        },
        autocomplete,
        { now, locale: "de-DE" },
      );

      expect(result.value).toBe("15.07.2026");
      expect(result.date?.toISODate()).toBe("2026-07-15");
    });
  });
});
