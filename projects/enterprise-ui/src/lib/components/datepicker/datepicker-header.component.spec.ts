import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DatepickerHeaderComponent } from "./datepicker-header.component";
import { DatepickerHeaderContext } from "./datepicker-header.types";

describe("DatepickerHeaderComponent", () => {
  let fixture: ComponentFixture<DatepickerHeaderComponent>;
  let component: DatepickerHeaderComponent;

  const createContext = (): DatepickerHeaderContext => ({
    dialogId: "datepicker-1",
    testIdPrefix: "datepicker",
    calendarGridId: "datepicker-1-grid",
    monthHeadingId: "datepicker-1-month-heading",
    formattedMonth: "Juli 2026",
    selectedMonth: "7",
    shortMonths: ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"],
    todayMonth: 7,
    todayYear: 2026,
    viewYear: 2026,
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatepickerHeaderComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(DatepickerHeaderComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("context", createContext());
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("should render the header with all navigation controls", () => {
    const previousMonthBtn = fixture.nativeElement.querySelector('[data-testid="datepicker-previous-month"]');
    const nextMonthBtn = fixture.nativeElement.querySelector('[data-testid="datepicker-next-month"]');
    const previousYearBtn = fixture.nativeElement.querySelector('[data-testid="datepicker-previous-year"]');
    const nextYearBtn = fixture.nativeElement.querySelector('[data-testid="datepicker-next-year"]');

    expect(previousMonthBtn).toBeTruthy();
    expect(nextMonthBtn).toBeTruthy();
    expect(previousYearBtn).toBeTruthy();
    expect(nextYearBtn).toBeTruthy();
  });

  it("should repeat previousMonth emission while pressed", () => {
    vi.useFakeTimers();
    const previousMonthSpy = vi.fn();
    component.previousMonth.subscribe(previousMonthSpy);

    const btn = fixture.nativeElement.querySelector('[data-testid="datepicker-previous-month"]');
    
    btn.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, isPrimary: true }));
    expect(previousMonthSpy).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(300);
    expect(previousMonthSpy).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(294);
    expect(previousMonthSpy).toHaveBeenCalledTimes(3);

    btn.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, button: 0, isPrimary: true }));
    vi.advanceTimersByTime(1000);
    expect(previousMonthSpy).toHaveBeenCalledTimes(3);
  });

  it("should repeat nextMonth emission while pressed", () => {
    vi.useFakeTimers();
    const nextMonthSpy = vi.fn();
    component.nextMonth.subscribe(nextMonthSpy);

    const btn = fixture.nativeElement.querySelector('[data-testid="datepicker-next-month"]');
    
    btn.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, isPrimary: true }));
    expect(nextMonthSpy).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(300);
    expect(nextMonthSpy).toHaveBeenCalledTimes(2);

    btn.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, button: 0, isPrimary: true }));
  });

  it("should repeat previousYear emission while pressed", () => {
    vi.useFakeTimers();
    const previousYearSpy = vi.fn();
    component.previousYear.subscribe(previousYearSpy);

    const btn = fixture.nativeElement.querySelector('[data-testid="datepicker-previous-year"]');
    
    btn.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, isPrimary: true }));
    expect(previousYearSpy).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(300);
    expect(previousYearSpy).toHaveBeenCalledTimes(2);

    btn.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, button: 0, isPrimary: true }));
  });

  it("should repeat nextYear emission while pressed", () => {
    vi.useFakeTimers();
    const nextYearSpy = vi.fn();
    component.nextYear.subscribe(nextYearSpy);

    const btn = fixture.nativeElement.querySelector('[data-testid="datepicker-next-year"]');
    
    btn.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, isPrimary: true }));
    expect(nextYearSpy).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(300);
    expect(nextYearSpy).toHaveBeenCalledTimes(2);

    btn.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, button: 0, isPrimary: true }));
  });

  it("should emit previousMonth on keyboard click", () => {
    const previousMonthSpy = vi.fn();
    component.previousMonth.subscribe(previousMonthSpy);

    const btn = fixture.nativeElement.querySelector('[data-testid="datepicker-previous-month"]');
    btn.click();

    expect(previousMonthSpy).toHaveBeenCalledTimes(1);
  });

  it("should emit monthSelected when clicking month reset", () => {
    const monthSelectedSpy = vi.fn();
    component.monthSelected.subscribe(monthSelectedSpy);

    const btn = fixture.nativeElement.querySelector('[data-testid="datepicker-month-reset"]');
    btn.click();

    expect(monthSelectedSpy).toHaveBeenCalledWith(7);
  });

  it("should emit yearSelected when clicking year reset", () => {
    const yearSelectedSpy = vi.fn();
    component.yearSelected.subscribe(yearSelectedSpy);

    const btn = fixture.nativeElement.querySelector('[data-testid="datepicker-year-reset"]');
    btn.click();

    expect(yearSelectedSpy).toHaveBeenCalledWith(2026);
  });
});
