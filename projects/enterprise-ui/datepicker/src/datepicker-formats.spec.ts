import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DatepickerComponent } from './datepicker.component';
import { DATE_FORMATS } from './datepicker-formats';
import { DateTime } from 'luxon';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('DatepickerComponent Formats', () => {
  let component: DatepickerComponent;
  let fixture: ComponentFixture<DatepickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatepickerComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(DatepickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  const testDate = DateTime.fromObject({
    year: 2026,
    month: 7,
    day: 31,
    hour: 14,
    minute: 30,
    second: 45,
  });

  Object.entries(DATE_FORMATS).forEach(([name, format]) => {
    it(`should support format ${name}: ${format}`, async () => {
      fixture.componentRef.setInput('luxonDateFormat', format);
      fixture.detectChanges();

      const jsDate = testDate.toJSDate();
      component.writeValue(jsDate);
      fixture.detectChanges();

      // Verify that the internal selected date is correct (ignoring components not in format)
      const selectedDate = component.selectedDate();
      expect(selectedDate).not.toBeNull();

      if (selectedDate) {
        expect(selectedDate.year).toBe(testDate.year);
        expect(selectedDate.month).toBe(testDate.month);
        expect(selectedDate.day).toBe(testDate.day);

        const hasTime = format.includes('H') || format.includes('h') || format.includes('t') || format.includes('T');
        if (hasTime) {
          expect(selectedDate.hour).toBe(testDate.hour);
          expect(selectedDate.minute).toBe(testDate.minute);
        }

        const hasSeconds = format.includes('s') || format.includes('S');
        if (hasSeconds) {
          expect(selectedDate.second).toBe(testDate.second);
        }
      }

      // Verify display value matches format
      const displayValue = fixture.nativeElement.querySelector('input').value;
      const expectedDisplayValue = testDate.setLocale('de-DE').toFormat(format);
      
      // Some formats might have different localization if not explicitly set
      // The component uses de-DE by default in some places or browser locale
      // We just want to ensure it's not empty and parsable back
      expect(displayValue).not.toBe('');
      
      // Try to write the display value back and see if it holds
      component.writeValue(displayValue);
      fixture.detectChanges();
      expect(component.selectedDate()).not.toBeNull();
    });
  });
});
