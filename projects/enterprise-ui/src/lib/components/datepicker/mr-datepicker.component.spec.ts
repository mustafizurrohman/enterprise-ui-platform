import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MrDatepickerComponent } from './mr-datepicker.component';
import { DateTime, Info } from 'luxon';

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

  describe('calendar day arrangement', () => {
    it('should render July 2026 with the month label in the first cell and day 1 on Wednesday', async () => {
      component.writeValue('2026-07-15T00:00:00');
      (component as any).isOpen.set(true);
      fixture.detectChanges();
      await fixture.whenStable();

      expect((component as any).monthAbbreviation).toBe('JUL');
      expect(component.grid[0].map(date => date?.day ?? null)).toEqual([
        null,
        null,
        null,
        1,
        2,
        3,
        4
      ]);

      const weekdayCells = document.querySelectorAll(
        '.mr-datepicker-weekday-row .mr-datepicker-day-name'
      );
      const weekRows = document.querySelectorAll('.mr-datepicker-week');
      const firstRowCells = weekRows[0].querySelectorAll('.mr-datepicker-gridcell');

      expect(weekdayCells).toHaveLength(7);
      expect(firstRowCells).toHaveLength(7);
      expect(firstRowCells[0].textContent?.trim()).toBe('JUL');
      expect(firstRowCells[1].textContent?.trim()).toBe('');
      expect(firstRowCells[2].textContent?.trim()).toBe('');
      expect(firstRowCells[3].textContent?.trim()).toBe('1');

      const renderedDates = Array.from(
        document.querySelectorAll<HTMLButtonElement>('.mr-datepicker-day[data-date]')
      ).map(button => button.dataset['date']);

      expect(renderedDates).toHaveLength(31);
      expect(renderedDates.every(date => date?.startsWith('2026-07-'))).toBeTruthy();
    });

    const monthStartCases: Array<[string, number, number]> = [
      ['2026-06-15T00:00:00', 1, 0], // Monday
      ['2026-09-15T00:00:00', 2, 0], // Tuesday
      ['2026-08-15T00:00:00', 6, 0], // Saturday
      ['2026-11-15T00:00:00', 0, 1]  // Sunday
    ];

    it.each(monthStartCases)(
      'should place day 1 in the correct Sunday-first column for %s',
      (value, expectedColumn, expectedRow) => {
        component.writeValue(value);

        const row = component.grid[expectedRow];

        expect(row[expectedColumn]?.day).toBe(1);
        expect(component.grid.every(week => week.length === 7)).toBeTruthy();
      }
    );

    it('should expose weekday headings in Sunday-first order', () => {
      const mondayFirstWeekdays = Info.weekdays('long');

      expect(component.daysOfWeek.map(day => day.long)).toEqual([
        mondayFirstWeekdays[6],
        ...mondayFirstWeekdays.slice(0, 6)
      ]);
    });
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

  it('should select a date and NOT close the calendar', () => {
    const onChangeSpy = vi.fn();
    component.registerOnChange(onChangeSpy);
    (component as any).isOpen.set(true);

    const today = DateTime.now().startOf('day');
    (component as any).selectDate(today);

    expect(component.selectedDate?.hasSame(today, 'day')).toBeTruthy();
    expect(onChangeSpy).toHaveBeenCalledWith(today.toISO());
    expect((component as any).isOpen()).toBeTruthy();
  });

  it('should update time', () => {
    const onChangeSpy = vi.fn();
    component.registerOnChange(onChangeSpy);

    const today = DateTime.now().startOf('day');
    (component as any).selectDate(today);

    (component as any).updateTime('hour', 14);
    (component as any).updateTime('minute', 30);
    (component as any).updateTime('second', 45);

    expect(component.selectedDate?.hour).toBe(14);
    expect(component.selectedDate?.minute).toBe(30);
    expect(component.selectedDate?.second).toBe(45);
    expect(onChangeSpy).toHaveBeenLastCalledWith(component.selectedDate?.toISO());
  });

  it('should increment and decrement time', () => {
    const today = DateTime.now().startOf('day').set({ hour: 10, minute: 30, second: 30 });
    (component as any).selectedDate = today;

    (component as any).incrementTime('hour');
    expect(component.selectedDate?.hour).toBe(11);

    (component as any).decrementTime('hour');
    expect(component.selectedDate?.hour).toBe(10);

    // Test wrap around
    (component as any).updateTime('hour', 23);
    (component as any).incrementTime('hour');
    expect(component.selectedDate?.hour).toBe(0);

    (component as any).decrementTime('hour');
    expect(component.selectedDate?.hour).toBe(23);
  });

  it('should return correct previous and next time values', () => {
    (component as any).selectedDate = DateTime.now().startOf('day').set({ hour: 10 });

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

    expect(component.selectedDate?.toISO()).toBe(DateTime.fromISO(testDate).toISO());
    expect(component.viewDate.hasSame(DateTime.fromISO(testDate), 'month')).toBeTruthy();
  });

  describe('Manual Input', () => {
    it('should allow entering date manually', () => {
      const input = fixture.nativeElement.querySelector('input');
      expect(input.readOnly).toBeFalsy();

      const testDateStr = '24.12.2023 18:00:00 Uhr';
      input.value = testDateStr;
      input.dispatchEvent(new Event('change'));
      fixture.detectChanges();

      const expectedDate = DateTime.fromFormat(testDateStr, (component as any).dateFormat);
      expect(component.selectedDate?.toISODate()).toBe(expectedDate.toISODate());
      expect(component.selectedDate?.hour).toBe(18);
      expect(component.selectedDate?.minute).toBe(0);
      expect(component.selectedDate?.second).toBe(0);
    });

    it('should reject invalid date input and revert to previous value', () => {
      const input = fixture.nativeElement.querySelector('input');

      // Set a valid date first
      const initialDateStr = '01.01.2024 10:00:00 Uhr';
      input.value = initialDateStr;
      input.dispatchEvent(new Event('change'));
      fixture.detectChanges();

      expect(component.selectedDate?.year).toBe(2024);

      // Enter invalid date
      input.value = 'invalid date';
      input.dispatchEvent(new Event('change'));
      fixture.detectChanges();

      // Should still be the initial date
      expect(component.selectedDate?.year).toBe(2024);
      // Input should be reverted
      expect(input.value).toBe(initialDateStr);
    });

    it('should open calendar on enter even if value changed', () => {
      const input = fixture.nativeElement.querySelector('input');
      const testDateStr = '24.12.2023 18:00:00 Uhr';
      input.value = testDateStr;

      // Simulate Enter key
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      input.dispatchEvent(new Event('change'));

      fixture.detectChanges();

      expect((component as any).isOpen()).toBeTruthy();
      const expectedDate = DateTime.fromFormat(testDateStr, (component as any).dateFormat);
      expect(component.selectedDate?.toISODate()).toBe(expectedDate.toISODate());
    });
  });

  it('should have correct accessibility attributes', () => {
    const label = fixture.nativeElement.querySelector('.mr-datepicker-label');
    const input = fixture.nativeElement.querySelector('input');
    const button = fixture.nativeElement.querySelector('.mr-datepicker-icon');

    expect(label.textContent).toContain(component.label);
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

    expect(component.selectedDate?.hour).toBe(15);
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
    expect(component.selectedDate?.hour).toBe(23); // Clamped to max
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
});
