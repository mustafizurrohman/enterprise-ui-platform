import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MrDatepickerComponent } from './mr-datepicker.component';
import { DateTime, Info } from 'luxon';
import { Component, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';

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

  describe('dateOnly', () => {
    it('should transform an attribute-style value to true', () => {
      fixture.componentRef.setInput('dateOnly', '');
      fixture.detectChanges();

      expect(component.dateOnly()).toBeTruthy();
    });

    it('should hide time selection and use the date-only format', async () => {
      fixture.componentRef.setInput('dateOnly', true);
      component.writeValue('2026-07-12T14:30:45');
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
      expect(input.value).toBe('12.07.2026');
      expect(component.selectedDate()?.hour).toBe(0);
      expect(component.selectedDate()?.minute).toBe(0);
      expect(component.selectedDate()?.second).toBe(0);

      fixture.nativeElement.querySelector('.mr-datepicker-icon').click();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(document.querySelector('.mr-datepicker-time-wheels')).toBeNull();
      expect(document.querySelector('.mr-datepicker-time-select')).toBeNull();
      expect(document.querySelector('.mr-datepicker-confirm')).toBeTruthy();
    });

    it('should emit the selected date at the start of the day', () => {
      fixture.componentRef.setInput('dateOnly', true);
      const onChangeSpy = vi.fn();
      component.registerOnChange(onChangeSpy);

      const selectedDate = DateTime.fromISO('2026-07-12T18:30:45');
      (component as any).selectDate(selectedDate);

      expect(component.selectedDate()?.toISO()).toBe(selectedDate.startOf('day').toISO());
      expect(onChangeSpy).toHaveBeenCalledWith(selectedDate.startOf('day').toISO());
    });
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

  describe('calendar day arrangement', () => {
    it('should render July 2026 with the month label in the first cell and day 1 on Wednesday', async () => {
      component.writeValue('2026-07-15T00:00:00');
      (component as any).isOpen.set(true);
      fixture.detectChanges();
      await fixture.whenStable();

      expect((component as any).monthAbbreviation()).toBe(
        DateTime.fromISO('2026-07-01')
          .setLocale('de')
          .toFormat('LLL')
          .toUpperCase()
      );
      expect(component.grid()[0].days.map((date) => date?.day ?? null)).toEqual([
        null,
        null,
        1,
        2,
        3,
        4,
        5,
      ]);

      const weekdayCells = document.querySelectorAll(
        '.mr-datepicker-weekday-row .mr-datepicker-day-name'
      );
      const weekRows = document.querySelectorAll('.mr-datepicker-week');
      const firstRowCells = weekRows[0].querySelectorAll(
        '.mr-datepicker-kw-value, .mr-datepicker-gridcell'
      );

      expect(weekdayCells).toHaveLength(8);
      expect(firstRowCells).toHaveLength(8);
      expect(firstRowCells[0].textContent?.trim()).toBe('27'); // KW for July 1, 2026
      expect(firstRowCells[1].textContent?.trim()).toBe(
        (component as any).monthAbbreviation()
      );
      expect(firstRowCells[2].textContent?.trim()).toBe('');
      expect(firstRowCells[3].textContent?.trim()).toBe('1');

      const renderedDates = Array.from(
        document.querySelectorAll<HTMLButtonElement>('.mr-datepicker-day[data-date]')
      ).map(button => button.dataset['date']);

      expect(renderedDates).toHaveLength(31);
      expect(renderedDates.every(date => date?.startsWith('2026-07-'))).toBeTruthy();
    });

    const monthStartCases: Array<[string, number, number]> = [
      ['2026-06-15T00:00:00', 0, 1], // Monday
      ['2026-09-15T00:00:00', 1, 0], // Tuesday
      ['2026-08-15T00:00:00', 5, 0], // Saturday
      ['2026-11-15T00:00:00', 6, 0], // Sunday
    ];

    it.each(monthStartCases)(
      'should place day 1 in the correct Monday-first column for %s',
      (value, expectedColumn, expectedRow) => {
        component.writeValue(value);

        const row = component.grid()[expectedRow].days;

        expect(row[expectedColumn]?.day).toBe(1);
        expect(
          component.grid().every((week) => week.days.length === 7)
        ).toBeTruthy();
      }
    );

    it('should expose weekday headings in Monday-first order', () => {
      expect(component.daysOfWeek.map((day) => day.long)).toEqual(
        Info.weekdays('long', { locale: 'de' })
      );
    });
  });

  it('should navigate to previous and next month', () => {
    (component as any).isOpen.set(true);
    fixture.detectChanges();

    const initialMonth = component.viewDate().month;

    component.prevMonth();
    expect(component.viewDate().month).toBe(initialMonth === 1 ? 12 : initialMonth - 1);

    component.nextMonth();
    expect(component.viewDate().month).toBe(initialMonth);
  });

  it('should select a date and NOT close the calendar', () => {
    const onChangeSpy = vi.fn();
    component.registerOnChange(onChangeSpy);
    (component as any).isOpen.set(true);

    const today = DateTime.now().startOf('day');
    (component as any).selectDate(today);

    expect(component.selectedDate()?.hasSame(today, 'day')).toBeTruthy();
    expect(onChangeSpy).toHaveBeenCalledWith(today.toISO());
    expect((component as any).isOpen()).toBeTruthy();
  });
  
  it('should select now and close the calendar when Jetzt is clicked', async () => {
    fixture.componentRef.setInput('showSeconds', true);
    const onChangeSpy = vi.fn();
    component.registerOnChange(onChangeSpy);
    const button = fixture.nativeElement.querySelector('.mr-datepicker-icon');
    button.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const jetztButton = document.querySelector('.mr-datepicker-now') as HTMLButtonElement;
    expect(jetztButton).toBeTruthy();
    expect(jetztButton.textContent?.trim()).toBe('Jetzt');

    const before = DateTime.now();
    jetztButton.click();
    fixture.detectChanges();
    const after = DateTime.now();

    expect(component.selectedDate()).toBeTruthy();
    const selectedDate = component.selectedDate()!;
    // Should be between before and after
    expect(selectedDate.toMillis()).toBeGreaterThanOrEqual(before.toMillis() - 1000); // Tolerance for slight delays
    expect(selectedDate.toMillis()).toBeLessThanOrEqual(after.toMillis() + 1000);

    expect(onChangeSpy).toHaveBeenCalled();
    expect((component as any).isOpen()).toBeFalsy();
  });

  it('should update time', () => {
    const onChangeSpy = vi.fn();
    component.registerOnChange(onChangeSpy);

    const today = DateTime.now().startOf('day');
    (component as any).selectDate(today);

    (component as any).updateTime('hour', 14);
    (component as any).updateTime('minute', 30);
    (component as any).updateTime('second', 45);

    expect(component.selectedDate()?.hour).toBe(14);
    expect(component.selectedDate()?.minute).toBe(30);
    expect(component.selectedDate()?.second).toBe(45);
    expect(onChangeSpy).toHaveBeenLastCalledWith(component.selectedDate()?.toISO());
  });

  it('should increment and decrement time', () => {
    const today = DateTime.now().startOf('day').set({ hour: 10, minute: 30, second: 30 });
    (component as any).selectedDate.set(today);

    (component as any).incrementTime('hour');
    expect(component.selectedDate()?.hour).toBe(11);

    (component as any).decrementTime('hour');
    expect(component.selectedDate()?.hour).toBe(10);

    // Test wrap around
    (component as any).updateTime('hour', 23);
    (component as any).incrementTime('hour');
    expect(component.selectedDate()?.hour).toBe(0);

    (component as any).decrementTime('hour');
    expect(component.selectedDate()?.hour).toBe(23);
  });

  it('should return correct previous and next time values', () => {
    (component as any).selectedDate.set(DateTime.now().startOf('day').set({ hour: 10 }));

    expect((component as any).previousTimeValue('hour')).toBe('09');
    expect((component as any).nextTimeValue('hour')).toBe('11');

    (component as any).updateTime('hour', 0);
    expect((component as any).previousTimeValue('hour')).toBe('23');

    (component as any).updateTime('hour', 23);
    expect((component as any).nextTimeValue('hour')).toBe('00');
  });

  it('should update state when writeValue is called', () => {
    const testDate = '2023-12-25';
    component.writeValue(testDate);
    fixture.detectChanges();

    expect(component.selectedDate()?.toISO()).toBe(DateTime.fromISO(testDate).toISO());
    expect(component.viewDate().hasSame(DateTime.fromISO(testDate), 'month')).toBeTruthy();
  });

  describe('Manual Input', () => {
    it('should allow entering date manually', () => {
      fixture.componentRef.setInput('showSeconds', true);
      const input = fixture.nativeElement.querySelector('input');
      expect(input.readOnly).toBeFalsy();

      const testDateStr = '24.12.2023 18:00:00 Uhr';
      input.value = testDateStr;
      input.dispatchEvent(new Event('change'));
      fixture.detectChanges();

      const expectedDate = DateTime.fromFormat(testDateStr, (component as any).dateFormat());
      expect(component.selectedDate()?.toISODate()).toBe(expectedDate.toISODate());
      expect(component.selectedDate()?.hour).toBe(18);
      expect(component.selectedDate()?.minute).toBe(0);
      expect(component.selectedDate()?.second).toBe(0);
    });

    it('should reject invalid date input and revert to previous value', () => {
      fixture.componentRef.setInput('showSeconds', true);
      const input = fixture.nativeElement.querySelector('input');

      // Set a valid date first
      const initialDateStr = '01.01.2024 10:00:00 Uhr';
      input.value = initialDateStr;
      input.dispatchEvent(new Event('change'));
      fixture.detectChanges();

      expect(component.selectedDate()?.year).toBe(2024);

      // Enter invalid date
      input.value = 'invalid date';
      input.dispatchEvent(new Event('change'));
      fixture.detectChanges();

      // Should still be the initial date
      expect(component.selectedDate()?.year).toBe(2024);
      // Input should be reverted
      expect(input.value).toBe(initialDateStr);
    });

    it('should open calendar on enter even if value changed', () => {
      fixture.componentRef.setInput('showSeconds', true);
      const input = fixture.nativeElement.querySelector('input');
      const testDateStr = '24.12.2023 18:00:00 Uhr';
      input.value = testDateStr;

      // Simulate Enter key
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      input.dispatchEvent(new Event('change'));

      fixture.detectChanges();

      expect((component as any).isOpen()).toBeTruthy();
      const expectedDate = DateTime.fromFormat(testDateStr, (component as any).dateFormat());
      expect(component.selectedDate()?.toISODate()).toBe(expectedDate.toISODate());
    });
  });

  it('should have correct accessibility attributes', () => {
    const label = fixture.nativeElement.querySelector('.mr-datepicker-label');
    const input = fixture.nativeElement.querySelector('input');
    const button = fixture.nativeElement.querySelector('.mr-datepicker-icon');

    expect(label.textContent).toContain(component.label());
    expect(label.getAttribute('for')).toBe(input.id);
    expect(input.getAttribute('aria-haspopup')).toBe('dialog');
    expect(button.getAttribute('aria-label')).toContain('Kalender');
    expect(button.getAttribute('aria-haspopup')).toBe('dialog');

    const svg = button.querySelector('svg');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
  });

  it('should trap focus and have dialog attributes when calendar is open', async () => {
    const button = fixture.nativeElement.querySelector('.mr-datepicker-icon');
    button.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const dialog = document.querySelector('.mr-datepicker-calendar');
    expect(dialog).toBeTruthy();
    expect(dialog?.getAttribute('role')).toBe('dialog');
    expect(dialog?.getAttribute('aria-modal')).toBe('true');
    expect(dialog?.hasAttribute('cdktrapfocus')).toBeTruthy();

    const title = document.getElementById(dialog?.getAttribute('aria-labelledby') || '');
    expect(title?.classList.contains('mr-visually-hidden')).toBeTruthy();
  });

  it('should navigate calendar with keyboard', async () => {
    const input = fixture.nativeElement.querySelector('input');
    input.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const initialDate = (component as any).activeDate();

    // Simulate ArrowRight on the active day button
    const activeDayButton = document.querySelector('.mr-datepicker-day[tabindex="0"]') as HTMLButtonElement;
    expect(activeDayButton).toBeTruthy();

    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
    activeDayButton.dispatchEvent(event);
    fixture.detectChanges();

    expect((component as any).activeDate().hasSame(initialDate.plus({ days: 1 }), 'day')).toBeTruthy();

    // Simulate ArrowDown (next week)
    const activeDayButtonNext = document.querySelector('.mr-datepicker-day[tabindex="0"]') as HTMLButtonElement;
    const eventDown = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
    activeDayButtonNext.dispatchEvent(eventDown);
    fixture.detectChanges();

    expect((component as any).activeDate().hasSame(initialDate.plus({ days: 8 }), 'day')).toBeTruthy();
  });

  it('should allow typing time in time picker', async () => {
    component.registerOnChange(vi.fn());
    const button = fixture.nativeElement.querySelector('.mr-datepicker-icon');
    button.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const hourInput = document.querySelector('.mr-datepicker-time-select') as HTMLInputElement;
    expect(hourInput).toBeTruthy();
    expect(hourInput.tagName).toBe('INPUT');

    hourInput.value = '15';
    hourInput.dispatchEvent(new Event('input'));
    hourInput.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(component.selectedDate()?.hour).toBe(15);
  });

  it('should validate time typing', async () => {
    const button = fixture.nativeElement.querySelector('.mr-datepicker-icon');
    button.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const hourInput = document.querySelector('.mr-datepicker-time-select') as HTMLInputElement;

    // Try to enter non-numeric value
    hourInput.value = 'ab';
    hourInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    // Logic in onTimeInput strips non-numeric
    expect(hourInput.value).toBe('');

    // Try to enter value > 23
    hourInput.value = '99';
    hourInput.dispatchEvent(new Event('input'));
    hourInput.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(component.selectedDate()?.hour).toBe(23); // Clamped to max
  });

  it('should announce time changes', async () => {
    const button = fixture.nativeElement.querySelector('.mr-datepicker-icon');
    button.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const incrementButton = document.querySelector('[aria-label="Stunde um eins erhöhen"]') as HTMLButtonElement;
    incrementButton.click();
    fixture.detectChanges();

    expect((component as any).timeAnnouncement()).toContain('Uhrzeit');
    expect((component as any).timeAnnouncement()).toMatch(/Uhrzeit \d{2} Uhr/);
  });

  describe('disabled', () => {
    it('should disable the input and icon button when disabled is true', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
      const button = fixture.nativeElement.querySelector('.mr-datepicker-icon') as HTMLButtonElement;

      expect(input.disabled).toBeTruthy();
      expect(button.disabled).toBeTruthy();
    });

    it('should not open calendar when disabled is true', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
      input.click();
      fixture.detectChanges();
      expect((component as any).isOpen()).toBeFalsy();

      const button = fixture.nativeElement.querySelector('.mr-datepicker-icon') as HTMLButtonElement;
      button.click();
      fixture.detectChanges();
      expect((component as any).isOpen()).toBeFalsy();
    });

    it('should update disabled state via setDisabledState', async () => {
      component.setDisabledState(true);
      fixture.detectChanges();
      await fixture.whenStable();

      const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
      expect(input.disabled).toBeTruthy();

      component.setDisabledState(false);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(input.disabled).toBeFalsy();
    });

    it('should still display the provided value when disabled', () => {
      fixture.componentRef.setInput('disabled', true);
      const testDate = '2026-07-12T14:30:45';
      component.writeValue(testDate);
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
      expect(input.value).toBe(DateTime.fromISO(testDate).toFormat((component as any).dateFormat()));
    });
  });

  describe('showSeconds', () => {
    it('should be false by default', () => {
      expect(component.showSeconds()).toBeFalsy();
    });

    it('should hide seconds wheel by default', async () => {
      const button = fixture.nativeElement.querySelector('.mr-datepicker-icon');
      button.click();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(document.querySelector('#' + (component as any).secondSelectId)).toBeNull();
      expect(document.querySelectorAll('.mr-datepicker-time-wheel')).toHaveLength(2);
    });

    it('should show seconds wheel when showSeconds is true', async () => {
      fixture.componentRef.setInput('showSeconds', true);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('.mr-datepicker-icon');
      button.click();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(document.querySelector('#' + (component as any).secondSelectId)).toBeTruthy();
      expect(document.querySelectorAll('.mr-datepicker-time-wheel')).toHaveLength(3);
    });

    it('should adjust dateFormat when showSeconds is toggled', () => {
      expect((component as any).dateFormat()).not.toContain(':ss');

      fixture.componentRef.setInput('showSeconds', true);
      fixture.detectChanges();
      expect((component as any).dateFormat()).toContain(':ss');
    });

    it('should adjust announceTime when showSeconds is true', () => {
      const testDate = DateTime.fromISO('2026-07-12T14:30:45');
      (component as any).selectedDate.set(testDate);

      (component as any).announceTime();
      expect((component as any).timeAnnouncement()).not.toContain('Sekunden');

      fixture.componentRef.setInput('showSeconds', true);
      fixture.detectChanges();
      (component as any).announceTime();
      expect((component as any).timeAnnouncement()).toContain('45 Sekunden');
    });

    it('should strip seconds in writeValue when showSeconds is false', () => {
      const testDate = '2026-07-12T14:30:45';
      component.writeValue(testDate);
      expect(component.selectedDate()?.second).toBe(0);

      fixture.componentRef.setInput('showSeconds', true);
      component.writeValue(testDate);
      expect(component.selectedDate()?.second).toBe(45);
    });
  });

  describe('today input', () => {
    it('should use the provided today input for highlights', () => {
      const specificToday = DateTime.fromISO('2026-07-20'); // A Monday (weekday 1)
      fixture.componentRef.setInput('today', specificToday);
      fixture.detectChanges();

      // Check isCurrentWeekday (Monday is weekday 1)
      expect((component as any).isCurrentWeekday(1)).toBeTruthy();
      expect((component as any).isCurrentWeekday(2)).toBeFalsy();

      // Check isToday
      expect(component.isToday(specificToday)).toBeTruthy();
      expect(component.isToday(specificToday.plus({ days: 1 }))).toBeFalsy();

      // Check isCurrentWeek
      component.writeValue('2026-07-20');
      fixture.detectChanges();

      const weekWithToday = component.grid().find(w => w.days.some(d => d?.hasSame(specificToday, 'day')));
      expect(weekWithToday).toBeTruthy();
      expect((component as any).isCurrentWeek(weekWithToday!)).toBeTruthy();

      const otherWeek = component.grid().find(w => !w.days.some(d => d?.hasSame(specificToday, 'day')));
      if (otherWeek) {
        expect((component as any).isCurrentWeek(otherWeek)).toBeFalsy();
      }
    });

    it('should reflect the provided today input in the template classes', async () => {
      const specificToday = DateTime.fromISO('2026-07-20'); // Monday
      fixture.componentRef.setInput('today', specificToday);
      component.writeValue('2026-07-20');
      (component as any).isOpen.set(true);
      fixture.detectChanges();
      await fixture.whenStable();

      const weekdayHeaders = document.querySelectorAll('.mr-datepicker-day-name');
      // Index 0 is KW, Index 1 is Monday
      expect(weekdayHeaders[1].classList.contains('today')).toBeTruthy();
      expect(weekdayHeaders[2].classList.contains('today')).toBeFalsy();

      const todayButton = document.querySelector(`.mr-datepicker-day[data-date="2026-07-20"]`);
      expect(todayButton?.classList.contains('today')).toBeTruthy();

      const weekRow = todayButton?.closest('.mr-datepicker-week');
      const kwCell = weekRow?.querySelector('.mr-datepicker-kw-value');
      expect(kwCell?.classList.contains('today')).toBeTruthy();
    });

    it('should NOT highlight the weekday header if viewing a different month', async () => {
      const specificToday = DateTime.fromISO('2026-07-20'); // Monday
      fixture.componentRef.setInput('today', specificToday);
      
      // View June 2026 instead of July 2026
      component.writeValue('2026-06-15');
      (component as any).isOpen.set(true);
      fixture.detectChanges();
      await fixture.whenStable();

      const weekdayHeaders = document.querySelectorAll('.mr-datepicker-day-name');
      // Index 1 is Monday. It should NOT have 'today' class because we are in June.
      expect(weekdayHeaders[1].classList.contains('today')).toBeFalsy();
    });
  });
});

