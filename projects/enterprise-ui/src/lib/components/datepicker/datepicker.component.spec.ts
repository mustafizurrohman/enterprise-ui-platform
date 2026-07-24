import { describe, it, expect, vi, beforeEach } from "vitest";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DatepickerComponent } from "./datepicker.component";
import { DateTime, Info } from "luxon";
import { Component, signal } from "@angular/core";
import { FormControl, FormsModule, ReactiveFormsModule } from "@angular/forms";

describe("DatepickerComponent", () => {
  let component: DatepickerComponent;
  let fixture: ComponentFixture<DatepickerComponent>;

  const dispatchPaste = (input: HTMLInputElement, value: string): void => {
    const event = new Event("paste", {
      bubbles: true,
      cancelable: true,
    }) as ClipboardEvent;

    Object.defineProperty(event, "clipboardData", {
      value: {
        getData: (type: string) =>
          type === "text/plain" || type === "text" ? value : "",
      },
    });

    input.dispatchEvent(event);
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatepickerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DatepickerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("testId", "datepicker");
    fixture.componentRef.setInput("locale", "de-DE");
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should have calendar closed by default", () => {
    expect((component as any).isOpen()).toBeFalsy();
    const calendar = document.querySelector(".datepicker-calendar");
    expect(calendar).toBeNull();
  });

  describe("testability", () => {
    it("should expose stable configurable test ids", async () => {
      expect(
        fixture.nativeElement.querySelector('[data-testid="datepicker"]'),
      ).toBeTruthy();
      expect(
        fixture.nativeElement.querySelector('[data-testid="datepicker-label"]'),
      ).toBeTruthy();
      expect(
        fixture.nativeElement.querySelector('[data-testid="datepicker-input"]'),
      ).toBeTruthy();
      expect(
        fixture.nativeElement.querySelector(
          '[data-testid="datepicker-toggle"]',
        ),
      ).toBeTruthy();
      expect(
        fixture.nativeElement.querySelector('[data-testid="datepicker-hint"]'),
      ).toBeTruthy();
      expect(
        fixture.nativeElement.querySelector(
          '[data-testid="datepicker-input-status"]',
        ),
      ).toBeTruthy();

      const toggle = fixture.nativeElement.querySelector(
        '[data-testid="datepicker-toggle"]',
      ) as HTMLButtonElement;
      toggle.click();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(
        document.querySelector('[data-testid="datepicker-dialog"]'),
      ).toBeTruthy();
      expect(
        document.querySelector('[data-testid="datepicker-calendar-grid"]'),
      ).toBeTruthy();
      expect(document.querySelector("datepicker-dialog")).toBeTruthy();
      expect(document.querySelector("datepicker-grid")).toBeTruthy();
      expect(
        document.querySelector('[data-testid^="datepicker-day-"]'),
      ).toBeTruthy();
      expect(
        document.querySelector('[data-testid="datepicker-hour-input"]'),
      ).toBeTruthy();
    });

    it("should have all documented test IDs from MDX", async () => {
      fixture.componentRef.setInput("testId", "your-id");
      fixture.detectChanges();
      await fixture.whenStable();

      expect(
        fixture.nativeElement.querySelector('[data-testid="your-id"]'),
      ).toBeTruthy();
      expect(
        fixture.nativeElement.querySelector('[data-testid="your-id-input"]'),
      ).toBeTruthy();
      expect(
        fixture.nativeElement.querySelector('[data-testid="your-id-toggle"]'),
      ).toBeTruthy();

      (
        fixture.nativeElement.querySelector(
          '[data-testid="your-id-toggle"]',
        ) as HTMLButtonElement
      ).click();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(
        document.querySelector('[data-testid="your-id-dialog"]'),
      ).toBeTruthy();
    });
  });

  describe("dateOnly", () => {
    it("should infer date-only mode from the Luxon format", () => {
      fixture.componentRef.setInput("luxonDateFormat", "dd.MM.yyyy");
      fixture.detectChanges();

      expect(component.dateOnly()).toBeTruthy();
    });

    it("should hide time selection and use the date-only format", async () => {
      fixture.componentRef.setInput("luxonDateFormat", "dd.MM.yyyy");
      component.writeValue("2026-07-12T14:30:45");
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector(
        "input",
      ) as HTMLInputElement;
      expect(input.value).toBe("12.07.2026");
      expect(component.selectedDate()?.hour).toBe(0);
      expect(component.selectedDate()?.minute).toBe(0);
      expect(component.selectedDate()?.second).toBe(0);

      (
        fixture.nativeElement.querySelector(
          '[data-testid$="toggle"]',
        ) as HTMLButtonElement
      ).click();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(document.querySelector(".datepicker-time-wheels")).toBeNull();
      expect(document.querySelector(".datepicker-time-select")).toBeNull();
    });

    it("should describe the input-adjacent current-date action accurately", () => {
      fixture.componentRef.setInput("luxonDateFormat", "dd.MM.yyyy");
      fixture.detectChanges();

      const nowButton = fixture.nativeElement.querySelector(
        '[data-testid="datepicker-now-input"]',
      ) as HTMLButtonElement;

      expect(nowButton.getAttribute("aria-label")).toBe(
        "Heutiges Datum auswählen",
      );
    });

    it("should emit the selected date at the start of the day", () => {
      fixture.componentRef.setInput("luxonDateFormat", "dd.MM.yyyy");
      const onChangeSpy = vi.fn();
      component.registerOnChange(onChangeSpy);

      const selectedDate = DateTime.fromISO("2026-07-12T18:30:45");
      (component as any).selectDate(selectedDate);

      expect(component.selectedDate()?.toISO()).toBe(
        selectedDate.startOf("day").toISO(),
      );
      expect(onChangeSpy).toHaveBeenCalledWith(
        selectedDate.startOf("day").toJSDate(),
      );
    });
  });

  it("should NOT open calendar when input is clicked", () => {
    const input = fixture.nativeElement.querySelector("input");
    input.click();
    fixture.detectChanges();
    expect((component as any).isOpen()).toBeFalsy();
    let calendar = document.querySelector(".datepicker-calendar");
    expect(calendar).toBeNull();

    const button = fixture.nativeElement.querySelector(
      '[data-testid$="toggle"]',
    ) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    expect((component as any).isOpen()).toBeTruthy();
    calendar = document.querySelector(".datepicker-calendar");
    expect(calendar).toBeTruthy();

    button.click();
    fixture.detectChanges();
    expect((component as any).isOpen()).toBeFalsy();
    calendar = document.querySelector(".datepicker-calendar");
    expect(calendar).toBeNull();
  });

  describe("calendar day arrangement", () => {
    it("should render July 2026 with day 1 on Wednesday", async () => {
      component.writeValue("2026-07-15T00:00:00");
      (component as any).isOpen.set(true);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.grid()[0].days.map((date) => date?.day ?? null)).toEqual(
        [null, null, 1, 2, 3, 4, 5],
      );

      const weekdayCells = document.querySelectorAll(
        ".datepicker-weekday-row .datepicker-day-name",
      );
      const weekRows = document.querySelectorAll(".datepicker-week");
      const firstRowCells = weekRows[0].querySelectorAll(
        ".datepicker-kw-value, .datepicker-gridcell",
      );

      expect(weekdayCells).toHaveLength(8);
      expect(firstRowCells).toHaveLength(8);
      expect(firstRowCells[0].textContent?.trim()).toBe("27"); // KW for July 1, 2026
      expect(firstRowCells[1].textContent?.trim()).toBe("");
      expect(firstRowCells[2].textContent?.trim()).toBe("");
      expect(firstRowCells[3].textContent?.trim()).toBe("1");

      const renderedDates = Array.from(
        document.querySelectorAll<HTMLButtonElement>(
          ".datepicker-day[data-date]",
        ),
      ).map((button) => button.dataset["date"]);

      expect(renderedDates).toHaveLength(31);
      expect(
        renderedDates.every((date) => date?.startsWith("2026-07-")),
      ).toBeTruthy();
    });

    const monthStartCases: Array<[string, number, number]> = [
      ["2026-06-15T00:00:00", 0, 0], // Monday
      ["2026-09-15T00:00:00", 1, 0], // Tuesday
      ["2026-08-15T00:00:00", 5, 0], // Saturday
      ["2026-11-15T00:00:00", 6, 0], // Sunday
      ["2027-02-15T00:00:00", 0, 0], // Monday (Feb 2027)
    ];

    it.each(monthStartCases)(
      "should place day 1 in the correct Monday-first column for %s",
      (value, expectedColumn, expectedRow) => {
        component.writeValue(value);

        const row = component.grid()[expectedRow].days;

        expect(row[expectedColumn]?.day).toBe(1);
        expect(
          component.grid().every((week) => week.days.length === 7),
        ).toBeTruthy();
      },
    );

    it("should expose weekday headings in Monday-first order", () => {
      expect(component.daysOfWeek().map((day) => day.long)).toEqual(
        Info.weekdays("long", { locale: "de" }),
      );
    });
  });

  it("should navigate to previous and next month", () => {
    (component as any).isOpen.set(true);
    fixture.detectChanges();

    const initialMonth = component.viewDate().month;

    component.prevMonth();
    expect(component.viewDate().month).toBe(
      initialMonth === 1 ? 12 : initialMonth - 1,
    );

    component.nextMonth();
    expect(component.viewDate().month).toBe(initialMonth);
  });

  it("should navigate to previous and next year", () => {
    (component as any).isOpen.set(true);
    fixture.detectChanges();

    const initialYear = component.viewDate().year;

    component.prevYear();
    expect(component.viewDate().year).toBe(initialYear - 1);

    component.nextYear();
    expect(component.viewDate().year).toBe(initialYear);
  });

  it("should keep one tabbable calendar day after month navigation", async () => {
    component.writeValue("2026-07-31T10:00:00");
    const toggle = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-toggle"]',
    ) as HTMLButtonElement;
    toggle.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const nextMonthButton = document.querySelector(
      '[data-testid="datepicker-next-month"]',
    ) as HTMLButtonElement;
    nextMonthButton.click();
    fixture.detectChanges();

    const tabbableDays = document.querySelectorAll(
      '.datepicker-day[tabindex="0"]',
    );
    expect(tabbableDays).toHaveLength(1);
    expect((tabbableDays[0] as HTMLElement).getAttribute("data-date")).toBe(
      "2026-08-31",
    );
  });

  it("should select a date and NOT close the calendar", () => {
    const onChangeSpy = vi.fn();
    component.registerOnChange(onChangeSpy);
    (component as any).isOpen.set(true);

    const today = DateTime.now().startOf("day");
    (component as any).selectDate(today);

    expect(component.selectedDate()?.hasSame(today, "day")).toBeTruthy();
    expect(onChangeSpy).toHaveBeenCalledWith(today.toJSDate());
    expect((component as any).isOpen()).toBeTruthy();
  });

  it("should select now from the input-adjacent button", async () => {
    fixture.componentRef.setInput(
      "luxonDateFormat",
      "dd.MM.yyyy HH:mm:ss 'Uhr'",
    );
    const onChangeSpy = vi.fn();
    component.registerOnChange(onChangeSpy);

    const nowButton = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-now-input"]',
    ) as HTMLButtonElement;
    expect(nowButton).toBeTruthy();

    const before = DateTime.now();
    nowButton.click();
    fixture.detectChanges();
    const after = DateTime.now();

    expect(component.selectedDate()).toBeTruthy();
    const selectedDate = component.selectedDate()!;
    expect(selectedDate.toMillis()).toBeGreaterThanOrEqual(
      before.toMillis() - 1000,
    );
    expect(selectedDate.toMillis()).toBeLessThanOrEqual(
      after.toMillis() + 1000,
    );

    expect(onChangeSpy).toHaveBeenCalled();
  });

  it("should place the 'now' button between 'clear' and 'toggle' buttons", async () => {
    // Set a date so clear button appears
    component.writeValue("2026-07-15T10:00:00");
    fixture.detectChanges();

    const wrapper = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-input-wrapper"]',
    );
    const buttons = Array.from(
      wrapper.querySelectorAll("button"),
    ) as HTMLButtonElement[];

    const clearIndex = buttons.findIndex((b) =>
      b.getAttribute("data-testid")?.endsWith("-clear"),
    );
    const nowIndex = buttons.findIndex((b) =>
      b.getAttribute("data-testid")?.endsWith("-now-input"),
    );
    const toggleIndex = buttons.findIndex((b) =>
      b.getAttribute("data-testid")?.endsWith("-toggle"),
    );

    expect(clearIndex).not.toBe(-1);
    expect(nowIndex).not.toBe(-1);
    expect(toggleIndex).not.toBe(-1);
    expect(clearIndex).toBeLessThan(nowIndex);
    expect(nowIndex).toBeLessThan(toggleIndex);

    const input = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-input"]',
    ) as HTMLInputElement;
    const clearButton = buttons.find((button) =>
      button.getAttribute("data-testid")?.endsWith("-clear"),
    );

    expect(clearButton).toBeTruthy();
    expect(clearButton?.id).toMatch(/^datepicker-\d+-clear$/);
    expect(clearButton?.getAttribute("aria-controls")).toBe(input.id);
  });

  it("should update time", () => {
    const onChangeSpy = vi.fn();
    component.registerOnChange(onChangeSpy);

    const today = DateTime.now().startOf("day");
    (component as any).selectDate(today);

    (component as any).updateTime("hour", 14);
    (component as any).updateTime("minute", 30);
    (component as any).updateTime("second", 45);

    expect(component.selectedDate()?.hour).toBe(14);
    expect(component.selectedDate()?.minute).toBe(30);
    expect(component.selectedDate()?.second).toBe(45);
    expect(onChangeSpy).toHaveBeenLastCalledWith(
      component.selectedDate()?.toJSDate(),
    );
  });

  it("should adjust time correctly", () => {
    const onChangeSpy = vi.fn();
    component.registerOnChange(onChangeSpy);

    const baseDate = DateTime.fromISO("2026-07-15T10:30:00");
    component.writeValue(baseDate.toISO());

    (component as any).adjustTime({ minutes: 15 });
    expect(component.selectedDate()?.toISO()).toBe(
      baseDate.plus({ minutes: 15 }).toISO(),
    );

    (component as any).adjustTime({ minutes: -30 });
    expect(component.selectedDate()?.toISO()).toBe(
      baseDate.minus({ minutes: 15 }).toISO(),
    );

    (component as any).adjustTime({ hours: 12 });
    expect(component.selectedDate()?.toISO()).toBe(
      baseDate.plus({ hours: 12, minutes: -15 }).toISO(),
    );
  });

  it("should increment and decrement time through the reusable wheel", async () => {
    component.writeValue("2026-07-12T10:30:30");
    const toggle = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-toggle"]',
    ) as HTMLButtonElement;
    toggle.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const increment = document.querySelector(
      '[data-testid="datepicker-hour-increment"]',
    ) as HTMLButtonElement;
    const decrement = document.querySelector(
      '[data-testid="datepicker-hour-decrement"]',
    ) as HTMLButtonElement;

    increment.click();
    fixture.detectChanges();
    expect(component.selectedDate()?.hour).toBe(11);

    decrement.click();
    fixture.detectChanges();
    expect(component.selectedDate()?.hour).toBe(10);

    (component as any).updateTime("hour", 23);
    fixture.detectChanges();
    increment.click();
    fixture.detectChanges();
    expect(component.selectedDate()?.hour).toBe(0);

    decrement.click();
    fixture.detectChanges();
    expect(component.selectedDate()?.hour).toBe(23);
  });

  it("should update state when writeValue is called", () => {
    const testDate = "2023-12-25";
    component.writeValue(testDate);
    fixture.detectChanges();

    expect(component.selectedDate()?.toISO()).toBe(
      DateTime.fromISO(testDate).toISO(),
    );
    expect(
      component.viewDate().hasSame(DateTime.fromISO(testDate), "month"),
    ).toBeTruthy();
  });

  describe("date input", () => {
    it("should update state when date input is set", async () => {
      const testDate = "2023-12-25";
      fixture.componentRef.setInput("value", testDate);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.selectedDate()?.toISODate()).toBe(testDate);
      expect(component.value()).toBe(testDate);
    });

    it("should update state when date input is set as Date object", async () => {
      const testDate = new Date(2023, 11, 25);
      fixture.componentRef.setInput("value", testDate);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.selectedDate()?.toJSDate()).toEqual(testDate);
      expect(component.value()).toEqual(testDate);
    });
  });

  describe("Manual Input", () => {
    it("should allow entering date manually", () => {
      fixture.componentRef.setInput(
        "luxonDateFormat",
        "dd.MM.yyyy HH:mm:ss 'Uhr'",
      );
      const input = fixture.nativeElement.querySelector(
        "input",
      ) as HTMLInputElement;
      expect(input.readOnly).toBeFalsy();

      const testDateStr = "24.12.2023 18:00:00 Uhr";
      input.value = testDateStr;
      input.dispatchEvent(new Event("input"));
      fixture.detectChanges();

      const expectedDate = DateTime.fromFormat(
        testDateStr,
        (component as any).dateFormat(),
      );
      expect(component.selectedDate()?.toISODate()).toBe(
        expectedDate.toISODate(),
      );
      expect(component.selectedDate()?.hour).toBe(18);
      expect(component.selectedDate()?.minute).toBe(0);
      expect(component.selectedDate()?.second).toBe(0);
    });

    it("should keep an invalid date visible and expose an error", () => {
      fixture.componentRef.setInput("luxonDateFormat", "dd.MM.yyyy");
      const input = fixture.nativeElement.querySelector(
        "input",
      ) as HTMLInputElement;

      input.value = "31.02.2026";
      input.dispatchEvent(new Event("input"));
      fixture.detectChanges();

      expect(input.value).toBe("31.02.2026");
      expect(component.selectedDate()).toBeNull();
      expect(input.getAttribute("aria-invalid")).toBe("true");

      const error = fixture.nativeElement.querySelector(
        '[data-testid="datepicker-error"]',
      ) as HTMLElement;
      expect(error).toBeTruthy();
      expect(error.getAttribute("role")).toBe("alert");
      expect(error.getAttribute("aria-atomic")).toBe("true");
      expect(input.getAttribute("aria-errormessage")).toBe(error.id);
      expect(input.getAttribute("aria-describedby")?.split(" ")).toContain(
        error.id,
      );
    });

    it("should parse string input value and output Date object to parent", async () => {
      const onChangeSpy = vi.fn();
      component.registerOnChange(onChangeSpy);

      fixture.componentRef.setInput("value", "2023-12-25");
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.selectedDate()?.toISODate()).toBe("2023-12-25");
      expect(onChangeSpy).toHaveBeenCalled();
      const callValue = onChangeSpy.mock.calls[0][0];
      expect(callValue).toBeInstanceOf(Date);
      expect(DateTime.fromJSDate(callValue).toISODate()).toBe("2023-12-25");
    });

    it("should proactively append separators and pad an unambiguous month", () => {
      fixture.componentRef.setInput("dateFormat", "MM-dd-yyyy");
      const input = fixture.nativeElement.querySelector(
        "input",
      ) as HTMLInputElement;

      input.value = "3";
      input.dispatchEvent(new Event("input"));
      fixture.detectChanges();

      expect(input.value).toBe("03-");
    });

    it("should append the separator when a day segment is submitted", () => {
      fixture.componentRef.setInput("dateFormat", "dd-MM-yyyy");
      const input = fixture.nativeElement.querySelector(
        "input",
      ) as HTMLInputElement;

      input.value = "3";
      input.dispatchEvent(new Event("blur"));
      fixture.detectChanges();

      expect(input.value).toBe("03-");
    });

    it("should support a year-first Luxon format and proactively append separators", () => {
      fixture.componentRef.setInput("dateFormat", "yyyy-MM-dd");
      const input = fixture.nativeElement.querySelector(
        "input",
      ) as HTMLInputElement;

      input.value = "20263";
      input.dispatchEvent(new Event("input"));
      fixture.detectChanges();

      expect(input.value).toBe("2026-03-");
    });

    it.each([
      ["dd MMMM yyyy", "15 Juli 2026", "2026-07-15T00:00:00"],
      ["MM/dd/yyyy h:mm a", "07/15/2026 4:59 PM", "2026-07-15T16:59:00"],
      ["kkkk-'W'WW-E", "2026-W29-3", "2026-07-15T00:00:00"],
      ["yyyy-ooo", "2026-196", "2026-07-15T00:00:00"],
      ["D", "15.7.2026", "2026-07-15T00:00:00"],
    ])(
      "should parse the custom Luxon format %s",
      (format, value, expectedIsoPrefix) => {
        fixture.componentRef.setInput("dateFormat", format);
        fixture.componentRef.setInput("locale", "de-DE");
        const input = fixture.nativeElement.querySelector(
          '[data-testid="datepicker-input"]',
        ) as HTMLInputElement;

        input.value = value;
        input.dispatchEvent(new Event("input"));
        fixture.detectChanges();

        expect(component.selectedDate()?.toISO()).toMatch(
          new RegExp(`^${expectedIsoPrefix}`),
        );
        expect(input.value).toBe(
          component.selectedDate()?.setLocale("de-DE").toFormat(format),
        );
        expect(input.getAttribute("aria-invalid")).toBe("false");
      },
    );

    it("should update the placeholder and formatted value when luxonDateFormat changes after initialization", async () => {
      fixture.componentRef.setInput("luxonDateFormat", "dd.MM.yyyy HH:mm:ss");
      fixture.detectChanges();

      component.writeValue("2026-07-15T16:59:11");
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector(
        '[data-testid="datepicker-input"]',
      ) as HTMLInputElement;

      expect(input.placeholder).toBe("dd.MM.yyyy HH:mm:ss");
      expect(input.value).toBe("15.07.2026 16:59:11");

      fixture.componentRef.setInput("luxonDateFormat", "yyyy/MM/dd HH:mm:ss");
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(input.placeholder).toBe("yyyy/MM/dd HH:mm:ss");
      expect(input.value).toBe("2026/07/15 16:59:11");
    });

    it("should remove single quotes from the placeholder", () => {
      fixture.componentRef.setInput(
        "luxonDateFormat",
        "dd.MM.yyyy HH:mm:ss 'Uhr'",
      );
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector(
        '[data-testid="datepicker-input"]',
      ) as HTMLInputElement;

      expect(input.placeholder).toBe("dd.MM.yyyy HH:mm:ss Uhr");
    });

    it("should keep the dateFormat alias reactive after initialization", async () => {
      fixture.componentRef.setInput("dateFormat", "dd.MM.yyyy HH:mm:ss");
      fixture.detectChanges();

      component.writeValue("2026-07-15T16:59:11");
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector(
        '[data-testid="datepicker-input"]',
      ) as HTMLInputElement;

      fixture.componentRef.setInput("dateFormat", "MM-dd-yyyy HH:mm:ss");
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(input.placeholder).toBe("MM-dd-yyyy HH:mm:ss");
      expect(input.value).toBe("07-15-2026 16:59:11");
    });

    it("should use the configured locale for textual Luxon tokens", () => {
      fixture.componentRef.setInput("dateFormat", "dd MMMM yyyy");
      fixture.componentRef.setInput("locale", "en-US");
      component.writeValue("2026-07-15T00:00:00");
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector(
        '[data-testid="datepicker-input"]',
      ) as HTMLInputElement;

      expect(input.value).toBe("15 July 2026");
    });

    it("should fall back to the browser locale when locale is not provided", () => {
      const browserLocale =
        navigator.languages?.find((locale) => locale.trim().length > 0) ??
        navigator.language ??
        Intl.DateTimeFormat().resolvedOptions().locale;

      fixture.componentRef.setInput("dateFormat", "dd MMMM yyyy");
      fixture.componentRef.setInput("locale", null);
      component.writeValue("2026-07-15T00:00:00");
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector(
        '[data-testid="datepicker-input"]',
      ) as HTMLInputElement;

      expect((component as any).resolvedLocale()).toBe(browserLocale);
      expect(input.value).toBe(
        DateTime.fromISO("2026-07-15")
          .setLocale(browserLocale)
          .toFormat("dd MMMM yyyy"),
      );
      expect(component.daysOfWeek().map((day) => day.long)).toEqual(
        Info.weekdays("long", { locale: browserLocale }),
      );
    });

    it.each([
      ['empty', ''],
      ['unknown token', 'dd.MM.yyy'],
      ['unclosed literal', "dd.MM.yyyy 'Uhr"],
      ['conflicting tokens', 'HH:mm a'],
      ['non-parseable token', 'yyyy-MM-dd ZZZZ'],
    ])('should throw for an invalid %s dateFormat', (_, format) => {
      fixture.componentRef.setInput('dateFormat', format);

      expect(() => {
        fixture.detectChanges();
        (component as any).dateFormat();
      }).toThrowError(/Invalid Luxon date format/u);
    });

    it("should NOT open calendar on enter and should commit the current input", () => {
      fixture.componentRef.setInput(
        "luxonDateFormat",
        "dd.MM.yyyy HH:mm:ss 'Uhr'",
      );
      const input = fixture.nativeElement.querySelector(
        "input",
      ) as HTMLInputElement;
      input.value = "24.12.2023 18:00:00 Uhr";
      input.dispatchEvent(new Event("input"));
      input.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      );
      fixture.detectChanges();

      expect((component as any).isOpen()).toBeFalsy();
      expect(component.selectedDate()?.toISODate()).toBe("2023-12-24");
    });

    it("should parse a pasted datetime without requiring the Uhr suffix", () => {
      fixture.componentRef.setInput(
        "luxonDateFormat",
        "dd.MM.yyyy HH:mm:ss 'Uhr'",
      );
      const onChangeSpy = vi.fn();
      component.registerOnChange(onChangeSpy);
      const input = fixture.nativeElement.querySelector(
        '[data-testid="datepicker-input"]',
      ) as HTMLInputElement;

      dispatchPaste(input, " 15.07.2026 16:59:11 ");
      fixture.detectChanges();

      expect(input.value).toBe("15.07.2026 16:59:11 Uhr");
      expect(component.selectedDate()?.toISO()).toBe(
        DateTime.fromISO("2026-07-15T16:59:11").toISO(),
      );
      expect(onChangeSpy).toHaveBeenCalledWith(
        DateTime.fromISO("2026-07-15T16:59:11").toJSDate(),
      );
      expect(input.getAttribute("aria-invalid")).toBe("false");
    });

    it("should normalize a pasted case-insensitive Uhr suffix", () => {
      fixture.componentRef.setInput(
        "luxonDateFormat",
        "dd.MM.yyyy HH:mm:ss 'Uhr'",
      );
      const input = fixture.nativeElement.querySelector(
        '[data-testid="datepicker-input"]',
      ) as HTMLInputElement;

      dispatchPaste(input, "15.07.2026 16:59:11 uHr");
      fixture.detectChanges();

      expect(input.value).toBe("15.07.2026 16:59:11 Uhr");
      expect(component.selectedDate()?.toISO()).toBe(
        DateTime.fromISO("2026-07-15T16:59:11").toISO(),
      );
    });

    it.each([
      ["seconds", 1_752_598_751],
      ["milliseconds", 1_752_598_751_000],
    ])(
      "should parse pasted epoch %s and display the configured format",
      (_, epoch) => {
        fixture.componentRef.setInput(
          "luxonDateFormat",
          "dd.MM.yyyy HH:mm:ss 'Uhr'",
        );
        const input = fixture.nativeElement.querySelector(
          '[data-testid="datepicker-input"]',
        ) as HTMLInputElement;
        const expected = DateTime.fromMillis(
          epoch < 10_000_000_000 ? epoch * 1_000 : epoch,
        );

        dispatchPaste(input, epoch.toString());
        fixture.detectChanges();

        expect(component.selectedDate()?.toMillis()).toBe(expected.toMillis());
        expect(input.value).toBe(
          expected.toFormat("dd.MM.yyyy HH:mm:ss 'Uhr'"),
        );
        expect(input.getAttribute("aria-invalid")).toBe("false");
      },
    );

    it("should normalize pasted epoch seconds when seconds are hidden", () => {
      const input = fixture.nativeElement.querySelector(
        '[data-testid="datepicker-input"]',
      ) as HTMLInputElement;
      const epoch = 1_752_598_751;
      const expected = DateTime.fromMillis(epoch * 1_000).set({
        second: 0,
        millisecond: 0,
      });

      dispatchPaste(input, epoch.toString());
      fixture.detectChanges();

      expect(component.selectedDate()?.toMillis()).toBe(expected.toMillis());
      expect(input.value).toBe(expected.toFormat("dd.MM.yyyy HH:mm 'Uhr'"));
    });

    it("should normalize a pasted epoch to start of day in date-only mode", () => {
      fixture.componentRef.setInput("luxonDateFormat", "dd.MM.yyyy");
      const input = fixture.nativeElement.querySelector(
        '[data-testid="datepicker-input"]',
      ) as HTMLInputElement;
      const epoch = 1_752_598_751_000;
      const expected = DateTime.fromMillis(epoch).startOf("day");

      dispatchPaste(input, epoch.toString());
      fixture.detectChanges();

      expect(component.selectedDate()?.toMillis()).toBe(expected.toMillis());
      expect(input.value).toBe(expected.toFormat("dd.MM.yyyy"));
    });

    it("should paste a short value into the selected hour without treating it as epoch", () => {
      component.writeValue("2026-07-15T10:59:00");
      fixture.detectChanges();
      const input = fixture.nativeElement.querySelector(
        '[data-testid="datepicker-input"]',
      ) as HTMLInputElement;
      const hourStart = input.value.indexOf("10");
      input.setSelectionRange(hourStart, hourStart + 2);

      dispatchPaste(input, "16");
      fixture.detectChanges();

      expect(component.selectedDate()?.toISO()).toBe(
        DateTime.fromISO("2026-07-15T16:59:00").toISO(),
      );
      expect(input.value).toBe("15.07.2026 16:59 Uhr");
    });

    it("should mark invalid pasted trailing text and emit null", () => {
      const onChangeSpy = vi.fn();
      component.registerOnChange(onChangeSpy);
      const input = fixture.nativeElement.querySelector(
        '[data-testid="datepicker-input"]',
      ) as HTMLInputElement;

      dispatchPaste(input, "15.07.2026 16:59 extra");
      fixture.detectChanges();

      expect(onChangeSpy).toHaveBeenCalledWith(null);
      expect(component.selectedDate()).toBeNull();
      expect(input.getAttribute("aria-invalid")).toBe("true");
      expect(
        fixture.nativeElement.querySelector('[data-testid="datepicker-error"]'),
      ).toBeTruthy();
    });

    it("should prefer a complete pasted value over the existing input content", () => {
      fixture.componentRef.setInput(
        "luxonDateFormat",
        "dd.MM.yyyy HH:mm:ss 'Uhr'",
      );
      component.writeValue("2026-01-01T10:00:00");
      fixture.detectChanges();
      const input = fixture.nativeElement.querySelector(
        '[data-testid="datepicker-input"]',
      ) as HTMLInputElement;
      input.setSelectionRange(input.value.length, input.value.length);

      dispatchPaste(input, "15.07.2026 16:59:11");
      fixture.detectChanges();

      expect(input.value).toBe("15.07.2026 16:59:11 Uhr");
      expect(component.selectedDate()?.toISO()).toBe(
        DateTime.fromISO("2026-07-15T16:59:11").toISO(),
      );
    });

    it("should expose an accessible status message after successful paste", () => {
      const input = fixture.nativeElement.querySelector(
        '[data-testid="datepicker-input"]',
      ) as HTMLInputElement;
      const status = fixture.nativeElement.querySelector(
        '[data-testid="datepicker-input-status"]',
      ) as HTMLElement;

      expect(status.id).toMatch(/^datepicker-\d+-status$/);
      expect(status.getAttribute("role")).toBe("status");
      expect(status.getAttribute("aria-live")).toBe("polite");
      expect(status.getAttribute("aria-atomic")).toBe("true");

      dispatchPaste(input, "15.07.2026 16:59");
      fixture.detectChanges();

      expect(status.textContent).toContain(
        "Eingefügtes Datum und Uhrzeit übernommen.",
      );
    });

    it("should allow deleting the separator via backspace", () => {
      fixture.componentRef.setInput("dateFormat", "dd.MM.yyyy");
      const input = fixture.nativeElement.querySelector(
        "input",
      ) as HTMLInputElement;

      // Simulate typing "15" -> becomes "15."
      input.value = "15";
      input.dispatchEvent(new Event("input"));
      fixture.detectChanges();
      expect(input.value).toBe("15.");

      // Simulate backspace -> "15." becomes "15"
      input.value = "15";
      input.dispatchEvent(new Event("input"));
      fixture.detectChanges();
      expect(input.value).toBe("15");
    });

    it("should follow the smart backspace example sequence from the issue description", () => {
      fixture.componentRef.setInput(
        "luxonDateFormat",
        "dd.MM.yyyy HH:mm:ss 'Uhr'",
      );
      const input = fixture.nativeElement.querySelector(
        "input",
      ) as HTMLInputElement;

      // Initialize
      input.value = "15.07.2026 16:59:11 Uhr";
      input.dispatchEvent(new Event("input"));
      fixture.detectChanges();
      expect(input.value).toBe("15.07.2026 16:59:11 Uhr");

      const backspace = () => {
        input.setSelectionRange(input.value.length, input.value.length);
        const event = new KeyboardEvent("keydown", {
          key: "Backspace",
          bubbles: true,
          cancelable: true,
        });
        input.dispatchEvent(event);
        if (!event.defaultPrevented) {
          input.value = input.value.slice(0, -1);
          input.dispatchEvent(new Event("input"));
        }
        fixture.detectChanges();
      };

      // 1. 15.07.2026 16:59:11 Uhr -> Backspace -> 15.07.2026 16:59:1
      backspace();
      expect(input.value).toBe("15.07.2026 16:59:1");

      // 2. 15.07.2026 16:59:1 -> Backspace -> 15.07.2026 16:59
      backspace();
      expect(input.value).toBe("15.07.2026 16:59");

      // 3. 15.07.2026 16:59 -> Backspace -> 15.07.2026 16:5
      backspace();
      expect(input.value).toBe("15.07.2026 16:5");

      // 4. 15.07.2026 16:5 -> Backspace -> 15.07.2026 16
      backspace();
      expect(input.value).toBe("15.07.2026 16");

      // 5. 15.07.2026 16 -> Backspace -> 15.07.2026 1
      backspace();
      expect(input.value).toBe("15.07.2026 1");

      // 6. 15.07.2026 1 -> Backspace -> 15.07.2026
      backspace();
      expect(input.value).toBe("15.07.2026");

      // 7. 15.07.2026 -> Backspace -> 15.07.202
      backspace();
      expect(input.value).toBe("15.07.202");
    });

    it("should support backspace deletion when 'Uhr' is absent", () => {
      fixture.componentRef.setInput("dateFormat", "dd.MM.yyyy HH:mm");
      const input = fixture.nativeElement.querySelector(
        "input",
      ) as HTMLInputElement;

      // Set initial value
      input.value = "15.09.2026 20:26";
      input.dispatchEvent(new Event("input"));
      fixture.detectChanges();
      expect(input.value).toBe("15.09.2026 20:26");

      // Backspace on '6'
      input.value = "15.09.2026 20:2";
      input.dispatchEvent(new Event("input"));
      fixture.detectChanges();
      expect(input.value).toBe("15.09.2026 20:2");
    });

    it("should support backspace deletion for a date-only value", () => {
      fixture.componentRef.setInput("luxonDateFormat", "dd.MM.yyyy");
      const input = fixture.nativeElement.querySelector(
        "input",
      ) as HTMLInputElement;

      // Set initial value
      input.value = "15.09.2026";
      input.dispatchEvent(new Event("input"));
      fixture.detectChanges();
      expect(input.value).toBe("15.09.2026");

      // Backspace on '6'
      input.value = "15.09.202";
      input.dispatchEvent(new Event("input"));
      fixture.detectChanges();
      expect(input.value).toBe("15.09.202");
    });

    it("should remove ' Uhr' suffix and the last digit when Backspace is pressed at the end", () => {
      fixture.componentRef.setInput(
        "luxonDateFormat",
        "dd.MM.yyyy HH:mm:ss 'Uhr'",
      );
      const input = fixture.nativeElement.querySelector(
        "input",
      ) as HTMLInputElement;

      // Initial value with ' Uhr'
      input.value = "15.07.2026 16:59:11 Uhr";
      input.dispatchEvent(new Event("input"));
      fixture.detectChanges();
      expect(input.value).toBe("15.07.2026 16:59:11 Uhr");

      // Place caret at the end
      input.setSelectionRange(input.value.length, input.value.length);

      // Simulate Backspace keydown
      const event = new KeyboardEvent("keydown", {
        key: "Backspace",
        bubbles: true,
        cancelable: true,
      });
      input.dispatchEvent(event);
      fixture.detectChanges();

      // Expected: suffix ' Uhr' and last digit '1' are removed
      expect(input.value).toBe("15.07.2026 16:59:1");
      expect(input.selectionStart).toBe(input.value.length);
    });
  });

  it("should have correct accessibility attributes and ID relationships", () => {
    const root = fixture.nativeElement.querySelector(
      '[data-testid="datepicker"]',
    ) as HTMLElement;
    const wrapper = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-input-wrapper"]',
    ) as HTMLElement;
    const label = fixture.nativeElement.querySelector(
      ".datepicker-label",
    ) as HTMLLabelElement;
    const input = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-input"]',
    ) as HTMLInputElement;
    const nowButton = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-now-input"]',
    ) as HTMLButtonElement;
    const toggleButton = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-toggle"]',
    ) as HTMLButtonElement;

    expect(root.id).toMatch(/^datepicker-\d+$/);
    expect(wrapper.id).toBe(`${root.id}-input-wrapper`);
    expect(label.textContent).toContain(component.label());
    expect(label.htmlFor).toBe(input.id);
    expect(input.id).toBe(`${root.id}-input`);
    expect(input.getAttribute("role")).toBe("combobox");
    expect(input.getAttribute("aria-autocomplete")).toBe("none");
    expect(input.getAttribute("aria-haspopup")).toBe("dialog");
    expect(input.getAttribute("aria-keyshortcuts")).toBe("Enter Escape");
    expect(input.getAttribute("aria-invalid")).toBe("false");
    expect(input.hasAttribute("aria-errormessage")).toBeFalsy();
    expect(
      document.getElementById(input.getAttribute("aria-describedby")!),
    ).toBeTruthy();

    expect(nowButton.id).toBe(`${root.id}-now`);
    expect(nowButton.getAttribute("aria-controls")).toBe(input.id);
    expect(nowButton.getAttribute("aria-label")).toBe(
      "Aktuelles Datum und aktuelle Uhrzeit auswählen",
    );

    expect(toggleButton.id).toBe(`${root.id}-toggle`);
    expect(toggleButton.getAttribute("aria-label")).toContain("Kalender");
    expect(toggleButton.getAttribute("aria-haspopup")).toBe("dialog");
    expect(toggleButton.getAttribute("aria-expanded")).toBe("false");

    const icon = toggleButton.querySelector("mat-icon");
    expect(icon).toBeTruthy();
    expect(icon?.getAttribute("aria-hidden")).toBe("true");
  });

  it("should expose selection on the focusable calendar gridcell", async () => {
    component.writeValue("2026-07-15T10:30:00");
    const toggle = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-toggle"]',
    ) as HTMLButtonElement;
    toggle.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const selectedDay = document.querySelector(
      '[data-testid="datepicker-day-2026-07-15"]',
    ) as HTMLButtonElement;

    expect(selectedDay.getAttribute("role")).toBe("gridcell");
    expect(selectedDay.getAttribute("aria-selected")).toBe("true");
    expect(selectedDay.getAttribute("tabindex")).toBe("0");
    expect(selectedDay.parentElement?.getAttribute("role")).toBe(
      "presentation",
    );
  });

  it("should trap focus and have dialog attributes when calendar is open", async () => {
    const button = fixture.nativeElement.querySelector(
      '[data-testid$="toggle"]',
    ) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const dialog = document.querySelector(
      ".datepicker-calendar",
    ) as HTMLElement;
    const input = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-input"]',
    ) as HTMLInputElement;

    expect(dialog).toBeTruthy();
    expect(dialog.getAttribute("role")).toBe("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.hasAttribute("cdktrapfocus")).toBeTruthy();
    expect(button.getAttribute("aria-controls")).toBe(dialog.id);
    expect(input.getAttribute("aria-controls")).toBe(dialog.id);

    const title = document.getElementById(
      dialog.getAttribute("aria-labelledby") || "",
    );
    const description = document.getElementById(
      dialog.getAttribute("aria-describedby") || "",
    );
    expect(title?.classList.contains("cdk-visually-hidden")).toBeTruthy();
    expect(description?.classList.contains("cdk-visually-hidden")).toBeTruthy();
    expect(title?.getAttribute("data-testid")).toBe("datepicker-dialog-title");
    expect(description?.getAttribute("data-testid")).toBe(
      "datepicker-dialog-description",
    );
  });

  it("should navigate calendar with keyboard", async () => {
    const button = fixture.nativeElement.querySelector(
      '[data-testid$="toggle"]',
    ) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const initialDate = (component as any).activeDate();

    // Simulate ArrowRight on the active day button
    const activeDayButton = document.querySelector(
      '.datepicker-day[tabindex="0"]',
    ) as HTMLButtonElement;
    expect(activeDayButton).toBeTruthy();

    const event = new KeyboardEvent("keydown", {
      key: "ArrowRight",
      bubbles: true,
    });
    activeDayButton.dispatchEvent(event);
    fixture.detectChanges();

    expect(
      (component as any)
        .activeDate()
        .hasSame(initialDate.plus({ days: 1 }), "day"),
    ).toBeTruthy();

    // Simulate ArrowDown (next week)
    const activeDayButtonNext = document.querySelector(
      '.datepicker-day[tabindex="0"]',
    ) as HTMLButtonElement;
    const eventDown = new KeyboardEvent("keydown", {
      key: "ArrowDown",
      bubbles: true,
    });
    activeDayButtonNext.dispatchEvent(eventDown);
    fixture.detectChanges();

    expect(
      (component as any)
        .activeDate()
        .hasSame(initialDate.plus({ days: 8 }), "day"),
    ).toBeTruthy();
  });

  describe("keyboard navigation", () => {
    const dispatchKey = (
      element: Element,
      key: string,
      shiftKey = false,
    ): void => {
      element.dispatchEvent(
        new KeyboardEvent("keydown", { key, shiftKey, bubbles: true }),
      );
      fixture.detectChanges();
    };

    it.each(["Enter", "ArrowDown"])(
      "should NOT open the calendar from the input with %s",
      async (key) => {
        const input = fixture.nativeElement.querySelector(
          '[data-testid="datepicker-input"]',
        ) as HTMLInputElement;

        dispatchKey(input, key);
        await fixture.whenStable();

        expect((component as any).isOpen()).toBeFalsy();
        expect(
          document.querySelector('[data-testid="datepicker-dialog"]'),
        ).toBeNull();
      },
    );

    it("should open the calendar from the button with Enter", async () => {
      const button = fixture.nativeElement.querySelector(
        '[data-testid="datepicker-toggle"]',
      ) as HTMLButtonElement;
      button.focus();

      // Native buttons trigger click on Enter
      button.click();
      fixture.detectChanges();
      await fixture.whenStable();

      expect((component as any).isOpen()).toBeTruthy();
      expect(
        document.querySelector('[data-testid="datepicker-dialog"]'),
      ).toBeTruthy();
    });

    it("should navigate the grid with Arrow Keys", async () => {
      component.writeValue("2026-07-15T10:30:00");
      const toggle = fixture.nativeElement.querySelector(
        '[data-testid="datepicker-toggle"]',
      ) as HTMLButtonElement;
      toggle.click();
      fixture.detectChanges();
      await fixture.whenStable();

      let activeDay = document.querySelector(
        '[data-testid="datepicker-day-2026-07-15"]',
      ) as HTMLButtonElement;

      dispatchKey(activeDay, "ArrowRight");
      expect((component as any).activeDate().toISODate()).toBe("2026-07-16");

      activeDay = document.querySelector(
        '[data-testid="datepicker-day-2026-07-16"]',
      ) as HTMLButtonElement;
      dispatchKey(activeDay, "ArrowLeft");
      expect((component as any).activeDate().toISODate()).toBe("2026-07-15");

      activeDay = document.querySelector(
        '[data-testid="datepicker-day-2026-07-15"]',
      ) as HTMLButtonElement;
      dispatchKey(activeDay, "ArrowDown");
      expect((component as any).activeDate().toISODate()).toBe("2026-07-22");

      activeDay = document.querySelector(
        '[data-testid="datepicker-day-2026-07-22"]',
      ) as HTMLButtonElement;
      dispatchKey(activeDay, "ArrowUp");
      expect((component as any).activeDate().toISODate()).toBe("2026-07-15");
    });

    it("should support Home, End, PageUp, PageDown and shifted year navigation", async () => {
      component.writeValue("2026-07-15T10:30:00");
      const toggle = fixture.nativeElement.querySelector(
        '[data-testid="datepicker-toggle"]',
      ) as HTMLButtonElement;
      toggle.click();
      fixture.detectChanges();
      await fixture.whenStable();

      let activeDay = document.querySelector(
        '[data-testid="datepicker-day-2026-07-15"]',
      ) as HTMLButtonElement;

      dispatchKey(activeDay, "Home");
      expect((component as any).activeDate().toISODate()).toBe("2026-07-13");

      activeDay = document.querySelector(
        '[data-testid="datepicker-day-2026-07-13"]',
      ) as HTMLButtonElement;
      dispatchKey(activeDay, "End");
      expect((component as any).activeDate().toISODate()).toBe("2026-07-19");

      activeDay = document.querySelector(
        '[data-testid="datepicker-day-2026-07-19"]',
      ) as HTMLButtonElement;
      dispatchKey(activeDay, "PageUp");
      expect((component as any).activeDate().toISODate()).toBe("2026-06-19");
      expect(component.viewDate().toFormat("yyyy-MM")).toBe("2026-06");

      fixture.detectChanges();
      activeDay = document.querySelector(
        '[data-testid="datepicker-day-2026-06-19"]',
      ) as HTMLButtonElement;
      dispatchKey(activeDay, "PageDown");
      expect((component as any).activeDate().toISODate()).toBe("2026-07-19");

      fixture.detectChanges();
      activeDay = document.querySelector(
        '[data-testid="datepicker-day-2026-07-19"]',
      ) as HTMLButtonElement;
      dispatchKey(activeDay, "PageUp", true);
      expect((component as any).activeDate().toISODate()).toBe("2025-07-19");
      expect(component.viewDate().year).toBe(2025);
    });

    it("should clamp month and year jumps to the last valid day", async () => {
      component.writeValue("2024-02-29T10:30:00");
      const toggle = fixture.nativeElement.querySelector(
        '[data-testid="datepicker-toggle"]',
      ) as HTMLButtonElement;
      toggle.click();
      fixture.detectChanges();
      await fixture.whenStable();

      let activeDay = document.querySelector(
        '[data-testid="datepicker-day-2024-02-29"]',
      ) as HTMLButtonElement;
      dispatchKey(activeDay, "PageDown", true);
      expect((component as any).activeDate().toISODate()).toBe("2025-02-28");

      component.writeValue("2026-03-31T10:30:00");
      fixture.detectChanges();
      (component as any).activeDate.set(DateTime.fromISO("2026-03-31"));
      (component as any).viewDate.set(DateTime.fromISO("2026-03-01"));
      fixture.detectChanges();

      activeDay = document.querySelector(
        '[data-testid="datepicker-day-2026-03-31"]',
      ) as HTMLButtonElement;
      dispatchKey(activeDay, "PageUp");
      expect((component as any).activeDate().toISODate()).toBe("2026-02-28");
    });

    it.each(["Enter", " "])(
      "should select the focused date with %s",
      async (key) => {
        component.writeValue("2026-07-15T10:30:00");
        const onChangeSpy = vi.fn();
        component.registerOnChange(onChangeSpy);

        const toggle = fixture.nativeElement.querySelector(
          '[data-testid="datepicker-toggle"]',
        ) as HTMLButtonElement;
        toggle.click();
        fixture.detectChanges();
        await fixture.whenStable();

        const targetDay = document.querySelector(
          '[data-testid="datepicker-day-2026-07-20"]',
        ) as HTMLButtonElement;
        dispatchKey(targetDay, key);

        expect(component.selectedDate()?.toISODate()).toBe("2026-07-20");
        expect(onChangeSpy).toHaveBeenCalledWith(expect.any(Date));
        expect((onChangeSpy.mock.calls[0][0] as Date).toISOString()).toContain(
          "2026-07-20",
        );
        expect(
          document.querySelector('[data-testid="datepicker-date-status"]')
            ?.textContent,
        ).toContain("Ausgewählt.");
      },
    );

    it("should close with Escape and restore focus to the opening control", async () => {
      const animationFrameSpy = vi
        .spyOn(window, "requestAnimationFrame")
        .mockImplementation((callback: FrameRequestCallback): number => {
          callback(0);
          return 1;
        });
      const button = fixture.nativeElement.querySelector(
        '[data-testid="datepicker-toggle"]',
      ) as HTMLButtonElement;
      button.focus();

      button.click();
      await fixture.whenStable();
      fixture.detectChanges();

      const activeDay = document.querySelector(
        '.datepicker-day[tabindex="0"]',
      ) as HTMLButtonElement;
      expect(activeDay).toBeTruthy();
      expect(document.activeElement).toBe(activeDay);

      dispatchKey(activeDay, "Escape");
      await fixture.whenStable();
      fixture.detectChanges();

      expect((component as any).isOpen()).toBeFalsy();
      expect(
        document.querySelector('[data-testid="datepicker-dialog"]'),
      ).toBeNull();
      expect(document.activeElement).toBe(button);

      animationFrameSpy.mockRestore();
    });

    it("should support spinbutton keyboard controls for time values", async () => {
      component.writeValue("2026-07-15T10:30:00");
      const toggle = fixture.nativeElement.querySelector(
        '[data-testid="datepicker-toggle"]',
      ) as HTMLButtonElement;
      toggle.click();
      fixture.detectChanges();
      await fixture.whenStable();

      const hourInput = document.querySelector(
        '[data-testid="datepicker-hour-input"]',
      ) as HTMLInputElement;

      dispatchKey(hourInput, "ArrowUp");
      expect(component.selectedDate()?.hour).toBe(11);

      dispatchKey(hourInput, "Home");
      expect(component.selectedDate()?.hour).toBe(0);

      dispatchKey(hourInput, "End");
      expect(component.selectedDate()?.hour).toBe(23);
    });
  });

  it("should allow typing time in time picker", async () => {
    component.registerOnChange(vi.fn());
    const button = fixture.nativeElement.querySelector(
      '[data-testid$="toggle"]',
    ) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const hourInput = document.querySelector(
      ".datepicker-time-select",
    ) as HTMLInputElement;
    expect(hourInput).toBeTruthy();
    expect(hourInput.tagName).toBe("INPUT");

    hourInput.value = "15";
    hourInput.dispatchEvent(new Event("input"));
    hourInput.dispatchEvent(new Event("change"));
    fixture.detectChanges();

    expect(component.selectedDate()?.hour).toBe(15);
  });

  it("should validate time typing", async () => {
    const button = fixture.nativeElement.querySelector(
      '[data-testid$="toggle"]',
    ) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const hourInput = document.querySelector(
      ".datepicker-time-select",
    ) as HTMLInputElement;

    // Try to enter non-numeric value
    hourInput.value = "ab";
    hourInput.dispatchEvent(new Event("input"));
    fixture.detectChanges();
    // The reusable wheel strips non-numeric input
    expect(hourInput.value).toBe("");

    // Try to enter value > 23
    hourInput.value = "99";
    hourInput.dispatchEvent(new Event("input"));
    hourInput.dispatchEvent(new Event("change"));
    fixture.detectChanges();
    expect(component.selectedDate()?.hour).toBe(23); // Clamped to max
  });

  it("should announce time changes", async () => {
    const button = fixture.nativeElement.querySelector(
      '[data-testid$="toggle"]',
    ) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const incrementButton = document.querySelector(
      '[aria-label="Stunde um eins erhöhen"]',
    ) as HTMLButtonElement;
    incrementButton.click();
    fixture.detectChanges();

    expect((component as any).timeAnnouncement()).toContain("Uhrzeit");
    expect((component as any).timeAnnouncement()).toMatch(/Uhrzeit: \d{1,2}:\d{2}/);
  });

  describe("disabled", () => {
    it("should disable the input and hide 'clear' and 'now' buttons when disabled is true", () => {
      // Set a date so clear button would normally appear
      component.writeValue("2026-07-15T10:00:00");
      fixture.componentRef.setInput("disabled", true);
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector(
        "input",
      ) as HTMLInputElement;
      const toggleButton = fixture.nativeElement.querySelector(
        '[data-testid$="toggle"]',
      ) as HTMLButtonElement;
      const nowButton = fixture.nativeElement.querySelector(
        '[data-testid$="now-input"]',
      );
      const clearButton = fixture.nativeElement.querySelector(
        '[data-testid$="clear"]',
      );

      expect(input.disabled).toBeTruthy();
      expect(toggleButton.disabled).toBeTruthy();
      expect(
        toggleButton.classList.contains("datepicker-icon--disabled"),
      ).toBeTruthy();
      expect(nowButton).toBeNull();
      expect(clearButton).toBeNull();
    });

    it("should not open calendar when disabled is true", () => {
      fixture.componentRef.setInput("disabled", true);
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector(
        "input",
      ) as HTMLInputElement;
      input.click();
      fixture.detectChanges();
      expect((component as any).isOpen()).toBeFalsy();

      const button = fixture.nativeElement.querySelector(
        '[data-testid$="toggle"]',
      ) as HTMLButtonElement;
      button.click();
      fixture.detectChanges();
      expect((component as any).isOpen()).toBeFalsy();
    });

    it("should update disabled state via setDisabledState", async () => {
      component.setDisabledState(true);
      fixture.detectChanges();
      await fixture.whenStable();

      const input = fixture.nativeElement.querySelector(
        "input",
      ) as HTMLInputElement;
      expect(input.disabled).toBeTruthy();

      component.setDisabledState(false);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(input.disabled).toBeFalsy();
    });

    it("should still display the provided value when disabled", () => {
      fixture.componentRef.setInput("disabled", true);
      const testDate = "2026-07-12T14:30:45";
      component.writeValue(testDate);
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector(
        "input",
      ) as HTMLInputElement;
      expect(input.value).toBe(
        DateTime.fromISO(testDate).toFormat((component as any).dateFormat()),
      );
    });
  });

  describe("format-derived mode", () => {
    it("should be false by default", () => {
      expect(component.showSeconds()).toBeFalsy();
    });

    it.each([
      ["dd.MM.yyyy", true, false],
      ["dd.MM.yyyy HH:mm", false, false],
      ["dd.MM.yyyy HH:mm:ss", false, true],
      ["D", true, false],
      ["t", false, false],
      ["tt", false, true],
      ["f", false, false],
      ["F", false, true],
    ])(
      "should infer mode from Luxon format %s",
      (format, expectedDateOnly, expectedShowSeconds) => {
        fixture.componentRef.setInput("luxonDateFormat", format);
        fixture.detectChanges();

        expect(component.dateOnly()).toBe(expectedDateOnly);
        expect(component.showSeconds()).toBe(expectedShowSeconds);
      },
    );

    it.each([
      ["MM/dd/yyyy hh:mm a", true],
      ["MM/dd/yyyy h:mm:ss a", true],
      ["dd.MM.yyyy HH:mm", false],
      ["dd.MM.yyyy HH:mm:ss", false],
      ["dd.MM.yyyy", false],
    ])(
      "should infer AM/PM selection from Luxon format %s",
      (format, expected) => {
        fixture.componentRef.setInput("luxonDateFormat", format);
        fixture.detectChanges();

        expect(component.uses12HourClock()).toBe(expected);
        expect(component.showMeridiem()).toBe(expected);
      },
    );

    it("should use the locale hour cycle for Luxon time macros", () => {
      fixture.componentRef.setInput("locale", "en-US");
      fixture.componentRef.setInput("luxonDateFormat", "t");
      fixture.detectChanges();

      expect(component.uses12HourClock()).toBeTruthy();
      expect(component.showMeridiem()).toBeTruthy();

      fixture.componentRef.setInput("locale", "de-DE");
      fixture.detectChanges();

      expect(component.uses12HourClock()).toBeFalsy();
      expect(component.showMeridiem()).toBeFalsy();
    });

    it("should render AM/PM directly after the minute wheel when seconds are omitted", async () => {
      fixture.componentRef.setInput("locale", "en-US");
      fixture.componentRef.setInput("luxonDateFormat", "MM/dd/yyyy hh:mm a");
      component.writeValue("2026-07-15T09:45:00");
      fixture.detectChanges();

      (
        fixture.nativeElement.querySelector(
          '[data-testid="datepicker-toggle"]',
        ) as HTMLButtonElement
      ).click();
      fixture.detectChanges();
      await fixture.whenStable();

      const minuteWheel = document.querySelector(
        '[data-testid="datepicker-minute-unit-control"]',
      ) as HTMLElement;
      const meridiemToggle = document.querySelector(
        '[data-testid="datepicker-meridiem-toggle"]',
      ) as HTMLElement;

      expect(
        document.querySelector('[data-testid="datepicker-second-unit-control"]'),
      ).toBeNull();
      expect(
        minuteWheel.compareDocumentPosition(meridiemToggle) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    it("should render AM/PM after the seconds wheel only for a 12-hour format", async () => {
      fixture.componentRef.setInput("locale", "en-US");
      fixture.componentRef.setInput("luxonDateFormat", "MM/dd/yyyy hh:mm:ss a");
      component.writeValue("2026-07-15T13:45:30");
      fixture.detectChanges();

      (
        fixture.nativeElement.querySelector(
          '[data-testid="datepicker-toggle"]',
        ) as HTMLButtonElement
      ).click();
      fixture.detectChanges();
      await fixture.whenStable();

      const hourInput = document.querySelector(
        '[data-testid="datepicker-hour-input"]',
      ) as HTMLInputElement;
      const secondWheel = document.querySelector(
        '[data-testid="datepicker-second-unit-control"]',
      ) as HTMLElement;
      const meridiemToggle = document.querySelector(
        '[data-testid="datepicker-meridiem-toggle"]',
      ) as HTMLElement;
      const pm = document.querySelector(
        '[data-testid="datepicker-meridiem-pm"]',
      ) as HTMLInputElement;

      expect(hourInput.value).toBe("01");
      expect(hourInput.getAttribute("aria-valuemin")).toBe("1");
      expect(hourInput.getAttribute("aria-valuemax")).toBe("12");
      expect(pm.checked).toBeTruthy();
      expect(meridiemToggle).toBeTruthy();
      expect(
        secondWheel.compareDocumentPosition(meridiemToggle) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();

      fixture.componentRef.setInput("luxonDateFormat", "dd.MM.yyyy HH:mm:ss");
      fixture.detectChanges();
      await fixture.whenStable();

      expect(
        document.querySelector('[data-testid="datepicker-meridiem-toggle"]'),
      ).toBeNull();
      expect(component.selectedDate()?.hour).toBe(13);
      expect(
        (
          document.querySelector(
            '[data-testid="datepicker-hour-input"]',
          ) as HTMLInputElement
        ).value,
      ).toBe("13");
    });

    it("should switch meridiem when hour stepping crosses noon or midnight", async () => {
      fixture.componentRef.setInput("locale", "en-US");
      fixture.componentRef.setInput("luxonDateFormat", "MM/dd/yyyy hh:mm a");
      component.writeValue("2026-07-15T11:30:00");
      fixture.detectChanges();

      (
        fixture.nativeElement.querySelector(
          '[data-testid="datepicker-toggle"]',
        ) as HTMLButtonElement
      ).click();
      fixture.detectChanges();
      await fixture.whenStable();

      (
        document.querySelector(
          '[data-testid="datepicker-hour-increment"]',
        ) as HTMLButtonElement
      ).click();
      fixture.detectChanges();

      expect(component.selectedDate()?.hour).toBe(12);
      expect(
        (
          document.querySelector(
            '[data-testid="datepicker-meridiem-pm"]',
          ) as HTMLInputElement
        ).checked,
      ).toBeTruthy();
      expect(
        (
          fixture.nativeElement.querySelector(
            '[data-testid="datepicker-input"]',
          ) as HTMLInputElement
        ).value,
      ).toBe("07/15/2026 12:30 PM");

      component.writeValue("2026-07-15T23:30:00");
      fixture.detectChanges();

      (
        document.querySelector(
          '[data-testid="datepicker-hour-increment"]',
        ) as HTMLButtonElement
      ).click();
      fixture.detectChanges();

      expect(component.selectedDate()?.hour).toBe(0);
      expect(
        (
          document.querySelector(
            '[data-testid="datepicker-meridiem-am"]',
          ) as HTMLInputElement
        ).checked,
      ).toBeTruthy();
      expect(
        (
          fixture.nativeElement.querySelector(
            '[data-testid="datepicker-input"]',
          ) as HTMLInputElement
        ).value,
      ).toBe("07/16/2026 12:30 AM");
    });

    it("should synchronize AM/PM changes with the selected DateTime and formatted input", async () => {
      fixture.componentRef.setInput("locale", "en-US");
      fixture.componentRef.setInput("luxonDateFormat", "MM/dd/yyyy hh:mm a");
      component.writeValue("2026-07-15T10:30:00");
      fixture.detectChanges();

      (
        fixture.nativeElement.querySelector(
          '[data-testid="datepicker-toggle"]',
        ) as HTMLButtonElement
      ).click();
      fixture.detectChanges();
      await fixture.whenStable();

      const pm = document.querySelector(
        '[data-testid="datepicker-meridiem-pm"]',
      ) as HTMLInputElement;
      pm.click();
      fixture.detectChanges();

      expect(component.selectedDate()?.hour).toBe(22);
      expect(
        (
          fixture.nativeElement.querySelector(
            '[data-testid="datepicker-input"]',
          ) as HTMLInputElement
        ).value,
      ).toBe("07/15/2026 10:30 PM");
      expect(
        (
          document.querySelector(
            '[data-testid="datepicker-hour-input"]',
          ) as HTMLInputElement
        ).getAttribute("aria-valuetext"),
      ).toBe("10 PM");

      const am = document.querySelector(
        '[data-testid="datepicker-meridiem-am"]',
      ) as HTMLInputElement;
      am.click();
      fixture.detectChanges();

      expect(component.selectedDate()?.hour).toBe(10);
      expect(
        (
          fixture.nativeElement.querySelector(
            '[data-testid="datepicker-input"]',
          ) as HTMLInputElement
        ).value,
      ).toBe("07/15/2026 10:30 AM");
    });

    it("should hide seconds wheel by default", async () => {
      const button = fixture.nativeElement.querySelector(
        '[data-testid$="toggle"]',
      ) as HTMLButtonElement;
      button.click();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(
        document.querySelector("#" + (component as any).ids().secondSelect),
      ).toBeNull();
      expect(document.querySelectorAll(".datepicker-time-unit-control")).toHaveLength(
        2,
      );
    });

    it("should show the seconds wheel when the format contains seconds", async () => {
      fixture.componentRef.setInput(
        "luxonDateFormat",
        "dd.MM.yyyy HH:mm:ss 'Uhr'",
      );
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector(
        '[data-testid$="toggle"]',
      ) as HTMLButtonElement;
      button.click();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(
        document.querySelector("#" + (component as any).ids().secondSelect),
      ).toBeTruthy();
      expect(document.querySelectorAll(".datepicker-time-unit-control")).toHaveLength(
        3,
      );
    });

    it("should infer showSeconds from the Luxon format", () => {
      expect((component as any).dateFormat()).not.toContain(":ss");

      fixture.componentRef.setInput(
        "luxonDateFormat",
        "dd.MM.yyyy HH:mm:ss 'Uhr'",
      );
      fixture.detectChanges();
      expect((component as any).dateFormat()).toContain(":ss");
    });

    it("should normalize the selected value when the inferred mode changes", async () => {
      fixture.componentRef.setInput("luxonDateFormat", "dd.MM.yyyy HH:mm:ss");
      component.writeValue("2026-07-15T16:59:45.123");
      fixture.detectChanges();

      expect(component.selectedDate()?.second).toBe(45);

      fixture.componentRef.setInput("luxonDateFormat", "dd.MM.yyyy HH:mm");
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(component.selectedDate()?.second).toBe(0);
      expect(component.selectedDate()?.millisecond).toBe(0);

      fixture.componentRef.setInput("luxonDateFormat", "dd.MM.yyyy");
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(component.selectedDate()?.hour).toBe(0);
      expect(component.selectedDate()?.minute).toBe(0);
      expect(component.dateOnly()).toBeTruthy();
    });

    it("should include seconds in announcements when present in the format", () => {
      const testDate = DateTime.fromISO("2026-07-12T14:30:45");
      (component as any).selectedDate.set(testDate);

      (component as any).announceTime();
      expect((component as any).timeAnnouncement()).not.toContain("Sekunden");

      fixture.componentRef.setInput(
        "luxonDateFormat",
        "dd.MM.yyyy HH:mm:ss 'Uhr'",
      );
      fixture.detectChanges();
      (component as any).announceTime();
      expect((component as any).timeAnnouncement()).toContain("14:30:45");
    });

    it("should normalize seconds according to the Luxon format", () => {
      const testDate = "2026-07-12T14:30:45";
      component.writeValue(testDate);
      expect(component.selectedDate()?.second).toBe(0);

      fixture.componentRef.setInput(
        "luxonDateFormat",
        "dd.MM.yyyy HH:mm:ss 'Uhr'",
      );
      component.writeValue(testDate);
      expect(component.selectedDate()?.second).toBe(45);
    });
  });

  describe("today input", () => {
    it("should use the provided today input for highlights", () => {
      const specificToday = DateTime.fromISO("2026-07-20"); // A Monday (weekday 1)
      fixture.componentRef.setInput("today", specificToday);
      fixture.detectChanges();

      // Check isCurrentWeekday (Monday is weekday 1)
      expect((component as any).isCurrentWeekday(1)).toBeTruthy();
      expect((component as any).isCurrentWeekday(2)).toBeFalsy();

      // Check isToday
      expect(component.isToday(specificToday)).toBeTruthy();
      expect(component.isToday(specificToday.plus({ days: 1 }))).toBeFalsy();

      // Check isCurrentWeek
      component.writeValue("2026-07-20");
      fixture.detectChanges();

      const weekWithToday = component
        .grid()
        .find((w) => w.days.some((d) => d?.hasSame(specificToday, "day")));
      expect(weekWithToday).toBeTruthy();
      expect((component as any).isCurrentWeek(weekWithToday!)).toBeTruthy();

      const otherWeek = component
        .grid()
        .find((w) => !w.days.some((d) => d?.hasSame(specificToday, "day")));
      if (otherWeek) {
        expect((component as any).isCurrentWeek(otherWeek)).toBeFalsy();
      }
    });

    it("should reflect the provided today input in the template classes", async () => {
      const specificToday = DateTime.fromISO("2026-07-20"); // Monday
      fixture.componentRef.setInput("today", specificToday);
      component.writeValue("2026-07-20");
      (component as any).isOpen.set(true);
      fixture.detectChanges();
      await fixture.whenStable();

      const weekdayHeaders = document.querySelectorAll(".datepicker-day-name");
      // Index 0 is KW, Index 1 is Monday
      expect(weekdayHeaders[1].classList.contains("today")).toBeTruthy();
      expect(weekdayHeaders[2].classList.contains("today")).toBeFalsy();

      const todayButton = document.querySelector(
        `.datepicker-day[data-date="2026-07-20"]`,
      );
      expect(todayButton?.classList.contains("today")).toBeTruthy();

      const weekRow = todayButton?.closest(".datepicker-week");
      const kwCell = weekRow?.querySelector(".datepicker-kw-value");
      expect(kwCell?.classList.contains("today")).toBeTruthy();
    });

    it("should NOT highlight the weekday header if viewing a different month", async () => {
      const specificToday = DateTime.fromISO("2026-07-20"); // Monday
      fixture.componentRef.setInput("today", specificToday);

      // View June 2026 instead of July 2026
      component.writeValue("2026-06-15");
      (component as any).isOpen.set(true);
      fixture.detectChanges();
      await fixture.whenStable();

      const weekdayHeaders = document.querySelectorAll(".datepicker-day-name");
      // Index 1 is Monday. It should NOT have 'today' class because we are in June.
      expect(weekdayHeaders[1].classList.contains("today")).toBeFalsy();
    });
  });

  describe("additional verification for time and copy-paste", () => {
    it("should update selectedDate when a day is clicked in the grid", async () => {
      component.writeValue("2026-07-15T10:30:00");
      const toggle = fixture.nativeElement.querySelector(
        '[data-testid="datepicker-toggle"]',
      ) as HTMLButtonElement;
      toggle.click();
      fixture.detectChanges();
      await fixture.whenStable();

      const targetDay = document.querySelector(
        '[data-testid="datepicker-day-2026-07-20"]',
      ) as HTMLButtonElement;
      expect(targetDay).toBeTruthy();
      targetDay.click();
      fixture.detectChanges();

      expect(component.selectedDate()?.toISODate()).toBe("2026-07-20");
      expect(component.selectedDate()?.hour).toBe(10);
      expect(component.selectedDate()?.minute).toBe(30);
    });

    it("should update selectedDate when time adjustment buttons are clicked", async () => {
      fixture.componentRef.setInput("showQuickTimeControls", true);
      component.writeValue("2026-07-15T10:30:00");
      const toggle = fixture.nativeElement.querySelector(
        '[data-testid="datepicker-toggle"]',
      ) as HTMLButtonElement;
      toggle.click();
      fixture.detectChanges();
      await fixture.whenStable();

      const add15Mins = document.querySelector(
        '[data-testid="datepicker-add-15-mins"]',
      ) as HTMLButtonElement;
      expect(add15Mins).toBeTruthy();
      add15Mins.click();
      fixture.detectChanges();

      expect(component.selectedDate()?.minute).toBe(45);

      const subtract6Hrs = document.querySelector(
        '[data-testid="datepicker-subtract-6-hrs"]',
      ) as HTMLButtonElement;
      expect(subtract6Hrs).toBeTruthy();
      subtract6Hrs.click();
      fixture.detectChanges();

      expect(component.selectedDate()?.hour).toBe(4);
    });

    it("should update selectedDate when time wheel buttons are clicked", async () => {
      component.writeValue("2026-07-15T10:30:00");
      const toggle = fixture.nativeElement.querySelector(
        '[data-testid="datepicker-toggle"]',
      ) as HTMLButtonElement;
      toggle.click();
      fixture.detectChanges();
      await fixture.whenStable();

      const hourIncrement = document.querySelector(
        '[data-testid="datepicker-hour-increment"]',
      ) as HTMLButtonElement;
      expect(hourIncrement).toBeTruthy();
      hourIncrement.click();
      fixture.detectChanges();

      expect(component.selectedDate()?.hour).toBe(11);

      const minuteDecrement = document.querySelector(
        '[data-testid="datepicker-minute-decrement"]',
      ) as HTMLButtonElement;
      expect(minuteDecrement).toBeTruthy();
      minuteDecrement.click();
      fixture.detectChanges();

      expect(component.selectedDate()?.minute).toBe(29);
    });

    it("should display the invalid character in the input before showing the error", async () => {
      const input = fixture.nativeElement.querySelector(
        '[data-testid="datepicker-input"]',
      ) as HTMLInputElement;

      input.value = "15a";
      input.dispatchEvent(new Event("input"));
      fixture.detectChanges();

      expect(input.value).toBe("15a");
      const error = fixture.nativeElement.querySelector(
        '[data-testid="datepicker-error"]',
      );
      expect(error).toBeTruthy();
    });

    it("should display unexpected trailing input before showing the error", async () => {
      const input = fixture.nativeElement.querySelector(
        '[data-testid="datepicker-input"]',
      ) as HTMLInputElement;

      input.value = "15.07.2026 10:00 extra";
      input.dispatchEvent(new Event("input"));
      fixture.detectChanges();

      expect(input.value).toBe("15.07.2026 10:00 extra");
      const error = fixture.nativeElement.querySelector(
        '[data-testid="datepicker-error"]',
      );
      expect(error).toBeTruthy();
    });

    it("should work when copy-pasting a full date string", async () => {
      const input = fixture.nativeElement.querySelector(
        '[data-testid="datepicker-input"]',
      ) as HTMLInputElement;

      const pastedValue = "20.12.2025 14:45";
      dispatchPaste(input, pastedValue);
      fixture.detectChanges();

      expect(input.value).toContain("20.12.2025");
      expect(input.value).toContain("14:45");
      expect(component.selectedDate()?.day).toBe(20);
      expect(component.selectedDate()?.month).toBe(12);
      expect(component.selectedDate()?.year).toBe(2025);
      expect(component.selectedDate()?.hour).toBe(14);
      expect(component.selectedDate()?.minute).toBe(45);
    });
  });

  describe("showQuickTimeControls", () => {
    it("should be false by default", () => {
      expect(component.showQuickTimeControls()).toBeFalsy();
    });

    it("should hide quick-time controls by default", async () => {
      component.writeValue("2026-07-15T10:30:00");
      const toggle = fixture.nativeElement.querySelector(
        '[data-testid="datepicker-toggle"]',
      ) as HTMLButtonElement;
      toggle.click();
      fixture.detectChanges();
      await fixture.whenStable();

      const adjustments = document.querySelector(
        '[data-testid="datepicker-time-adjustments"]',
      );
      expect(adjustments).toBeNull();
    });

    it("should show quick-time controls when enabled", async () => {
      fixture.componentRef.setInput("showQuickTimeControls", true);
      component.writeValue("2026-07-15T10:30:00");
      const toggle = fixture.nativeElement.querySelector(
        '[data-testid="datepicker-toggle"]',
      ) as HTMLButtonElement;
      toggle.click();
      fixture.detectChanges();
      await fixture.whenStable();

      const adjustments = document.querySelector(
        '[data-testid="datepicker-time-adjustments"]',
      );
      expect(adjustments).not.toBeNull();
    });
  });
});

@Component({
  standalone: true,
  imports: [DatepickerComponent, ReactiveFormsModule, FormsModule],
  template: `
    <datepicker
      id="reactive"
      testId="reactive-datepicker"
      [formControl]="control"
    />
    <datepicker
      id="template"
      testId="template-datepicker"
      [(ngModel)]="templateValue"
    />
    <datepicker
      id="signal"
      testId="signal-datepicker"
      [(value)]="signalValue"
    />
  `,
})
class TestHostComponent {
  control = new FormControl<Date | string | null>(null);
  templateValue: Date | string | null = null;
  signalValue = signal<Date | string | null>(null);
}

describe("DatepickerComponent Forms Compatibility", () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should work with Reactive Forms", async () => {
    const testDate = "2026-07-12T10:00:00.000Z";
    host.control.setValue(testDate);
    fixture.detectChanges();
    await fixture.whenStable();

    const input = fixture.nativeElement.querySelector(
      "#reactive input",
    ) as HTMLInputElement;
    expect(input.value).toContain("12.07.2026");
  });

  it("should work with Template-driven Forms", async () => {
    host.templateValue = '2026-07-13T10:00:00.000Z';
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector(
      "#template input",
    ) as HTMLInputElement;
    expect(input.value).toContain("13.07.2026");
  });

  it("should work with Signal-based (model) binding", async () => {
    const testDate = "2026-07-14T10:00:00.000Z";
    host.signalValue.set(testDate);
    fixture.detectChanges();
    await fixture.whenStable();

    const input = fixture.nativeElement.querySelector(
      "#signal input",
    ) as HTMLInputElement;
    expect(input.value).toContain("14.07.2026");
  });

  it("should validate invalid dates", async () => {
    host.control.setValue("invalid-date");
    fixture.detectChanges();
    await fixture.whenStable();
    expect(host.control.invalid).toBeTruthy();
    expect(host.control.errors?.["invalidDate"]).toBeTruthy();
  });

  it("should call onTouched on blur", async () => {
    const input = fixture.nativeElement.querySelector(
      "#reactive input",
    ) as HTMLInputElement;

    expect(host.control.touched).toBeFalsy();
    input.dispatchEvent(new Event("blur"));
    fixture.detectChanges();
    expect(host.control.touched).toBeTruthy();
  });

  it("should propagate changes from internal signal to value model", async () => {
    const datepickerElement = fixture.nativeElement.querySelector("#signal");

    const button = datepickerElement.querySelector(
      '[data-testid$="toggle"]',
    ) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const dayButton = document.querySelector(
      '.datepicker-day[data-date="2026-07-14"]',
    ) as HTMLButtonElement;
    expect(dayButton).toBeTruthy();
    dayButton.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(host.signalValue() instanceof Date).toBeTruthy();
    expect(DateTime.fromJSDate(host.signalValue() as Date).toISODate()).toBe(
      "2026-07-14",
    );
  });
});
