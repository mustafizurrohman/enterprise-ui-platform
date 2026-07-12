import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MrDatepickerComponent } from './mr-datepicker.component';
import { DateTime } from 'luxon';

describe('MrDatepickerComponent', () => {
  let component: MrDatepickerComponent;
  let fixture: ComponentFixture<MrDatepickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MrDatepickerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MrDatepickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have calendar closed by default', () => {
    expect((component as any).isOpen()).toBeFalsy();
    const calendar = document.querySelector('.mr-datepicker-calendar');
    expect(calendar).toBeNull();
  });

  it('should toggle calendar when input is clicked', () => {
    const input = fixture.nativeElement.querySelector('input');
    input.click();
    fixture.detectChanges();
    expect((component as any).isOpen()).toBeTruthy();
    let calendar = document.querySelector('.mr-datepicker-calendar');
    expect(calendar).toBeTruthy();

    input.click();
    fixture.detectChanges();
    // Since input.click() calls openCalendar(), it will remain open.
    // If we want to test toggling, we should click the button.
    expect((component as any).isOpen()).toBeTruthy();

    const button = fixture.nativeElement.querySelector('.mr-datepicker-icon');
    button.click();
    fixture.detectChanges();
    expect((component as any).isOpen()).toBeFalsy();
    calendar = document.querySelector('.mr-datepicker-calendar');
    expect(calendar).toBeNull();
  });

  it('should navigate to previous and next month', () => {
    (component as any).isOpen.set(true);
    fixture.detectChanges();

    const initialMonth = component.viewDate.month;

    component.prevMonth();
    expect(component.viewDate.month).toBe(initialMonth === 1 ? 12 : initialMonth - 1);

    component.nextMonth();
    expect(component.viewDate.month).toBe(initialMonth);
  });

  it('should select a date', () => {
    const onChangeSpy = vi.fn();
    component.registerOnChange(onChangeSpy);

    const today = DateTime.now().startOf('day');
    (component as any).selectDate(today);

    expect(component.selectedDate?.hasSame(today, 'day')).toBeTruthy();
    expect(onChangeSpy).toHaveBeenCalledWith(today.toISODate());
    expect((component as any).isOpen()).toBeFalsy();
  });

  it('should update state when writeValue is called', () => {
    const testDate = '2023-12-25';
    component.writeValue(testDate);
    fixture.detectChanges();

    expect(component.selectedDate?.toISODate()).toBe(testDate);
    expect(component.viewDate.hasSame(DateTime.fromISO(testDate), 'month')).toBeTruthy();
  });
});
