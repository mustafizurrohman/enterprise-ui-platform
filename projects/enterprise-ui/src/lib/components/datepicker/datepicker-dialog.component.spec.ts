import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { DateTime, Info } from "luxon";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DatepickerDialogComponent,
  type DatepickerDialogContext,
} from "./datepicker-dialog.component";

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
      dialogTitle: "Datum und Uhrzeit auswählen",
      formattedMonth: "Juli 2026",
      months: Info.months("long", { locale: "de" }),
      daysOfWeek: Info.weekdays("short", { locale: "de" }).map(
        (short, index) => ({
          short,
          long:
            Info.weekdays("long", { locale: "de" })[index] ?? short,
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
      dateAnnouncement: "",
      timeAnnouncement: "",
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

  it("should forward navigation and time changes", () => {
    const previousSpy = vi.fn();
    const timeSpy = vi.fn();
    component.previousMonth.subscribe(previousSpy);
    component.timeChanged.subscribe(timeSpy);

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
    expect(timeSpy).toHaveBeenCalledWith({ unit: "hour", value: 1 });
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
  it("should place the month and year navigation groups next to each other without a spacer", () => {
    const currentPeriod = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-current-period"]',
    );
    const spacer = fixture.nativeElement.querySelector(
      ".datepicker-navigation-spacer",
    );
    const header = fixture.nativeElement.querySelector(
      ".datepicker-header",
    ) as HTMLElement;
    const navigationGroups = header.querySelectorAll(
      ".datepicker-navigation-group",
    );

    expect(currentPeriod).toBeNull();
    expect(spacer).toBeNull();
    expect(navigationGroups).toHaveLength(2);
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

  it("should group month and year navigation with their related controls", () => {
    const monthGroup = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-month-navigation"]',
    ) as HTMLElement;
    const yearGroup = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-year-navigation"]',
    ) as HTMLElement;

    expect(monthGroup.querySelector('[data-testid="datepicker-previous-month"]')).toBeTruthy();
    expect(monthGroup.querySelector('[data-testid="datepicker-month-select"]')).toBeTruthy();
    expect(monthGroup.querySelector('[data-testid="datepicker-next-month"]')).toBeTruthy();

    expect(yearGroup.querySelector('[data-testid="datepicker-previous-year"]')).toBeTruthy();
    expect(yearGroup.querySelector('[data-testid="datepicker-year-display"]')).toBeTruthy();
    expect(yearGroup.querySelector('[data-testid="datepicker-next-year"]')).toBeTruthy();
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

  it("should forward time adjustment events", () => {
    const adjustSpy = vi.fn();
    component.timeAdjusted.subscribe(adjustSpy);

    const testCases = [
      { id: "add-15-mins", expected: { minutes: 15 } },
      { id: "subtract-15-mins", expected: { minutes: -15 } },
      { id: "add-30-mins", expected: { minutes: 30 } },
      { id: "subtract-30-mins", expected: { minutes: -30 } },
      { id: "add-12-hrs", expected: { hours: 12 } },
      { id: "subtract-12-hrs", expected: { hours: -12 } },
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
});
