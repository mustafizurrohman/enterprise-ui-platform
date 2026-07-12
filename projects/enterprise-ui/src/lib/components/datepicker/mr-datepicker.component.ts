import {
  Component,
  ElementRef,
  forwardRef,
  Input,
  QueryList,
  signal,
  ViewChildren
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { A11yModule } from '@angular/cdk/a11y';
import { DateTime, Info } from 'luxon';

type TimeUnit = 'hour' | 'minute' | 'second';

@Component({
  selector: 'mr-datepicker',
  standalone: true,
  imports: [CommonModule, OverlayModule, A11yModule, FormsModule],
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
  private static nextId = 0;
  private readonly componentId = `mr-datepicker-${MrDatepickerComponent.nextId++}`;

  @Input() label: string = 'Datum auswählen';
  @Input() placeholder: string = 'Select date';

  protected readonly inputId = `${this.componentId}-input`;
  protected readonly inputHintId = `${this.componentId}-hint`;
  protected readonly inputErrorId = `${this.componentId}-error`;
  protected readonly dialogId = `${this.componentId}-dialog`;
  protected readonly dialogTitleId = `${this.componentId}-dialog-title`;
  protected readonly dialogDescriptionId = `${this.componentId}-dialog-description`;
  protected readonly monthHeadingId = `${this.componentId}-month-heading`;
  protected readonly hourSelectId = `${this.componentId}-hour`;
  protected readonly minuteSelectId = `${this.componentId}-minute`;
  protected readonly secondSelectId = `${this.componentId}-second`;
  protected readonly hourLabelId = `${this.componentId}-hour-label`;
  protected readonly minuteLabelId = `${this.componentId}-minute-label`;
  protected readonly secondLabelId = `${this.componentId}-second-label`;

  protected readonly dateFormat = "dd.MM.yyyy HH:mm:ss 'Uhr'";
  protected readonly dateFormatDescription = 'TT.MM.JJJJ HH:MM:SS Uhr';

  protected readonly hours = Array.from({ length: 24 }, (_, index) => index);
  protected readonly minutesAndSeconds = Array.from(
    { length: 60 },
    (_, index) => index
  );

  selectedDate: DateTime | null = null;
  viewDate: DateTime = DateTime.now();
  protected readonly isOpen = signal(false);
  protected readonly activeDate = signal(DateTime.local().startOf('day'));
  protected readonly timeAnnouncement = signal('');

  @ViewChildren('calendarDay', { read: ElementRef })
  private calendarDayButtons!: QueryList<ElementRef<HTMLButtonElement>>;

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

  daysOfWeek = [
    { short: Info.weekdays('short')[0], long: Info.weekdays('long')[0] }, // Mon
    { short: Info.weekdays('short')[1], long: Info.weekdays('long')[1] }, // Tue
    { short: Info.weekdays('short')[2], long: Info.weekdays('long')[2] }, // Wed
    { short: Info.weekdays('short')[3], long: Info.weekdays('long')[3] }, // Thu
    { short: Info.weekdays('short')[4], long: Info.weekdays('long')[4] }, // Fri
    { short: Info.weekdays('short')[5], long: Info.weekdays('long')[5] }, // Sat
    { short: Info.weekdays('short')[6], long: Info.weekdays('long')[6] }, // Sun
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

  protected onOverlayAttached(): void {
    const initialDate =
      this.selectedDate?.startOf('day') ??
      DateTime.local().startOf('day');

    this.activeDate.set(initialDate as any);

    if (!this.viewDate.hasSame(initialDate as any, 'month')) {
      this.viewDate = (initialDate as any).startOf('month');
      this.generateGrid();
    }

    requestAnimationFrame(() => {
      this.focusActiveDate();
    });
  }

  protected onOverlayDetached(): void {
    this.closeCalendar();
  }

  private focusActiveDate(): void {
    const isoDate = this.activeDate().toISODate();

    const activeButton = this.calendarDayButtons.find(
      ({ nativeElement }) =>
        nativeElement.dataset['date'] === isoDate
    );

    activeButton?.nativeElement.focus();
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
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeCalendar();
    }
  }

  protected handleCalendarKeydown(
    event: KeyboardEvent,
    date: DateTime
  ): void {
    let nextDate: DateTime | null = null;

    switch (event.key) {
      case 'ArrowLeft':
        nextDate = date.minus({ days: 1 });
        break;

      case 'ArrowRight':
        nextDate = date.plus({ days: 1 });
        break;

      case 'ArrowUp':
        nextDate = date.minus({ days: 7 });
        break;

      case 'ArrowDown':
        nextDate = date.plus({ days: 7 });
        break;

      case 'Home':
        nextDate = date.minus({
          days: date.weekday - 1
        });
        break;

      case 'End':
        nextDate = date.plus({
          days: 7 - date.weekday
        });
        break;

      case 'PageUp':
        nextDate = event.shiftKey
          ? date.minus({ years: 1 })
          : date.minus({ months: 1 });
        break;

      case 'PageDown':
        nextDate = event.shiftKey
          ? date.plus({ years: 1 })
          : date.plus({ months: 1 });
        break;

      case 'Escape':
        event.preventDefault();
        this.closeCalendar();
        return;

      default:
        return;
    }

    event.preventDefault();
    this.moveFocusToDate(nextDate);
  }

  private moveFocusToDate(date: DateTime): void {
    const normalizedDate = date.startOf('day');

    this.activeDate.set(normalizedDate as any);

    if (!this.viewDate.hasSame(normalizedDate as any, 'month')) {
      this.viewDate = (normalizedDate as any).startOf('month');
      this.generateGrid();
    }

    requestAnimationFrame(() => {
      this.focusActiveDate();
    });
  }

  protected isActiveDate(date: DateTime): boolean {
    return this.activeDate().hasSame(date, 'day');
  }

  protected setActiveDate(date: DateTime): void {
    this.activeDate.set(date.startOf('day') as any);
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

  protected onManualInput(input: HTMLInputElement): void {
    const value = input.value;
    const parsedDate = DateTime.fromFormat(value, this.dateFormat);

    if (parsedDate.isValid) {
      this.selectedDate = parsedDate;
      this.viewDate = parsedDate;
      this.generateGrid();
      this.onChange(this.selectedDate.toISO());
    } else {
      input.value = this.selectedDate ? this.selectedDate.toFormat(this.dateFormat) : '';
    }
    this.onTouched();
  }

  protected updateTime(unit: TimeUnit, rawValue: string | number): void {
    const value = Number(rawValue);

    if (isNaN(value) || !Number.isInteger(value)) {
      return;
    }

    const maximum = unit === 'hour' ? 23 : 59;
    const normalizedValue = Math.min(Math.max(value, 0), maximum);

    const currentDate = this.selectedDate ?? DateTime.local().startOf('day');

    this.selectedDate = currentDate.set({
      [unit]: normalizedValue
    });
    this.onChange(this.selectedDate.toISO());
    this.announceTime();
  }

  protected onTimeInput(unit: TimeUnit, event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/[^0-9]/g, '');
    
    if (value.length > 2) {
      value = value.slice(-2);
    }
    
    input.value = value;
    
    if (value.length > 0) {
      this.updateTime(unit, value);
    }
  }

  protected onTimeKeyDown(unit: TimeUnit, event: KeyboardEvent): void {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.incrementTime(unit);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.decrementTime(unit);
    }
  }

  private announceTime(): void {
    const date = this.selectedDate;

    if (!date) {
      return;
    }

    this.timeAnnouncement.set(
      `Uhrzeit ${this.formatTimeValue(date.hour)} Uhr, ` +
      `${this.formatTimeValue(date.minute)} Minuten und ` +
      `${this.formatTimeValue(date.second)} Sekunden`
    );
  }

  protected incrementTime(unit: TimeUnit): void {
    this.changeTime(unit, 1);
  }

  protected decrementTime(unit: TimeUnit): void {
    this.changeTime(unit, -1);
  }

  protected previousTimeValue(unit: TimeUnit): string {
    return this.formatTimeValue(
      this.normalizeTimeValue(unit, this.getTimeValue(unit) - 1)
    );
  }

  protected nextTimeValue(unit: TimeUnit): string {
    return this.formatTimeValue(
      this.normalizeTimeValue(unit, this.getTimeValue(unit) + 1)
    );
  }

  protected formatTimeValue(value: number): string {
    return String(value).padStart(2, '0');
  }

  private changeTime(unit: TimeUnit, difference: number): void {
    const nextValue = this.normalizeTimeValue(
      unit,
      this.getTimeValue(unit) + difference
    );

    this.updateTime(unit, nextValue);
  }

  private getTimeValue(unit: TimeUnit): number {
    return this.selectedDate?.[unit] ?? 0;
  }

  private normalizeTimeValue(unit: TimeUnit, value: number): number {
    const range = unit === 'hour' ? 24 : 60;

    return ((value % range) + range) % range;
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

    // If we want the grid to start on Monday
    // Monday (1) -> index 0, ..., Sunday (7) -> index 6.
    const firstDayIndex = startDay - 1;

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

  protected getAccessibleDateLabel(date: DateTime): string {
    const formattedDate = date
      .setLocale('de')
      .toLocaleString({
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

    const states: string[] = [];

    if (this.isToday(date)) {
      states.push('heute');
    }

    if (this.isSelected(date)) {
      states.push('ausgewählt');
    }

    return states.length > 0
      ? `${formattedDate}, ${states.join(', ')}`
      : formattedDate;
  }

  protected hasInputError(): boolean {
    return false; // Implement validation logic if needed
  }

  protected get inputDescriptionIds(): string {
    return this.hasInputError()
      ? `${this.inputHintId} ${this.inputErrorId}`
      : this.inputHintId;
  }
}
