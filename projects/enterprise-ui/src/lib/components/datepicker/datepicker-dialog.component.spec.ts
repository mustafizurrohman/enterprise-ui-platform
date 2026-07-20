import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { DateTime, Info } from "luxon";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DatepickerDialogComponent } from "./datepicker-dialog.component";
import { type DatepickerDialogContext } from "./datepicker-dialog.types";

describe("DatepickerDialogComponent", () => {
  let fixture: ComponentFixture<DatepickerDialogComponent>;
  let component: DatepickerDialogComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatepickerDialogComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(DatepickerDialogComponent);
    component = fixture.componentInstance;

    const date = DateTime.fromISO("2026-07-15");
    const context: DatepickerDialogContext = {
      dialogId: "dialog",
      dialogTitleId: "dialog-title",
      dialogDescriptionId: "dialog-description",
      monthHeadingId: "month-heading",
      hourSelectId: "hour",
      minuteSelectId: "minute",
      secondSelectId: "second",
      hourLabelId: "hour-label",
      minuteLabelId: "minute-label",
      secondLabelId: "second-label",
      meridiemGroupId: "meridiem",
      meridiemLabelId: "meridiem-label",
      meridiemAmId: "meridiem-am",
      meridiemPmId: "meridiem-pm",
      dialogTitle: "Datum und Uhrzeit auswählen",
      formattedMonth: "Juli 2026",
      months: Info.months("long", { locale: "de" }),
      daysOfWeek: Info.weekdays("short", { locale: "de" }).map(
        (short, index) => ({
          short,
          long: Info.weekdays("long", { locale: "de" })[index] ?? short,
          weekday: index + 1,
        }),
      ),
      weeks: [
        {
          weekNumber: 29,
          days: [
            DateTime.fromISO("2026-07-13"),
            DateTime.fromISO("2026-07-14"),
            date,
            DateTime.fromISO("2026-07-16"),
            DateTime.fromISO("2026-07-17"),
            DateTime.fromISO("2026-07-18"),
            DateTime.fromISO("2026-07-19"),
          ],
        },
      ],
      selectedDate: date,
      activeDate: date,
      today: date,
      viewDate: date,
      testIdPrefix: "datepicker",
      dateOnly: false,
      showSeconds: false,
      uses12HourClock: false,
      showMeridiem: false,
      locale: "de-DE",
      dateAnnouncement: "",
      timeAnnouncement: "",
      showQuickTimeControls: false,
    };

    fixture.componentRef.setInput("context", context);
    fixture.detectChanges();
  });

  it("should preserve dialog semantics and connect navigation to the grid", () => {
    const dialog = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-dialog"]',
    ) as HTMLElement;
    const grid = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-calendar-grid"]',
    ) as HTMLElement;
    const previous = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-previous-month"]',
    ) as HTMLButtonElement;

    expect(dialog.getAttribute("role")).toBe("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(previous.getAttribute("aria-controls")).toBe(grid.id);
  });

  it("should label the grid with only the announced month and year", () => {
    const grid = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-calendar-grid"]',
    ) as HTMLElement;
    const monthHeading = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-month-heading"]',
    ) as HTMLElement;
    const header = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-header"]',
    ) as HTMLElement;

    expect(header.id).toBe("dialog-header");
    expect(monthHeading.id).toBe("month-heading");
    expect(monthHeading.getAttribute("role")).toBe("status");
    expect(monthHeading.getAttribute("aria-live")).toBe("polite");
    expect(monthHeading.textContent?.trim()).toBe("Juli 2026");
    expect(grid.getAttribute("aria-labelledby")).toBe(monthHeading.id);
  });

  it("should expose unique stable IDs for interactive controls", () => {
    const elements = Array.from(
      fixture.nativeElement.querySelectorAll("[id]") as NodeListOf<HTMLElement>,
    );
    const ids = elements.map((element) => element.id);
    const grid = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-calendar-grid"]',
    ) as HTMLElement;

    expect(new Set(ids).size).toBe(ids.length);

    for (const testId of [
      "previous-month",
      "month-select",
      "month-reset",
      "next-month",
      "previous-year",
      "year-display",
      "year-reset",
      "next-year",
    ]) {
      const control = fixture.nativeElement.querySelector(
        `[data-testid="datepicker-${testId}"]`,
      ) as HTMLElement;

      expect(control.id).toBeTruthy();
      expect(control.getAttribute("aria-controls")).toBe(grid.id);
    }
  });

  it("should forward navigation and time changes", () => {
    const previousSpy = vi.fn();
    const timeSpy = vi.fn();
    const adjustSpy = vi.fn();
    component.previousMonth.subscribe(previousSpy);
    component.timeChanged.subscribe(timeSpy);
    component.timeAdjusted.subscribe(adjustSpy);

    (
      fixture.nativeElement.querySelector(
        '[data-testid="datepicker-previous-month"]',
      ) as HTMLButtonElement
    ).click();
    (
      fixture.nativeElement.querySelector(
        '[data-testid="datepicker-hour-increment"]',
      ) as HTMLButtonElement
    ).click();

    expect(previousSpy).toHaveBeenCalledOnce();
    expect(adjustSpy).toHaveBeenCalledWith({ hours: 1 });
  });

  it("should forward year navigation events", () => {
    const prevYearSpy = vi.fn();
    const nextYearSpy = vi.fn();
    component.previousYear.subscribe(prevYearSpy);
    component.nextYear.subscribe(nextYearSpy);

    const prevButton = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-previous-year"]',
    ) as HTMLButtonElement;
    const nextButton = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-next-year"]',
    ) as HTMLButtonElement;

    prevButton.click();
    nextButton.click();

    expect(prevYearSpy).toHaveBeenCalledOnce();
    expect(nextYearSpy).toHaveBeenCalledOnce();
    expect(prevButton.getAttribute("aria-keyshortcuts")).toBe("Shift+PageUp");
    expect(nextButton.getAttribute("aria-keyshortcuts")).toBe("Shift+PageDown");
  });

  it("should indicate the currently selected month", () => {
    const select = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-month-select"]',
    ) as HTMLSelectElement;

    expect(select.value).toBe("7");
    expect(select.selectedOptions[0]?.textContent?.trim()).toBe(
      Info.months("short", { locale: "de" })[6],
    );
    expect(select.options).toHaveLength(12);
  });

  it("should show month numbers on open (click/keyboard) and hide them on blur or change", () => {
    const select = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-month-select"]',
    ) as HTMLSelectElement;
    const julyOption = select.options[6];
    const shortJuly = Info.months("short", { locale: "de" })[6];

    expect(julyOption.textContent?.trim()).toBe(shortJuly);

    // Focus alone should not show numbers
    select.dispatchEvent(new Event("focus"));
    fixture.detectChanges();
    expect(julyOption.textContent?.trim()).toBe(shortJuly);

    // Mousedown (click) should show numbers
    select.dispatchEvent(new MouseEvent("mousedown"));
    fixture.detectChanges();
    expect(julyOption.textContent?.trim()).toBe(`${shortJuly} (07)`);

    select.dispatchEvent(new Event("blur"));
    fixture.detectChanges();
    expect(julyOption.textContent?.trim()).toBe(shortJuly);

    // Keyboard (Space) should show numbers
    select.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
    fixture.detectChanges();
    expect(julyOption.textContent?.trim()).toBe(`${shortJuly} (07)`);

    select.value = "5";
    select.dispatchEvent(new Event("change"));
    fixture.detectChanges();
    expect(julyOption.textContent?.trim()).toBe(shortJuly);
  });

  it("should expose stable IDs and test IDs for month options", () => {
    const option = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-month-option-7"]',
    ) as HTMLOptionElement;

    expect(option.id).toBe("dialog-month-option-7");
    expect(option.value).toBe("7");
    expect(option.selected).toBeTruthy();
  });

  it("should forward month selection event", () => {
    const monthSpy = vi.fn();
    component.monthSelected.subscribe(monthSpy);

    const select = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-month-select"]',
    ) as HTMLSelectElement;

    select.value = "5";
    select.dispatchEvent(new Event("change"));
    fixture.detectChanges();

    expect(monthSpy).toHaveBeenCalledWith(5);
  });

  it("should accept and retain custom year entry", () => {
    const yearSpy = vi.fn();
    component.yearSelected.subscribe(yearSpy);

    const input = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-year-display"]',
    ) as HTMLInputElement;

    input.value = "2099";
    input.dispatchEvent(new Event("input"));
    input.dispatchEvent(new Event("blur"));
    fixture.detectChanges();

    expect(yearSpy).toHaveBeenCalledWith(2099);
    expect(input.value).toBe("2099");
  });
  it("should present month and year as balanced navigation groups", () => {
    const header = fixture.nativeElement.querySelector(
      ".datepicker-header",
    ) as HTMLElement;
    const navigationGroups = header.querySelectorAll(
      ".datepicker-navigation-group",
    );
    const periodControls = header.querySelectorAll(
      ".datepicker-period-control",
    );
    const divider = header.querySelector(
      ".datepicker-navigation-divider",
    ) as HTMLElement;

    expect(navigationGroups).toHaveLength(2);
    expect(periodControls).toHaveLength(2);
    expect(divider).toBeTruthy();
    expect(divider.getAttribute("aria-hidden")).toBe("true");
  });

  it("should remove year autocomplete and restrict the input to four digits", () => {
    const yearSpy = vi.fn();
    component.yearSelected.subscribe(yearSpy);

    const input = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-year-display"]',
    ) as HTMLInputElement;

    expect(input.getAttribute("maxlength")).toBe("4");
    expect(input.getAttribute("pattern")).toBe("[0-9]{4}");
    expect(input.getAttribute("aria-autocomplete")).toBeNull();

    input.value = "20a267";
    input.dispatchEvent(new Event("input"));
    expect(input.value).toBe("2026");

    input.dispatchEvent(new Event("blur"));
    expect(yearSpy).toHaveBeenCalledWith(2026);
  });

  it("should restore the current year when fewer than four digits are entered", () => {
    const yearSpy = vi.fn();
    component.yearSelected.subscribe(yearSpy);

    const input = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-year-display"]',
    ) as HTMLInputElement;

    input.value = "999";
    input.dispatchEvent(new Event("input"));
    input.dispatchEvent(new Event("blur"));
    fixture.detectChanges();

    expect(yearSpy).not.toHaveBeenCalled();
    expect(input.value).toBe("2026");
  });

  it("should integrate each current-period action with its value control", () => {
    const monthPeriodControl = fixture.nativeElement.querySelector(
      ".datepicker-period-control--month",
    ) as HTMLElement;
    const yearPeriodControl = fixture.nativeElement.querySelector(
      ".datepicker-period-control--year",
    ) as HTMLElement;

    expect(
      monthPeriodControl.querySelector(
        '[data-testid="datepicker-month-select"]',
      ),
    ).toBeTruthy();
    expect(
      monthPeriodControl.querySelector(
        '[data-testid="datepicker-month-reset"]',
      ),
    ).toBeTruthy();
    expect(
      yearPeriodControl.querySelector(
        '[data-testid="datepicker-year-display"]',
      ),
    ).toBeTruthy();
    expect(
      yearPeriodControl.querySelector('[data-testid="datepicker-year-reset"]'),
    ).toBeTruthy();
  });

  it("should group month and year navigation with their related controls", () => {
    const monthGroup = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-month-navigation"]',
    ) as HTMLElement;
    const yearGroup = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-year-navigation"]',
    ) as HTMLElement;

    const monthControls = monthGroup.querySelector(
      ".datepicker-navigation-controls",
    )!;
    expect(
      monthControls.querySelector('[data-testid="datepicker-previous-month"]'),
    ).toBeTruthy();
    expect(
      monthControls.querySelector('[data-testid="datepicker-month-select"]'),
    ).toBeTruthy();
    expect(
      monthControls.querySelector('[data-testid="datepicker-month-reset"]'),
    ).toBeTruthy();
    expect(
      monthControls.querySelector('[data-testid="datepicker-next-month"]'),
    ).toBeTruthy();

    const yearControls = yearGroup.querySelector(
      ".datepicker-navigation-controls",
    )!;
    expect(
      yearControls.querySelector('[data-testid="datepicker-previous-year"]'),
    ).toBeTruthy();
    expect(
      yearControls.querySelector('[data-testid="datepicker-year-display"]'),
    ).toBeTruthy();
    expect(
      yearControls.querySelector('[data-testid="datepicker-year-reset"]'),
    ).toBeTruthy();
    expect(
      yearControls.querySelector('[data-testid="datepicker-next-year"]'),
    ).toBeTruthy();
  });

  it("should navigate to current month and year when reset buttons are clicked", () => {
    const monthSpy = vi.fn();
    const yearSpy = vi.fn();
    component.monthSelected.subscribe(monthSpy);
    component.yearSelected.subscribe(yearSpy);

    const monthReset = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-month-reset"]',
    ) as HTMLButtonElement;
    const yearReset = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-year-reset"]',
    ) as HTMLButtonElement;

    expect(monthReset).toBeTruthy();
    expect(yearReset).toBeTruthy();

    monthReset.click();
    yearReset.click();

    expect(monthSpy).toHaveBeenCalledWith(component.context().today.month);
    expect(yearSpy).toHaveBeenCalledWith(component.context().today.year);
  });

  it("should provide explicit labels and control relationships for time actions", () => {
    fixture.componentRef.setInput("context", {
      ...component.context(),
      showQuickTimeControls: true,
    });
    fixture.detectChanges();

    const fieldset = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-time-picker"]',
    ) as HTMLFieldSetElement;
    const legend = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-time-picker-legend"]',
    ) as HTMLElement;
    const instructions = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-time-instructions"]',
    ) as HTMLElement;
    const timeWheels = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-time-wheels"]',
    ) as HTMLElement;
    const minuteButtons = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-minute-adjustment-buttons"]',
    ) as HTMLElement;
    const hourButtons = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-hour-adjustment-buttons"]',
    ) as HTMLElement;

    expect(fieldset.getAttribute("aria-describedby")).toBe(instructions.id);
    expect(timeWheels.getAttribute("aria-labelledby")).toBe(legend.id);
    expect(minuteButtons.getAttribute("role")).toBe("group");
    expect(minuteButtons.getAttribute("aria-label")).toBe("Minuten anpassen");
    expect(hourButtons.getAttribute("role")).toBe("group");
    expect(hourButtons.getAttribute("aria-label")).toBe("Stunden anpassen");

    const hourInput = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-hour-input"]',
    ) as HTMLInputElement;
    const minuteInput = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-minute-input"]',
    ) as HTMLInputElement;
    expect(hourInput.getAttribute("aria-describedby")).toBe(instructions.id);
    expect(minuteInput.getAttribute("aria-describedby")).toBe(instructions.id);

    const expectedControls = [
      ["subtract-30-mins", "30 Minuten abziehen", "minute"],
      ["subtract-15-mins", "15 Minuten abziehen", "minute"],
      ["add-15-mins", "15 Minuten hinzufügen", "minute"],
      ["add-30-mins", "30 Minuten hinzufügen", "minute"],
      ["subtract-12-hrs", "12 Stunden abziehen", "hour"],
      ["subtract-6-hrs", "6 Stunden abziehen", "hour"],
      ["add-6-hrs", "6 Stunden hinzufügen", "hour"],
      ["add-12-hrs", "12 Stunden hinzufügen", "hour"],
    ] as const;

    for (const [testId, label, controlId] of expectedControls) {
      const button = fixture.nativeElement.querySelector(
        `[data-testid="datepicker-${testId}"]`,
      ) as HTMLButtonElement;

      expect(button.id).toBe(`dialog-${testId}`);
      expect(button.getAttribute("aria-label")).toBe(label);
      expect(button.getAttribute("aria-controls")).toBe(controlId);
    }
  });

  it("should hide AM/PM for a 24-hour time format", () => {
    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="datepicker-meridiem-toggle"]',
      ),
    ).toBeNull();

    const hourInput = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-hour-input"]',
    ) as HTMLInputElement;

    expect(hourInput.value).toBe("00");
    expect(hourInput.getAttribute("aria-valuemin")).toBe("0");
    expect(hourInput.getAttribute("aria-valuemax")).toBe("23");
  });

  it("should render an accessible AM/PM toggle after the last time wheel", () => {
    fixture.componentRef.setInput("context", {
      ...component.context(),
      selectedDate: DateTime.fromISO("2026-07-15T13:45:30"),
      showSeconds: true,
      uses12HourClock: true,
      showMeridiem: true,
    } satisfies DatepickerDialogContext);
    fixture.detectChanges();

    const hourInput = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-hour-input"]',
    ) as HTMLInputElement;
    const secondControl = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-second-unit-control"]',
    ) as HTMLElement;
    const group = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-meridiem-toggle"]',
    ) as HTMLElement;
    const label = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-meridiem-label"]',
    ) as HTMLElement;
    const am = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-meridiem-am"]',
    ) as HTMLInputElement;
    const pm = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-meridiem-pm"]',
    ) as HTMLInputElement;

    expect(hourInput.value).toBe("01");
    expect(hourInput.getAttribute("aria-valuemin")).toBe("1");
    expect(hourInput.getAttribute("aria-valuemax")).toBe("12");
    expect(hourInput.getAttribute("aria-valuetext")).toBe("1 PM");
    expect(group.id).toBe("meridiem");
    expect(group.getAttribute("role")).toBe("radiogroup");
    expect(group.getAttribute("aria-labelledby")).toBe(label.id);
    expect(am.id).toBe("meridiem-am");
    expect(pm.id).toBe("meridiem-pm");
    expect(am.checked).toBeFalsy();
    expect(pm.checked).toBeTruthy();
    expect(am.getAttribute("aria-controls")).toBe(hourInput.id);
    expect(pm.getAttribute("aria-controls")).toBe(hourInput.id);
    expect(
      secondControl.compareDocumentPosition(group) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("should keep 12-hour wheel and AM/PM changes synchronized with 24-hour values", () => {
    const timeSpy = vi.fn();
    const adjustSpy = vi.fn();
    component.timeChanged.subscribe(timeSpy);
    component.timeAdjusted.subscribe(adjustSpy);

    fixture.componentRef.setInput("context", {
      ...component.context(),
      selectedDate: DateTime.fromISO("2026-07-15T13:00:00"),
      uses12HourClock: true,
      showMeridiem: true,
    } satisfies DatepickerDialogContext);
    fixture.detectChanges();

    (
      fixture.nativeElement.querySelector(
        '[data-testid="datepicker-hour-increment"]',
      ) as HTMLButtonElement
    ).click();

    expect(adjustSpy).toHaveBeenLastCalledWith({ hours: 1 });

    fixture.componentRef.setInput("context", {
      ...component.context(),
      selectedDate: DateTime.fromISO("2026-07-15T11:00:00"),
    } satisfies DatepickerDialogContext);
    fixture.detectChanges();

    (
      fixture.nativeElement.querySelector(
        '[data-testid="datepicker-hour-increment"]',
      ) as HTMLButtonElement
    ).click();

    expect(adjustSpy).toHaveBeenLastCalledWith({ hours: 1 });

    fixture.componentRef.setInput("context", {
      ...component.context(),
      selectedDate: DateTime.fromISO("2026-07-15T10:00:00"),
    } satisfies DatepickerDialogContext);
    fixture.detectChanges();

    (
      fixture.nativeElement.querySelector(
        '[data-testid="datepicker-meridiem-pm"]',
      ) as HTMLInputElement
    ).click();

    expect(timeSpy).toHaveBeenLastCalledWith({ unit: "hour", value: 22 });
  });

  it("should forward time adjustment events", () => {
    fixture.componentRef.setInput("context", {
      ...component.context(),
      showQuickTimeControls: true,
    });
    fixture.detectChanges();

    const adjustSpy = vi.fn();
    component.timeAdjusted.subscribe(adjustSpy);

    const testCases = [
      { id: "add-15-mins", expected: { minutes: 15 } },
      { id: "subtract-15-mins", expected: { minutes: -15 } },
      { id: "add-30-mins", expected: { minutes: 30 } },
      { id: "subtract-30-mins", expected: { minutes: -30 } },
      { id: "add-12-hrs", expected: { hours: 12 } },
      { id: "subtract-12-hrs", expected: { hours: -12 } },
      { id: "add-6-hrs", expected: { hours: 6 } },
      { id: "subtract-6-hrs", expected: { hours: -6 } },
    ];

    for (const testCase of testCases) {
      const button = fixture.nativeElement.querySelector(
        `[data-testid="datepicker-${testCase.id}"]`,
      ) as HTMLButtonElement;
      button.click();
      expect(adjustSpy).toHaveBeenLastCalledWith(testCase.expected);
    }
  });

  it("should not show time adjustments when dateOnly is true", () => {
    const context: DatepickerDialogContext = {
      ...component.context(),
      dateOnly: true,
    };
    fixture.componentRef.setInput("context", context);
    fixture.detectChanges();

    const adjustments = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-time-adjustments"]',
    );
    expect(adjustments).toBeNull();
  });

  it("should hide quick-time controls by default", () => {
    const adjustments = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-time-adjustments"]',
    );
    expect(adjustments).toBeNull();
  });

  it("should show quick-time controls when showQuickTimeControls is enabled", () => {
    fixture.componentRef.setInput("context", {
      ...component.context(),
      showQuickTimeControls: true,
    });
    fixture.detectChanges();

    const adjustments = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-time-adjustments"]',
    );
    expect(adjustments).not.toBeNull();
  });
});
