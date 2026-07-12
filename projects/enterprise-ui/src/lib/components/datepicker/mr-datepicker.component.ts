import {
  booleanAttribute,
  Component,
  computed,
  ElementRef,
  forwardRef,
  input,
  signal,
  viewChildren
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

  readonly label = input<string>('Datum auswählen');
  readonly dateOnly = input(false, { transform: booleanAttribute });
  readonly showSeconds = input(false, { transform: booleanAttribute });
  readonly today = input<DateTime>(DateTime.now());

  readonly disabledInput = input(false, { transform: booleanAttribute, alias: 'disabled' });
  private readonly _disabledForm = signal(false);
  protected readonly disabled = computed(() => this.disabledInput() || this._disabledForm());

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

  protected readonly dateFormat = computed(() => {
    if (this.dateOnly()) {
      return 'dd.MM.yyyy';
    }
    return this.showSeconds() ? "dd.MM.yyyy HH:mm:ss 'Uhr'" : "dd.MM.yyyy HH:mm 'Uhr'";
  });

  protected readonly dateFormatDescription = computed(() => {
    if (this.dateOnly()) {
      return 'TT.MM.JJJJ';
    }
    return this.showSeconds() ? 'TT.MM.JJJJ HH:MM:SS Uhr' : 'TT.MM.JJJJ HH:MM Uhr';
  });


  protected readonly hours = Array.from({ length: 24 }, (_, index) => index);
  protected readonly minutesAndSeconds = Array.from({ length: 60 }, (_, index) => index);

  readonly selectedDate = signal<DateTime | null>(null);
  readonly viewDate = signal<DateTime>(DateTime.now());
  protected readonly isOpen = signal(false);
  protected readonly activeDate = signal(DateTime.local().startOf('day'));
  protected readonly timeAnnouncement = signal('');

  private readonly calendarDayButtons = viewChildren<ElementRef<HTMLButtonElement>>('calendarDay');

  protected readonly overlayPositions: ConnectedPosition[] = [
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
      offsetY: 8,
    },
    {
      originX: 'end',
      originY: 'bottom',
      overlayX: 'end',
      overlayY: 'top',
      offsetY: 8,
    },
    {
      originX: 'start',
      originY: 'top',
      overlayX: 'start',
      overlayY: 'bottom',
      offsetY: -8,
    },
    {
      originX: 'end',
      originY: 'top',
      overlayX: 'end',
      overlayY: 'bottom',
      offsetY: -8,
    },
  ];

  daysOfWeek = Info.weekdays('short', { locale: 'de' }).map((short, i) => ({
    short,
    long: Info.weekdays('long', { locale: 'de' })[i],
    weekday: i + 1,
  }));

  protected readonly monthAbbreviation = computed(() =>
    this.viewDate().startOf('month').setLocale('de').toFormat('LLL').toUpperCase(),
  );

  readonly grid = computed(() => {
    const startOfMonth = this.viewDate().startOf('month');
    const daysInMonth = startOfMonth.daysInMonth ?? 0;
    const firstDayWeekday = startOfMonth.weekday;

    // Monday-based index: 0 = Mon, 6 = Sun
    const mondayBasedFirstDayIndex = firstDayWeekday - 1;

    // The first cell is always reserved for the month abbreviation.
    // A month beginning on Monday therefore starts in the first column
    // of the following row; all other months keep day 1 in its weekday column.
    const leadingCellCount = mondayBasedFirstDayIndex === 0 ? 7 : mondayBasedFirstDayIndex;

    const cells: (DateTime | null)[] = Array.from({ length: leadingCellCount }, () => null);

    for (let day = 1; day <= daysInMonth; day++) {
      cells.push(startOfMonth.set({ day }));
    }

    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    const gridResult: { weekNumber: number; days: (DateTime | null)[] }[] = [];
    for (let i = 0; i < cells.length; i += 7) {
      const weekDays = cells.slice(i, i + 7);
      const firstDate = weekDays.find((d) => d !== null);
      const weekNumber = firstDate
        ? firstDate.weekNumber
        : startOfMonth.minus({ weeks: 1 }).weekNumber;

      gridResult.push({ weekNumber, days: weekDays });
    }
    return gridResult;
  });

  onChange: (value: string | null) => void = () => {};
  onTouched: () => void = () => {};

  constructor() {}

  protected openCalendar(): void {
    if (this.disabled()) {
      return;
    }
    this.isOpen.set(true);
    if (this.selectedDate()) {
      this.viewDate.set(this.selectedDate()!);
    }
  }

  protected onOverlayAttached(): void {
    const initialDate = this.selectedDate()?.startOf('day') ?? DateTime.local().startOf('day');

    this.activeDate.set(initialDate as any);

    if (!this.viewDate().hasSame(initialDate as any, 'month')) {
      this.viewDate.set((initialDate as any).startOf('month'));
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

    const activeButton = this.calendarDayButtons().find(
      ({ nativeElement }) => nativeElement.dataset['date'] === isoDate,
    );

    activeButton?.nativeElement.focus();
  }

  protected closeCalendar(): void {
    this.isOpen.set(false);
  }

  protected toggleCalendar(): void {
    if (this.disabled()) {
      return;
    }
    this.isOpen.update((isOpen) => !isOpen);
    if (this.isOpen() && this.selectedDate()) {
      this.viewDate.set(this.selectedDate()!);
    }
  }

  protected handleOverlayKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeCalendar();
    }
  }

  protected handleCalendarKeydown(event: KeyboardEvent, date: DateTime): void {
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
          days: date.weekday - 1,
        });
        break;

      case 'End':
        nextDate = date.plus({
          days: 7 - date.weekday,
        });
        break;

      case 'PageUp':
        nextDate = event.shiftKey ? date.minus({ years: 1 }) : date.minus({ months: 1 });
        break;

      case 'PageDown':
        nextDate = event.shiftKey ? date.plus({ years: 1 }) : date.plus({ months: 1 });
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

    if (!this.viewDate().hasSame(normalizedDate as any, 'month')) {
      this.viewDate.set((normalizedDate as any).startOf('month'));
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
    this.viewDate.update((d) => d.minus({ months: 1 }));
  }

  nextMonth(): void {
    this.viewDate.update((d) => d.plus({ months: 1 }));
  }

  protected selectDate(date: DateTime): void {
    let newSelectedDate: DateTime;
    if (this.dateOnly()) {
      newSelectedDate = date.startOf('day');
    } else if (this.selectedDate()) {
      const current = this.selectedDate()!;
      newSelectedDate = date.set({
        hour: current.hour,
        minute: current.minute,
        second: this.showSeconds() ? current.second : 0,
      });
    } else {
      newSelectedDate = this.showSeconds() ? date : date.set({ second: 0 });
    }

    this.selectedDate.set(newSelectedDate);
    this.onChange(newSelectedDate.toISO());
  }

  protected selectNow(): void {
    let now = DateTime.now();
    if (this.dateOnly()) {
      now = now.startOf('day');
    } else if (!this.showSeconds()) {
      now = now.set({ second: 0, millisecond: 0 });
    }
    this.selectedDate.set(now);
    this.onChange(now.toISO());
    this.closeCalendar();
  }

  protected onManualInput(input: HTMLInputElement): void {
    const value = input.value;
    const parsedDate = DateTime.fromFormat(value, this.dateFormat());

    if (parsedDate.isValid) {
      this.selectedDate.set(parsedDate);
      this.viewDate.set(parsedDate);
      this.onChange(parsedDate.toISO());
    } else {
      input.value = this.selectedDate() ? this.selectedDate()!.toFormat(this.dateFormat()) : '';
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

    const currentDate = this.selectedDate() ?? DateTime.local().startOf('day');

    const newDate = currentDate.set({
      [unit]: normalizedValue,
    });
    this.selectedDate.set(newDate);
    this.onChange(newDate.toISO());
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
    const date = this.selectedDate();

    if (!date) {
      return;
    }

    let announcement =
      `Uhrzeit ${this.formatTimeValue(date.hour)} Uhr, ` +
      `${this.formatTimeValue(date.minute)} Minuten`;

    if (this.showSeconds()) {
      announcement += ` und ${this.formatTimeValue(date.second)} Sekunden`;
    }

    this.timeAnnouncement.set(announcement);
  }

  protected incrementTime(unit: TimeUnit): void {
    this.changeTime(unit, 1);
  }

  protected decrementTime(unit: TimeUnit): void {
    this.changeTime(unit, -1);
  }

  protected previousTimeValue(unit: TimeUnit): string {
    return this.formatTimeValue(this.normalizeTimeValue(unit, this.getTimeValue(unit) - 1));
  }

  protected nextTimeValue(unit: TimeUnit): string {
    return this.formatTimeValue(this.normalizeTimeValue(unit, this.getTimeValue(unit) + 1));
  }

  protected formatTimeValue(value: number): string {
    return String(value).padStart(2, '0');
  }

  private changeTime(unit: TimeUnit, difference: number): void {
    const nextValue = this.normalizeTimeValue(unit, this.getTimeValue(unit) + difference);

    this.updateTime(unit, nextValue);
  }

  private getTimeValue(unit: TimeUnit): number {
    return this.selectedDate()?.[unit] ?? 0;
  }

  private normalizeTimeValue(unit: TimeUnit, value: number): number {
    const range = unit === 'hour' ? 24 : 60;

    return ((value % range) + range) % range;
  }

  writeValue(value: string | null): void {
    if (value) {
      let date = DateTime.fromISO(value);
      if (!date.isValid) {
        date = DateTime.fromSQL(value); // Fallback for some formats
      }
      if (date.isValid) {
        if (this.dateOnly()) {
          date = date.startOf('day');
        } else if (!this.showSeconds()) {
          date = date.set({ second: 0, millisecond: 0 });
        }

        this.selectedDate.set(date);
        this.viewDate.set(date);
      } else {
        this.selectedDate.set(null);
        this.viewDate.set(DateTime.now());
      }
    } else {
      this.selectedDate.set(null);
      this.viewDate.set(DateTime.now());
    }
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this._disabledForm.set(isDisabled);
  }

  isSelected(date: DateTime | null): boolean {
    if (!date || !this.selectedDate()) return false;
    return date.hasSame(this.selectedDate()!, 'day');
  }

  isToday(date: DateTime | null): boolean {
    if (!date) return false;
    return date.hasSame(this.today(), 'day');
  }

  protected isCurrentWeek(weekInfo: { weekNumber: number; days: (DateTime | null)[] }): boolean {
    return weekInfo.days.some((day) => this.isToday(day));
  }

  protected isCurrentWeekday(weekday: number): boolean {
    return this.today().weekday === weekday && this.today().hasSame(this.viewDate(), 'month');
  }

  protected getAccessibleDateLabel(date: DateTime): string {
    const formattedDate = date.setLocale('de').toLocaleString({
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const states: string[] = [];

    if (this.isToday(date)) {
      states.push('heute');
    }

    if (this.isSelected(date)) {
      states.push('ausgewählt');
    }

    return states.length > 0 ? `${formattedDate}, ${states.join(', ')}` : formattedDate;
  }

  protected hasInputError(): boolean {
    return false; // Implement validation logic if needed
  }

  protected readonly inputDescriptionIds = computed(() =>
    this.hasInputError() ? `${this.inputHintId} ${this.inputErrorId}` : this.inputHintId,
  );
}
