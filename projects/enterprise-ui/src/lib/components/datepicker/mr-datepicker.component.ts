import { Component, forwardRef, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { DateTime, Info } from 'luxon';

@Component({
  selector: 'mr-datepicker',
  standalone: true,
  imports: [CommonModule, OverlayModule],
  templateUrl: './mr-datepicker.component.html',
  styleUrl: './mr-datepicker.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MrDatepickerComponent),
      multi: true,
    },
  ],
})
export class MrDatepickerComponent implements ControlValueAccessor {
  @Input() placeholder: string = 'Select date';

  selectedDate: DateTime | null = null;
  viewDate: DateTime = DateTime.now();
  protected readonly isOpen = signal(false);

  protected readonly overlayPositions: ConnectedPosition[] = [
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
      offsetY: 8
    },
    {
      originX: 'end',
      originY: 'bottom',
      overlayX: 'end',
      overlayY: 'top',
      offsetY: 8
    },
    {
      originX: 'start',
      originY: 'top',
      overlayX: 'start',
      overlayY: 'bottom',
      offsetY: -8
    },
    {
      originX: 'end',
      originY: 'top',
      overlayX: 'end',
      overlayY: 'bottom',
      offsetY: -8
    }
  ];

  daysOfWeek: string[] = [
    Info.weekdays('short')[6], // Sunday
    ...Info.weekdays('short').slice(0, 6),
  ];
  grid: (DateTime | null)[][] = [];

  onChange: (value: string | null) => void = () => {};
  onTouched: () => void = () => {};

  constructor() {
    this.generateGrid();
  }

  protected openCalendar(): void {
    this.isOpen.set(true);
    if (this.selectedDate) {
      this.viewDate = this.selectedDate;
      this.generateGrid();
    }
  }

  protected closeCalendar(): void {
    this.isOpen.set(false);
  }

  protected toggleCalendar(): void {
    this.isOpen.update(isOpen => !isOpen);
    if (this.isOpen() && this.selectedDate) {
      this.viewDate = this.selectedDate;
      this.generateGrid();
    }
  }

  protected handleOverlayKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape') {
      return;
    }

    event.preventDefault();
    this.closeCalendar();
  }

  prevMonth(): void {
    this.viewDate = this.viewDate.minus({ months: 1 });
    this.generateGrid();
  }

  nextMonth(): void {
    this.viewDate = this.viewDate.plus({ months: 1 });
    this.generateGrid();
  }

  protected selectDate(date: DateTime): void {
    if (this.selectedDate) {
      this.selectedDate = date.set({
        hour: this.selectedDate.hour,
        minute: this.selectedDate.minute,
        second: this.selectedDate.second
      });
    } else {
      this.selectedDate = date;
    }
    this.onChange(this.selectedDate.toISO());
  }

  protected updateTime(type: 'hour' | 'minute' | 'second', value: number): void {
    if (!this.selectedDate) {
      this.selectedDate = DateTime.now().startOf('day');
    }
    this.selectedDate = this.selectedDate.set({ [type]: value });
    this.onChange(this.selectedDate.toISO());
  }

  writeValue(value: string | null): void {
    if (value) {
      this.selectedDate = DateTime.fromISO(value);
      if (!this.selectedDate.isValid) {
        this.selectedDate = DateTime.fromSQL(value); // Fallback for some formats
      }
      if (this.selectedDate.isValid) {
        this.viewDate = this.selectedDate;
      } else {
        this.selectedDate = null;
        this.viewDate = DateTime.now();
      }
    } else {
      this.selectedDate = null;
      this.viewDate = DateTime.now();
    }
    this.generateGrid();
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  private generateGrid(): void {
    const startOfMonth = this.viewDate.startOf('month');
    const endOfMonth = this.viewDate.endOf('month');

    // Start of the week for the first day of the month
    // Luxon weekdays are 1 (Monday) to 7 (Sunday)
    // We'll assume Sunday is 7 or 0?
    // Info.weekdays('short') usually starts with Monday in many locales.
    // Let's check startOfMonth.weekday
    let startDay = startOfMonth.weekday; // 1-7 (Mon-Sun)

    // If we want the grid to start on Sunday (standard for many datepickers)
    // Sunday is 7 in Luxon. We want it to be index 0.
    // Monday (1) -> index 1, ..., Saturday (6) -> index 6, Sunday (7) -> index 0.
    const firstDayIndex = startDay === 7 ? 0 : startDay;

    const days: (DateTime | null)[] = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }

    for (let i = 1; i <= endOfMonth.day; i++) {
      days.push(startOfMonth.set({ day: i }));
    }

    // Fill the rest of the last week with nulls
    while (days.length % 7 !== 0) {
      days.push(null);
    }

    this.grid = [];
    for (let i = 0; i < days.length; i += 7) {
      this.grid.push(days.slice(i, i + 7));
    }
  }

  isSelected(date: DateTime | null): boolean {
    if (!date || !this.selectedDate) return false;
    return date.hasSame(this.selectedDate, 'day');
  }

  isToday(date: DateTime | null): boolean {
    if (!date) return false;
    return date.hasSame(DateTime.now(), 'day');
  }
}
