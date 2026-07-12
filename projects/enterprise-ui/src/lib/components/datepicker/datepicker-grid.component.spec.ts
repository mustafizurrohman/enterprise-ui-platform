import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DateTime, Info } from "luxon";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DatepickerGridComponent,
  type DatepickerWeek,
} from "./datepicker-grid.component";

describe("DatepickerGridComponent", () => {
  let fixture: ComponentFixture<DatepickerGridComponent>;
  let component: DatepickerGridComponent;

  const selectedDate = DateTime.fromISO("2026-07-15");
  const today = DateTime.fromISO("2026-07-20");
  const weeks: DatepickerWeek[] = [
    {
      weekNumber: 27,
      days: [
        null,
        null,
        DateTime.fromISO("2026-07-01"),
        DateTime.fromISO("2026-07-02"),
        DateTime.fromISO("2026-07-03"),
        DateTime.fromISO("2026-07-04"),
        DateTime.fromISO("2026-07-05"),
      ],
    },
    {
      weekNumber: 29,
      days: [
        DateTime.fromISO("2026-07-13"),
        DateTime.fromISO("2026-07-14"),
        selectedDate,
        DateTime.fromISO("2026-07-16"),
        DateTime.fromISO("2026-07-17"),
        DateTime.fromISO("2026-07-18"),
        DateTime.fromISO("2026-07-19"),
      ],
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatepickerGridComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DatepickerGridComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("gridId", "calendar-grid");
    fixture.componentRef.setInput(
      "daysOfWeek",
      Info.weekdays("short", { locale: "de" }).map((short, index) => ({
        short,
        long: Info.weekdays("long", { locale: "de" })[index] ?? short,
        weekday: index + 1,
      })),
    );
    fixture.componentRef.setInput("weeks", weeks);
    fixture.componentRef.setInput("monthAbbreviation", "JUL");
    fixture.componentRef.setInput("selectedDate", selectedDate);
    fixture.componentRef.setInput("activeDate", selectedDate);
    fixture.componentRef.setInput("today", today);
    fixture.componentRef.setInput("viewDate", selectedDate);
    fixture.componentRef.setInput("monthHeadingId", "month-heading");
    fixture.componentRef.setInput("testIdPrefix", "datepicker");
    fixture.detectChanges();
  });

  it("should expose complete grid semantics and stable test ids", () => {
    const grid = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-calendar-grid"]',
    ) as HTMLElement;
    const selectedDay = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-day-2026-07-15"]',
    ) as HTMLButtonElement;

    expect(grid.id).toBe("calendar-grid");
    expect(grid.getAttribute("role")).toBe("grid");
    expect(grid.getAttribute("aria-labelledby")).toBe("month-heading");
    expect(grid.getAttribute("aria-rowcount")).toBe("3");
    expect(grid.getAttribute("aria-colcount")).toBe("8");
    expect(selectedDay.getAttribute("role")).toBe("gridcell");
    expect(selectedDay.getAttribute("aria-colindex")).toBe("4");
    expect(selectedDay.getAttribute("aria-selected")).toBe("true");
    expect(selectedDay.getAttribute("tabindex")).toBe("0");
  });

  it("should expose the month abbreviation as an inaccessible visual label and an accessible empty cell label", () => {
    const firstCell = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-cell-0-0"]',
    ) as HTMLElement;
    const abbreviation = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-month-abbreviation"]',
    ) as HTMLElement;

    expect(firstCell.getAttribute("role")).toBe("gridcell");
    expect(firstCell.getAttribute("aria-label")).toBe("JUL");
    expect(firstCell.getAttribute("aria-disabled")).toBe("true");
    expect(abbreviation.getAttribute("aria-hidden")).toBe("true");
  });

  it("should emit selection, focus and keyboard events", () => {
    const dateSelectedSpy = vi.fn();
    const dateFocusedSpy = vi.fn();
    const dateKeydownSpy = vi.fn();
    component.dateSelected.subscribe(dateSelectedSpy);
    component.dateFocused.subscribe(dateFocusedSpy);
    component.dateKeydown.subscribe(dateKeydownSpy);

    const day = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-day-2026-07-15"]',
    ) as HTMLButtonElement;
    day.dispatchEvent(new FocusEvent("focus"));
    day.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    );
    day.click();

    expect(dateFocusedSpy).toHaveBeenCalledWith(selectedDate);
    expect(dateKeydownSpy).toHaveBeenCalledWith(
      expect.objectContaining({ date: selectedDate }),
    );
    expect(dateSelectedSpy).toHaveBeenCalledWith(selectedDate);
  });

  it("should focus the requested date", () => {
    component.focusDate(selectedDate);

    expect(document.activeElement).toBe(
      fixture.nativeElement.querySelector(
        '[data-testid="datepicker-day-2026-07-15"]',
      ),
    );
  });
  it("should render weekday names and calendar weeks in bold", () => {
    const weekday = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-weekday-1"] strong',
    ) as HTMLElement;
    const calendarWeekHeading = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-weekday-calendar-week"] strong',
    ) as HTMLElement;
    const weekNumber = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-week-number-0"] strong',
    ) as HTMLElement;

    expect(weekday).toBeTruthy();
    expect(calendarWeekHeading.textContent?.trim()).toBe("KW");
    expect(weekNumber.textContent?.trim()).toBe("27");
  });

});
