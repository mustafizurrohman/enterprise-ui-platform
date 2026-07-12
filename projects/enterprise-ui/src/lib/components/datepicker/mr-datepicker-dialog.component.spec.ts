import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DateTime, Info } from "luxon";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MrDatepickerDialogComponent } from "./mr-datepicker-dialog.component";

describe("MrDatepickerDialogComponent", () => {
  let fixture: ComponentFixture<MrDatepickerDialogComponent>;
  let component: MrDatepickerDialogComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [MrDatepickerDialogComponent] }).compileComponents();
    fixture = TestBed.createComponent(MrDatepickerDialogComponent);
    component = fixture.componentInstance;
    const date = DateTime.fromISO("2026-07-15");
    const inputs: Record<string, unknown> = {
      dialogId: "dialog", dialogTitleId: "dialog-title", dialogDescriptionId: "dialog-description",
      monthHeadingId: "month-heading", hourSelectId: "hour", minuteSelectId: "minute", secondSelectId: "second",
      hourLabelId: "hour-label", minuteLabelId: "minute-label", secondLabelId: "second-label",
      dialogTitle: "Datum und Uhrzeit auswählen", formattedMonth: "Juli 2026",
      daysOfWeek: Info.weekdays("short", { locale: "de" }).map((short, index) => ({ short, long: Info.weekdays("long", { locale: "de" })[index] ?? short, weekday: index + 1 })),
      weeks: [{ weekNumber: 29, days: [DateTime.fromISO("2026-07-13"), DateTime.fromISO("2026-07-14"), date, DateTime.fromISO("2026-07-16"), DateTime.fromISO("2026-07-17"), DateTime.fromISO("2026-07-18"), DateTime.fromISO("2026-07-19")] }],
      monthAbbreviation: "JUL", selectedDate: date, activeDate: date, today: date, viewDate: date,
      testIdPrefix: "datepicker", dateOnly: false, showSeconds: false, dateAnnouncement: "", timeAnnouncement: "",
    };
    for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
    fixture.detectChanges();
  });

  it("should preserve dialog semantics and connect navigation to the grid", () => {
    const dialog = fixture.nativeElement.querySelector('[data-testid="datepicker-dialog"]') as HTMLElement;
    const grid = fixture.nativeElement.querySelector('[data-testid="datepicker-calendar-grid"]') as HTMLElement;
    const previous = fixture.nativeElement.querySelector('[data-testid="datepicker-previous-month"]') as HTMLButtonElement;
    expect(dialog.getAttribute("role")).toBe("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(previous.getAttribute("aria-controls")).toBe(grid.id);
  });

  it("should forward navigation and time changes", () => {
    const previousSpy = vi.fn();
    const timeSpy = vi.fn();
    component.previousMonth.subscribe(previousSpy);
    component.timeChanged.subscribe(timeSpy);
    (fixture.nativeElement.querySelector('[data-testid="datepicker-previous-month"]') as HTMLButtonElement).click();
    (fixture.nativeElement.querySelector('[data-testid="datepicker-hour-increment"]') as HTMLButtonElement).click();
    expect(previousSpy).toHaveBeenCalledOnce();
    expect(timeSpy).toHaveBeenCalledWith({ unit: "hour", value: 1 });
  });
});
