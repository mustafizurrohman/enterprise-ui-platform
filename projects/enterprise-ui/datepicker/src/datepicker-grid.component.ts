import {
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
  viewChildren,
} from '@angular/core';
import { DateTime } from 'luxon';
import {
  type DatepickerGridContext,
  type DatepickerGridKeydown,
  type DatepickerWeek,
} from './datepicker-grid.types';
import { DatepickerIdService } from './datepicker-id.service';

/**
 * Component that renders a grid of dates for the datepicker.
 */
@Component({
  selector: 'datepicker-grid',
  standalone: true,
  templateUrl: './datepicker-grid.component.html',
  styleUrl: './datepicker-grid.component.scss',
})
export class DatepickerGridComponent {
  private readonly idService = inject(DatepickerIdService);
  private readonly calendarDayButtons = viewChildren<ElementRef<HTMLButtonElement>>('calendarDay');

  /** The context containing all necessary data to render the grid. */
  readonly context = input.required<DatepickerGridContext>();

  /** Event emitted when a date is selected. */
  readonly dateSelected = output<DateTime>();

  /** Event emitted when a date is focused. */
  readonly dateFocused = output<DateTime>();

  /** Event emitted when a keydown event occurs on a date cell. */
  readonly dateKeydown = output<DatepickerGridKeydown>();

  /** The ID of the grid. */
  protected readonly gridId = computed(() => this.context().gridId);

  /** The days of the week to display in the header. */
  protected readonly daysOfWeek = computed(() => this.context().daysOfWeek);

  /** The weeks and days to display in the grid. */
  protected readonly weeks = computed(() => this.context().weeks);

  /** The currently selected date. */
  protected readonly selectedDate = computed(() => this.context().selectedDate);

  /** The currently active (focused) date. */
  protected readonly activeDate = computed(() => this.context().activeDate);

  /** Today's date. */
  protected readonly today = computed(() => this.context().today);

  /** The date currently being viewed. */
  protected readonly viewDate = computed(() => this.context().viewDate);

  /** The ID of the month heading for accessibility. */
  protected readonly monthHeadingId = computed(() => this.context().monthHeadingId);

  /** The prefix for test IDs. */
  protected readonly testIdPrefix = computed(() => this.context().testIdPrefix);

  /** The locale to use for formatting. */
  protected readonly locale = computed(() => this.context().locale);

  /** Predicate to determine if a date is disabled. */
  protected readonly dateDisabledPredicate = computed(() => this.context().isDateDisabled);

  /**
   * Focuses the button for the given date.
   * @param date The date to focus.
   * @returns Whether the focus was successful.
   */
  focusDate(date: DateTime): boolean {
    const isoDate = date.toISODate();

    if (!isoDate) {
      return false;
    }

    const button = this.calendarDayButtons().find(
      ({ nativeElement }) => nativeElement.dataset['date'] === isoDate,
    )?.nativeElement;

    if (!button || button.disabled) {
      return false;
    }

    button.focus({ preventScroll: true });
    return button.ownerDocument.activeElement === button;
  }

  /**
   * Emits the dateSelected event if the date is not disabled.
   * @param date The date to select.
   */
  protected selectDate(date: DateTime): void {
    if (!this.isDateDisabled(date)) {
      this.dateSelected.emit(date);
    }
  }

  /**
   * Emits the dateFocused event if the date is not disabled.
   * @param date The date to focus.
   */
  protected focusDateCell(date: DateTime): void {
    if (!this.isDateDisabled(date)) {
      this.dateFocused.emit(date);
    }
  }

  /**
   * Emits the dateKeydown event.
   * @param event The keyboard event.
   * @param date The date associated with the event.
   */
  protected handleDateKeydown(event: KeyboardEvent, date: DateTime): void {
    this.dateKeydown.emit({ event, date });
  }

  /**
   * Checks if the given date is selected.
   * @param date The date to check.
   * @returns True if the date is selected.
   */
  protected isSelected(date: DateTime): boolean {
    return !!this.selectedDate()?.hasSame(date, 'day');
  }

  /**
   * Checks if the given date is today.
   * @param date The date to check.
   * @returns True if the date is today.
   */
  protected isToday(date: DateTime | null): boolean {
    return !!date?.hasSame(this.today(), 'day');
  }

  /**
   * Checks if the given date is the active date.
   * @param date The date to check.
   * @returns True if the date is active.
   */
  protected isActiveDate(date: DateTime): boolean {
    return this.activeDate().hasSame(date, 'day');
  }

  /**
   * Checks if the given date is disabled.
   * @param date The date to check.
   * @returns True if the date is disabled.
   */
  protected isDateDisabled(date: DateTime): boolean {
    return this.dateDisabledPredicate()(date);
  }

  /**
   * Checks if the given week contains today.
   * @param week The week to check.
   * @returns True if the week contains today.
   */
  protected isCurrentWeek(week: DatepickerWeek): boolean {
    return week.days.some((day) => this.isToday(day));
  }

  /**
   * Gets the accessible label for a week.
   * @param week The week to get the label for.
   * @returns The week label or null if the week has no dates.
   */
  protected weekLabel(week: DatepickerWeek): string | null {
    if (!this.hasDates(week)) {
      return null;
    }

    return this.isCurrentWeek(week)
      ? `Aktuelle Kalenderwoche ${week.weekNumber}`
      : `Kalenderwoche ${week.weekNumber}`;
  }

  /**
   * Checks if the week has any non-null dates.
   * @param week The week to check.
   * @returns True if the week has dates.
   */
  protected hasDates(week: DatepickerWeek): boolean {
    return week.days.some((day) => day !== null);
  }

  /**
   * Checks if the given weekday is today's weekday in the current month view.
   * @param weekday The weekday number (1-7).
   * @returns True if it is the current weekday.
   */
  protected isCurrentWeekday(weekday: number): boolean {
    return this.today().weekday === weekday && this.today().hasSame(this.viewDate(), 'month');
  }

  /**
   * Gets a localized accessible label for a date.
   * @param date The date to format.
   * @returns The formatted date string.
   */
  protected getAccessibleDateLabel(date: DateTime): string {
    return date.setLocale(this.locale()).toLocaleString({
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  /**
   * Returns the ISO date string for a date, or a timestamp if ISO is not available.
   * @param date The date to convert.
   * @returns The ISO date string or timestamp.
   */
  protected dateIso(date: DateTime): string {
    return date.toISODate() ?? String(date.toMillis());
  }

  /**
   * Formats a number to a two-digit string.
   * @param value The number to format.
   * @returns The formatted string.
   */
  protected formatTwoDigits(value: number): string {
    return value.toString().padStart(2, '0');
  }

  /**
   * Generates a unique ID for a specific part of the grid.
   * @param part The part name.
   * @returns The generated ID.
   */
  protected idFor(part: string): string {
    return this.idService.idFor(part, this.gridId());
  }

  /**
   * Generates a test ID for a specific part of the grid.
   * @param part The part name.
   * @returns The generated test ID.
   */
  protected testIdFor(part: string): string {
    return this.idService.testIdFor(part, this.testIdPrefix());
  }
}
