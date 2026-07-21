import { TestBed } from "@angular/core/testing";
import { DateTime } from "luxon";
import { beforeEach, describe, expect, it } from "vitest";
import { DatepickerPasteParserService } from "./datepicker-paste-parser.service";
import { LuxonDateInputAutocomplete } from "./luxon-date-input-autocomplete";

const DEFAULT_DATETIME_FORMAT = "dd.MM.yyyy HH:mm 'Uhr'";

type FormatCase = Readonly<{
  format: string;
  locale: "de-DE" | "en-US";
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
