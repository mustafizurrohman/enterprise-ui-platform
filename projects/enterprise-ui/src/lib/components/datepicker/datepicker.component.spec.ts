import { describe, it, expect, vi, beforeEach } from "vitest";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DatepickerComponent } from "./datepicker.component";
import { DateTime, Info } from "luxon";
import { Component, signal } from "@angular/core";
import { FormControl, FormsModule, ReactiveFormsModule } from "@angular/forms";

describe("DatepickerComponent", () => {
  let component: DatepickerComponent;
  let fixture: ComponentFixture<DatepickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatepickerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DatepickerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("testId", "datepicker");
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
      expect(
        document.querySelector('[data-testid="datepicker-confirm"]'),
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
      expect(
        document.querySelector('[data-testid="your-id-confirm"]'),
      ).toBeTruthy();
    });
  });

  describe("dateOnly", () => {
    it("should transform an attribute-style value to true", () => {
      fixture.componentRef.setInput("dateOnly", "");
      fixture.detectChanges();

      expect(component.dateOnly()).toBeTruthy();
    });

    it("should hide time selection and use the date-only format", async () => {
      fixture.componentRef.setInput("dateOnly", true);
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
      expect(document.querySelector(".datepicker-confirm")).toBeTruthy();
    });

    it("should emit the selected date at the start of the day", () => {
      fixture.componentRef.setInput("dateOnly", true);
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

    const button = fixture.nativeElement.querySelector(".datepicker-icon");
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
      expect(component.daysOfWeek.map((day) => day.long)).toEqual(
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

  it("should select now and close the calendar when Jetzt is clicked", async () => {
    fixture.componentRef.setInput("showSeconds", true);
    const onChangeSpy = vi.fn();
    component.registerOnChange(onChangeSpy);
    const button = fixture.nativeElement.querySelector(".datepicker-icon");
    button.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const jetztButton = document.querySelector(
      ".datepicker-now",
    ) as HTMLButtonElement;
    expect(jetztButton).toBeTruthy();
    expect(jetztButton.textContent?.trim()).toBe("Jetzt");

    const before = DateTime.now();
    jetztButton.click();
    fixture.detectChanges();
    const after = DateTime.now();

    expect(component.selectedDate()).toBeTruthy();
    const selectedDate = component.selectedDate()!;
    // Should be between before and after
    expect(selectedDate.toMillis()).toBeGreaterThanOrEqual(
      before.toMillis() - 1000,
    ); // Tolerance for slight delays
    expect(selectedDate.toMillis()).toBeLessThanOrEqual(
      after.toMillis() + 1000,
    );

    expect(onChangeSpy).toHaveBeenCalled();
    expect((component as any).isOpen()).toBeFalsy();
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

  it("should render correct previous and next time values", async () => {
    component.writeValue("2026-07-12T10:30:00");
    const toggle = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-toggle"]',
    ) as HTMLButtonElement;
    toggle.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const previews = (): HTMLElement[] =>
      Array.from(
        document.querySelectorAll<HTMLElement>(
          "time-wheel:first-of-type .datepicker-time-preview",
        ),
      );

    expect(previews().map((element) => element.textContent?.trim())).toEqual([
      "11",
      "09",
    ]);

    (component as any).updateTime("hour", 0);
    fixture.detectChanges();
    expect(previews()[0].textContent?.trim()).toBe("01");
    expect(previews()[1].textContent?.trim()).toBe("23");

    (component as any).updateTime("hour", 23);
    fixture.detectChanges();
    expect(previews()[0].textContent?.trim()).toBe("00");
    expect(previews()[1].textContent?.trim()).toBe("22");
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

  describe("Manual Input", () => {
    it("should allow entering date manually", () => {
      fixture.componentRef.setInput("showSeconds", true);
      const input = fixture.nativeElement.querySelector("input") as HTMLInputElement;
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
      fixture.componentRef.setInput("dateOnly", true);
      const input = fixture.nativeElement.querySelector("input") as HTMLInputElement;

      input.value = "31.02.2026";
      input.dispatchEvent(new Event("input"));
      fixture.detectChanges();

      expect(input.value).toBe("31.02.2026");
      expect(component.selectedDate()).toBeNull();
      expect(input.getAttribute("aria-invalid")).toBe("true");
      expect(
        fixture.nativeElement.querySelector('[data-testid="datepicker-error"]'),
      ).toBeTruthy();
    });

    it("should proactively append separators and pad an unambiguous month", () => {
      fixture.componentRef.setInput("dateFormat", "MM-dd-yyyy");
      const input = fixture.nativeElement.querySelector("input") as HTMLInputElement;

      input.value = "3";
      input.dispatchEvent(new Event("input"));
      fixture.detectChanges();

      expect(input.value).toBe("03-");
    });

    it("should append the separator when a day segment is submitted", () => {
      fixture.componentRef.setInput("dateFormat", "dd-MM-yyyy");
      const input = fixture.nativeElement.querySelector("input") as HTMLInputElement;

      input.value = "3";
      input.dispatchEvent(new Event("blur"));
      fixture.detectChanges();

      expect(input.value).toBe("03-");
    });

    it("should support a year-first Luxon format and proactively append separators", () => {
      fixture.componentRef.setInput("dateFormat", "yyyy-MM-dd");
      const input = fixture.nativeElement.querySelector("input") as HTMLInputElement;

      input.value = "20263";
      input.dispatchEvent(new Event("input"));
      fixture.detectChanges();

      expect(input.value).toBe("2026-03-");
    });

    it("should NOT open calendar on enter and should commit the current input", () => {
      fixture.componentRef.setInput("showSeconds", true);
      const input = fixture.nativeElement.querySelector("input") as HTMLInputElement;
      const testDateStr = "24.12.2023 18:00:00 Uhr";
      input.value = testDateStr;
      input.dispatchEvent(new Event("input"));
      input.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      );
      fixture.detectChanges();

      expect((component as any).isOpen()).toBeFalsy();
      expect(component.selectedDate()?.toISODate()).toBe("2023-12-24");
    });

    it("should allow deleting the separator via backspace", () => {
      fixture.componentRef.setInput("dateFormat", "dd.MM.yyyy");
      const input = fixture.nativeElement.querySelector("input") as HTMLInputElement;

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

    it("should follow the complete backspace example sequence from the issue description", () => {
      const input = fixture.nativeElement.querySelector(
        "input",
      ) as HTMLInputElement;

      const steps = [
        { input: "15.09.2026 20:26 Uh", expected: "15.09.2026 20:26 Uh" },
        { input: "15.09.2026 20:26 U", expected: "15.09.2026 20:26 U" },
        { input: "15.09.2026 20:26 ", expected: "15.09.2026 20:26 " },
        { input: "15.09.2026 20:26", expected: "15.09.2026 20:26" },
        { input: "15.09.2026 20:2", expected: "15.09.2026 20:2" },
        { input: "15.09.2026 20:", expected: "15.09.2026 20:" },
        { input: "15.09.2026 20", expected: "15.09.2026 20" },
        { input: "15.09.2026 2", expected: "15.09.2026 2" },
        { input: "15.09.2026 ", expected: "15.09.2026 " },
        { input: "15.09.2026", expected: "15.09.2026" },
        { input: "15.09.202", expected: "15.09.202" },
        { input: "15.09.20", expected: "15.09.20" },
        { input: "15.09.2", expected: "15.09.2" },
        { input: "15.09.", expected: "15.09." },
        { input: "15.09", expected: "15.09" },
        { input: "15.0", expected: "15.0" },
        { input: "15.", expected: "15." },
        { input: "15", expected: "15" },
        { input: "1", expected: "1" },
      ];

      // Initialize
      input.value = "15.09.2026 20:26 Uhr";
      input.dispatchEvent(new Event("input"));
      fixture.detectChanges();

      for (const step of steps) {
        input.value = step.input;
        input.dispatchEvent(new Event("input"));
        fixture.detectChanges();
        expect(input.value).toBe(step.expected);
      }
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
      fixture.componentRef.setInput("dateOnly", true);
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
  });

  it("should have correct accessibility attributes", () => {
    const label = fixture.nativeElement.querySelector(".datepicker-label");
    const input = fixture.nativeElement.querySelector("input");
    const button = fixture.nativeElement.querySelector(".datepicker-icon");

    expect(label.textContent).toContain(component.label());
    expect(label.getAttribute("for")).toBe(input.id);
    expect(input.getAttribute("role")).toBe("combobox");
    expect(input.getAttribute("aria-autocomplete")).toBe("none");
    expect(input.getAttribute("aria-haspopup")).toBe("dialog");
    expect(input.getAttribute("aria-invalid")).toBe("false");
    expect(button.getAttribute("aria-label")).toContain("Kalender");
    expect(button.getAttribute("aria-haspopup")).toBe("dialog");

    const icon = button.querySelector("mat-icon");
    expect(icon.getAttribute("aria-hidden")).toBe("true");
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
    const button = fixture.nativeElement.querySelector(".datepicker-icon");
    button.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const dialog = document.querySelector(".datepicker-calendar");
    expect(dialog).toBeTruthy();
    expect(dialog?.getAttribute("role")).toBe("dialog");
    expect(dialog?.getAttribute("aria-modal")).toBe("true");
    expect(dialog?.hasAttribute("cdktrapfocus")).toBeTruthy();

    const title = document.getElementById(
      dialog?.getAttribute("aria-labelledby") || "",
    );
    expect(title?.classList.contains("visually-hidden")).toBeTruthy();
  });

  it("should navigate calendar with keyboard", async () => {
    const button = fixture.nativeElement.querySelector(".datepicker-icon");
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
        expect(onChangeSpy).toHaveBeenCalledWith(
          expect.any(Date),
        );
        expect((onChangeSpy.mock.calls[0][0] as Date).toISOString()).toContain("2026-07-20");
        expect(
          document.querySelector('[data-testid="datepicker-date-status"]')
            ?.textContent,
        ).toContain("ausgewählt");
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
    const button = fixture.nativeElement.querySelector(".datepicker-icon");
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
    const button = fixture.nativeElement.querySelector(".datepicker-icon");
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
    const button = fixture.nativeElement.querySelector(".datepicker-icon");
    button.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const incrementButton = document.querySelector(
      '[aria-label="Stunde um eins erhöhen"]',
    ) as HTMLButtonElement;
    incrementButton.click();
    fixture.detectChanges();

    expect((component as any).timeAnnouncement()).toContain("Uhrzeit");
    expect((component as any).timeAnnouncement()).toMatch(/Uhrzeit \d{2} Uhr/);
  });

  describe("disabled", () => {
    it("should disable the input and icon button when disabled is true", () => {
      fixture.componentRef.setInput("disabled", true);
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector(
        "input",
      ) as HTMLInputElement;
      const button = fixture.nativeElement.querySelector(
        ".datepicker-icon",
      ) as HTMLButtonElement;

      expect(input.disabled).toBeTruthy();
      expect(button.disabled).toBeTruthy();
      expect(
        button.classList.contains("datepicker-icon--disabled"),
      ).toBeTruthy();
      expect(button.querySelector("mat-icon")).toBeTruthy();
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
        ".datepicker-icon",
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

  describe("showSeconds", () => {
    it("should be false by default", () => {
      expect(component.showSeconds()).toBeFalsy();
    });

    it("should hide seconds wheel by default", async () => {
      const button = fixture.nativeElement.querySelector(".datepicker-icon");
      button.click();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(
        document.querySelector("#" + (component as any).ids().secondSelect),
      ).toBeNull();
      expect(
        document.querySelectorAll(".datepicker-time-wheel"),
      ).toHaveLength(2);
    });

    it("should show seconds wheel when showSeconds is true", async () => {
      fixture.componentRef.setInput("showSeconds", true);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector(".datepicker-icon");
      button.click();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(
        document.querySelector("#" + (component as any).ids().secondSelect),
      ).toBeTruthy();
      expect(
        document.querySelectorAll(".datepicker-time-wheel"),
      ).toHaveLength(3);
    });

    it("should adjust dateFormat when showSeconds is toggled", () => {
      expect((component as any).dateFormat()).not.toContain(":ss");

      fixture.componentRef.setInput("showSeconds", true);
      fixture.detectChanges();
      expect((component as any).dateFormat()).toContain(":ss");
    });

    it("should adjust announceTime when showSeconds is true", () => {
      const testDate = DateTime.fromISO("2026-07-12T14:30:45");
      (component as any).selectedDate.set(testDate);

      (component as any).announceTime();
      expect((component as any).timeAnnouncement()).not.toContain("Sekunden");

      fixture.componentRef.setInput("showSeconds", true);
      fixture.detectChanges();
      (component as any).announceTime();
      expect((component as any).timeAnnouncement()).toContain("45 Sekunden");
    });

    it("should strip seconds in writeValue when showSeconds is false", () => {
      const testDate = "2026-07-12T14:30:45";
      component.writeValue(testDate);
      expect(component.selectedDate()?.second).toBe(0);

      fixture.componentRef.setInput("showSeconds", true);
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

      const weekdayHeaders = document.querySelectorAll(
        ".datepicker-day-name",
      );
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

      const weekdayHeaders = document.querySelectorAll(
        ".datepicker-day-name",
      );
      // Index 1 is Monday. It should NOT have 'today' class because we are in June.
      expect(weekdayHeaders[1].classList.contains("today")).toBeFalsy();
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
    const testDate = "2026-07-13T10:00:00.000Z";
    host.templateValue = testDate;
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
      ".datepicker-icon",
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
    expect(DateTime.fromJSDate(host.signalValue() as Date).toISODate()).toBe("2026-07-14");
  });
});
