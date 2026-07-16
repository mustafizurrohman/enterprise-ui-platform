import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DateTime, Info } from "luxon";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DatepickerGridComponent,
  type DatepickerGridContext,
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
    {
      weekNumber: 30,
      days: [null, null, null, null, null, null, null],
    },
  ];

  const context: DatepickerGridContext = {
    gridId: "calendar-grid",
    daysOfWeek: Info.weekdays("short", { locale: "de" }).map(
      (short, index) => ({
        short,
        long:
          Info.weekdays("long", { locale: "de" })[index] ?? short,
        weekday: index + 1,
      }),
    ),
    weeks,
    selectedDate,
    activeDate: selectedDate,
    today,
    viewDate: selectedDate,
    monthHeadingId: "month-heading",
    testIdPrefix: "datepicker",
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatepickerGridComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DatepickerGridComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("context", context);
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
    expect(grid.getAttribute("aria-rowcount")).toBe("4");
    expect(grid.getAttribute("aria-colcount")).toBe("8");
    expect(selectedDay.id).toBe("calendar-grid-day-2026-07-15");
    expect(selectedDay.getAttribute("role")).toBe("gridcell");
    expect(selectedDay.getAttribute("aria-rowindex")).toBe("3");
    expect(selectedDay.getAttribute("aria-colindex")).toBe("4");
    expect(selectedDay.getAttribute("aria-selected")).toBe("true");
    expect(selectedDay.getAttribute("tabindex")).toBe("0");
  });

  it("should expose explicit states and positions for all grid cells", () => {
    const unselectedDay = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-day-2026-07-14"]',
    ) as HTMLButtonElement;
    const emptyCell = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-cell-0-0"]',
    ) as HTMLElement;

    expect(unselectedDay.getAttribute("aria-selected")).toBe("false");
    expect(unselectedDay.getAttribute("aria-rowindex")).toBe("3");
    expect(unselectedDay.getAttribute("aria-colindex")).toBe("3");
    expect(emptyCell.id).toBe("calendar-grid-cell-0-0");
    expect(emptyCell.getAttribute("role")).toBe("gridcell");
    expect(emptyCell.getAttribute("aria-rowindex")).toBe("2");
    expect(emptyCell.getAttribute("aria-colindex")).toBe("2");
    expect(emptyCell.getAttribute("aria-disabled")).toBe("true");
  });

  it("should expose unique IDs for rendered grid elements", () => {
    const ids = Array.from(
      fixture.nativeElement.querySelectorAll("[id]") as NodeListOf<HTMLElement>,
      (element) => element.id,
    );

    expect(new Set(ids).size).toBe(ids.length);
    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="datepicker-weekday-row"]',
      ).id,
    ).toBe("calendar-grid-weekday-row");
    expect(
      fixture.nativeElement.querySelector('[data-testid="datepicker-week-1"]')
        .id,
    ).toBe("calendar-grid-week-1");
  });

  it("should not display calendar week numbers for weeks without dates", () => {
    const emptyWeekNumber = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-week-number-2"] strong',
    ) as HTMLElement;

    expect(emptyWeekNumber).toBeNull();
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
