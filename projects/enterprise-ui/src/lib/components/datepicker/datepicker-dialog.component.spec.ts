import { ComponentFixture, TestBed } from "@angular/core/testing";
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
      imports: [DatepickerDialogComponent],
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
});