@Component({
  standalone: true,
  imports: [MrDatepickerComponent, ReactiveFormsModule, FormsModule],
  template: `
    <mr-datepicker id="reactive" [formControl]="control" />
    <mr-datepicker id="template" [(ngModel)]="templateValue" />
    <mr-datepicker id="signal" [(value)]="signalValue" />
  `
})
class TestHostComponent {
  control = new FormControl<string | null>(null);
  templateValue: string | null = null;
  signalValue = signal<string | null>(null);
}

describe('MrDatepickerComponent Forms Compatibility', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should work with Reactive Forms', async () => {
    const testDate = '2026-07-12T10:00:00.000Z';
    host.control.setValue(testDate);
    fixture.detectChanges();
    await fixture.whenStable();

    const input = fixture.nativeElement.querySelector('#reactive input') as HTMLInputElement;
    expect(input.value).toContain('12.07.2026');
  });

  it('should work with Template-driven Forms', async () => {
    const testDate = '2026-07-13T10:00:00.000Z';
    host.templateValue = testDate;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('#template input') as HTMLInputElement;
    expect(input.value).toContain('13.07.2026');
  });

  it('should work with Signal-based (model) binding', async () => {
    const testDate = '2026-07-14T10:00:00.000Z';
    host.signalValue.set(testDate);
    fixture.detectChanges();
    await fixture.whenStable();

    const input = fixture.nativeElement.querySelector('#signal input') as HTMLInputElement;
    expect(input.value).toContain('14.07.2026');
  });

  it('should validate invalid dates', async () => {
    host.control.setValue('invalid-date');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(host.control.invalid).toBeTruthy();
    expect(host.control.errors?.['invalidDate']).toBeTruthy();
  });

  it('should call onTouched on blur', async () => {
    const input = fixture.nativeElement.querySelector('#reactive input') as HTMLInputElement;

    expect(host.control.touched).toBeFalsy();
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(host.control.touched).toBeTruthy();
  });

  it('should propagate changes from internal signal to value model', async () => {
    const datepickerElement = fixture.nativeElement.querySelector('#signal');

    const button = datepickerElement.querySelector('.mr-datepicker-icon') as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const dayButton = document.querySelector('.mr-datepicker-day[data-date="2026-07-14"]') as HTMLButtonElement;
    expect(dayButton).toBeTruthy();
    dayButton.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(host.signalValue()).toContain('2026-07-14');
  });
});
