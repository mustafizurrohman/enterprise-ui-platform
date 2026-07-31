import {
  booleanAttribute,
  Component,
  computed,
  effect,
  ElementRef,
  forwardRef,
  inject,
  Injector,
  input,
  model,
  type OnDestroy,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  type ControlValueAccessor,
  FormsModule,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  NgControl,
  type ValidationErrors,
  type Validator,
} from '@angular/forms';
import {
  CdkConnectedOverlay,
  CdkOverlayOrigin,
  type ConnectedPosition,
} from '@angular/cdk/overlay';
import { MatIconModule } from '@angular/material/icon';
import { DateTime, Info } from 'luxon';
import { DatepickerDialogComponent } from './datepicker-dialog.component';
import type { DatepickerDialogContext } from './datepicker-dialog.types';
import type { DatepickerWeek } from './datepicker-grid.types';
import type { TimeUnit } from './time-unit-control.types';
import type { DateInputAutocompleteResult } from './luxon-date-input-autocomplete.types';
import { LuxonDateInputAutocomplete } from './luxon-date-input-autocomplete';
import { DatepickerParserService } from './datepicker-parser.service';
import { DatepickerIdService } from './datepicker-id.service';
import {
  buildCalendarWeeks,
  getLuxonFormatCapabilities,
  normalizeDateForFormat,
  resolveDatepickerLocale,
} from './datepicker-date.utils';

/**
 * The main datepicker component providing a text input with autocomplete
 * and a dropdown calendar for date and time selection.
 * It supports various date formats, locales, and accessibility features.
 */
@Component({
  selector: 'datepicker',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CdkConnectedOverlay,
    CdkOverlayOrigin,
    MatIconModule,
    DatepickerDialogComponent,
  ],
  templateUrl: './datepicker.component.html',
  styleUrl: './datepicker.component.scss',
  providers: [
    DatepickerIdService,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatepickerComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => DatepickerComponent),
      multi: true,
    },
  ],
})
export class DatepickerComponent implements ControlValueAccessor, Validator, OnDestroy {
  // -------------------------------------------------------------------------
  // 1. Injected services
  // -------------------------------------------------------------------------

  /** Service for managing element IDs and test IDs. */
  private readonly idService = inject(DatepickerIdService);
  /** Injector instance for dynamic service resolution. */
  private readonly injector = inject(Injector);
  /** Service for parsing date and time input strings. */
  private readonly parser = inject(DatepickerParserService);

  // -------------------------------------------------------------------------
  // 2. Inputs & Models (documented)
  // -------------------------------------------------------------------------

  /** The label for the input field. */
  readonly label = input<string>('Datum auswählen');
  /** The date to be considered "today". Defaults to DateTime.now(). */
  readonly today = input<DateTime>(DateTime.now());
  /** An optional stable ID for testing purposes. */
  readonly testId = input<string | null>(null);
  /** The locale to use for formatting and parsing. Defaults to browser locale. */
  readonly locale = input<string | null>(null);
  /** An explicit Luxon format string for the date value. */
  readonly luxonDateFormat = input<string | null>(null);
  /** Alias for luxonDateFormat. */
  readonly dateFormatInput = input<string | null>(null, {
    alias: 'dateFormat',
  });
  /** Whether the component is disabled. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Whether to show quick time selection controls (e.g., +/- 15 min). */
  readonly showQuickTimeControls = input(false, {
    transform: booleanAttribute,
  });
  /** A filter function to disable specific dates in the calendar. */
  readonly dateFilter = input<(date: DateTime) => boolean>(() => true);
  /** The current value of the datepicker, supporting Date objects, ISO strings, or null. */
  readonly value = model<Date | string | null | undefined>(undefined);

  // -------------------------------------------------------------------------
  // 3. Internal state signals (documented)
  // -------------------------------------------------------------------------

  /** Whether the component is disabled via an Angular Form. */
  private readonly disabledByForm = signal(false);
  /** The currently selected date as a Luxon DateTime object. */
  readonly selectedDate = signal<DateTime | null>(null);
  /** The current value displayed in the text input. */
  protected readonly inputDisplayValue = signal('');
  /** Whether the current manual input is invalid. */
  private readonly manualInputError = signal(false);
  /** The date currently being viewed in the calendar dropdown. */
  readonly viewDate = signal<DateTime>(DateTime.now());
  /** Whether the calendar dropdown is currently open. */
  protected readonly isOpen = signal(false);
  /** The date currently having active focus in the calendar grid. */
  protected readonly activeDate = signal<DateTime>(DateTime.local().startOf('day'));
  /** SR announcement for the dialog. */
  protected readonly dialogAnnouncement = signal('');
  /** SR announcement for the input field. */
  protected readonly inputAnnouncement = signal('');

  // -------------------------------------------------------------------------
  // 4. Computed properties (documented)
  // -------------------------------------------------------------------------

  /** Combined disabled state from input and form. */
  protected readonly computedDisabled = computed(() => this.disabled() || this.disabledByForm());

  /** Resolved locale based on configuration and environment. */
  protected readonly resolvedLocale = computed(() => resolveDatepickerLocale(this.locale()));

  /** Collection of unique IDs for sub-elements. */
  protected readonly ids = this.idService.ids;
  /** The prefix used for test ID attributes. */
  protected readonly testIdPrefix = this.idService.testIdPrefix;

  /** The configured format string before validation. */
  private readonly configuredDateFormat = computed(
    () => this.luxonDateFormat() ?? this.dateFormatInput(),
  );

  /** The validated and resolved Luxon format string. */
  protected readonly dateFormat = computed(() =>
    LuxonDateInputAutocomplete.assertValidFormat(
      this.configuredDateFormat() ?? LuxonDateInputAutocomplete.DEFAULT_DATETIME_FORMAT,
      this.resolvedLocale(),
    ),
  );

  /** Capabilities inferred from the resolved date format. */
  private readonly dateFormatCapabilities = computed(() =>
    getLuxonFormatCapabilities(this.dateFormat(), this.resolvedLocale()),
  );

  /** Whether the format only includes date components. */
  readonly dateOnly = computed(() => !this.dateFormatCapabilities().hasTime);

  /** Whether the format includes seconds. */
  readonly showSeconds = computed(() => this.dateFormatCapabilities().hasSeconds);

  /** Whether the format uses a 12-hour clock. */
  readonly uses12HourClock = computed(() => this.dateFormatCapabilities().uses12HourClock);

  /** Whether the format requires a meridiem (AM/PM) indicator. */
  readonly showMeridiem = computed(() => this.dateFormatCapabilities().showMeridiem);

  /** Description of the expected date format for screen readers. */
  protected readonly dateFormatDescription = computed(() => this.dateFormat());

  /** Type description for screen readers. */
  protected readonly inputTypeDescription = computed(() =>
    this.dateOnly() ? 'Datumseingabe' : 'Datum- und Uhrzeiteingabe',
  );

  /** Placeholder text derived from the date format. */
  protected readonly placeholder = computed(() => this.dateFormat().replace(/'/g, ''));

  /** Accessible label for the calendar toggle button. */
  protected readonly calendarToggleLabel = computed(() => {
    if (this.isOpen()) {
      return 'Kalender schließen';
    }

    const baseLabel = this.dateOnly()
      ? 'Kalender zur Auswahl eines Datums öffnen'
      : 'Kalender zur Auswahl von Datum und Uhrzeit öffnen';
    const selectedDate = this.selectedDate();

    return selectedDate
      ? `${baseLabel}. Aktueller Wert: ${this.formatDate(selectedDate)}`
      : baseLabel;
  });

  /** Accessible label for the "Select Now" action. */
  protected readonly selectNowLabel = computed(() =>
    this.dateOnly() ? 'Heutiges Datum auswählen' : 'Aktuelles Datum und aktuelle Uhrzeit auswählen',
  );

  /** Title for the calendar dialog. */
  protected readonly dialogTitle = computed(() =>
    this.dateOnly() ? 'Datum auswählen' : 'Datum und Uhrzeit auswählen',
  );

  /** Formatted month and year for the calendar header. */
  protected readonly formattedMonth = computed(() =>
    this.viewDate().setLocale(this.resolvedLocale()).toFormat('LLLL yyyy'),
  );

  /** Autocomplete engine instance for manual input handling. */
  private readonly inputAutocomplete = computed(
    () => new LuxonDateInputAutocomplete(this.dateFormat(), this.resolvedLocale()),
  );

  /** List of weekdays for the grid header. */
  readonly daysOfWeek = computed(() => {
    const locale = this.resolvedLocale();
    const longWeekdays = Info.weekdays('long', { locale });

    return Info.weekdays('short', { locale }).map((short, index) => ({
      short,
      long: longWeekdays[index] ?? short,
      weekday: index + 1,
    }));
  });

  /** List of long month names for month selection. */
  readonly months = computed(() => Info.months('long', { locale: this.resolvedLocale() }));

  /** The calendar grid for the current view date. */
  readonly grid = computed(() => buildCalendarWeeks(this.viewDate()));

  /** Context object passed to the datepicker dialog component. */
  protected readonly dialogContext = computed<DatepickerDialogContext>(() => ({
    dialogId: this.ids().dialog,
    dialogTitleId: this.ids().dialogTitle,
    dialogDescriptionId: this.ids().dialogDescription,
    dialogStatusId: this.ids().dialogStatus,
    monthHeadingId: this.ids().monthHeading,
    hourSelectId: this.ids().hourSelect,
    minuteSelectId: this.ids().minuteSelect,
    secondSelectId: this.ids().secondSelect,
    hourLabelId: this.ids().hourLabel,
    minuteLabelId: this.ids().minuteLabel,
    secondLabelId: this.ids().secondLabel,
    meridiemGroupId: this.ids().meridiemGroup,
    meridiemLabelId: this.ids().meridiemLabel,
    meridiemAmId: this.ids().meridiemAm,
    meridiemPmId: this.ids().meridiemPm,
    dialogTitle: this.dialogTitle(),
    formattedMonth: this.formattedMonth(),
    months: this.months(),
    daysOfWeek: this.daysOfWeek(),
    weeks: this.grid(),
    selectedDate: this.selectedDate(),
    activeDate: this.activeDate(),
    today: this.today(),
    viewDate: this.viewDate(),
    testIdPrefix: this.testIdPrefix(),
    dateOnly: this.dateOnly(),
    showSeconds: this.showSeconds(),
    uses12HourClock: this.uses12HourClock(),
    showMeridiem: this.showMeridiem(),
    locale: this.resolvedLocale(),
    isDateDisabled: (date) => this.isDateDisabled(date),
    dialogAnnouncement: this.dialogAnnouncement(),
    showQuickTimeControls: this.showQuickTimeControls(),
  }));

  // -------------------------------------------------------------------------
  // 5. View queries & Overlay settings (documented)
  // -------------------------------------------------------------------------

  /** Reference to the native date input element. */
  private readonly dateInput = viewChild<ElementRef<HTMLInputElement>>('dateInput');
  /** Reference to the internal calendar dialog component. */
  private readonly calendarDialog = viewChild(DatepickerDialogComponent);

  /** Preferred positions for the overlay relative to the input trigger. */
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

  // -------------------------------------------------------------------------
  // 6. ControlValueAccessor & Validator methods (documented)
  // -------------------------------------------------------------------------

  /** Callback function called when the value changes. */
  onChange: (value: Date | null) => void = () => {};
  /** Callback function called when the control is touched. */
  onTouched: () => void = () => {};

  /** The NgControl instance associated with this component, if any. */
  protected get ngControl(): NgControl | null {
    if (!this.ngControlInstance) {
      this.ngControlInstance = this.injector.get(NgControl, null, {
        optional: true,
        self: true,
      });
    }
    return this.ngControlInstance;
  }

  /**
   * Sets the value of the control.
   * Part of ControlValueAccessor.
   */
  writeValue(value: Date | string | null | undefined): void {
    if (this.value() !== value) {
      this.value.set(value);
    }
    this.updateInternalState(value);
  }

  /**
   * Registers a callback for value changes.
   * Part of ControlValueAccessor.
   */
  registerOnChange(fn: (value: Date | null) => void): void {
    this.onChange = fn;
  }

  /**
   * Registers a callback for touched state.
   * Part of ControlValueAccessor.
   */
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  /**
   * Sets the disabled state from the form API.
   * Part of ControlValueAccessor.
   */
  setDisabledState(isDisabled: boolean): void {
    this.disabledByForm.set(isDisabled);
  }

  /**
   * Performs validation on the control value.
   * Part of Validator.
   */
  validate(control: AbstractControl): ValidationErrors | null {
    if (this.manualInputError()) {
      return { invalidDate: true };
    }
    const value = control.value;
    if (value === null || value === undefined || value === '') {
      return null;
    }
    let date: DateTime;
    if (value instanceof Date) {
      date = DateTime.fromJSDate(value);
    } else {
      date = DateTime.fromISO(value);
      if (!date.isValid) {
        date = DateTime.fromSQL(value);
      }
    }
    return date.isValid ? null : { invalidDate: true };
  }

  // -------------------------------------------------------------------------
  // 7. Public API (documented)
  // -------------------------------------------------------------------------

  /** Navigates the calendar view to the previous month. */
  prevMonth(): void {
    this.changeViewMonth(-1);
  }

  /** Navigates the calendar view to the next month. */
  nextMonth(): void {
    this.changeViewMonth(1);
  }

  /** Navigates the calendar view to the previous year. */
  prevYear(): void {
    this.changeViewYear(-1);
  }

  /** Navigates the calendar view to the next year. */
  nextYear(): void {
    this.changeViewYear(1);
  }

  /** Sets the calendar view to a specific month (1-12). */
  setMonth(month: number): void {
    this.updateCalendarView(this.viewDate().set({ month }));
  }

  /** Sets the calendar view to a specific year. */
  setYear(year: number): void {
    this.updateCalendarView(this.viewDate().set({ year }));
  }

  /** Checks if a specific date is currently selected. */
  isSelected(date: DateTime | null): boolean {
    const selectedDate = this.selectedDate();
    return !!date && !!selectedDate && date.hasSame(selectedDate, 'day');
  }

  /** Checks if a specific date matches the "today" input. */
  isToday(date: DateTime | null): boolean {
    return !!date && date.hasSame(this.today(), 'day');
  }

  /** Checks if a calendar week contains the current "today". */
  isCurrentWeek(week: DatepickerWeek): boolean {
    return week.days.some((day) => this.isToday(day));
  }

  /** Checks if a weekday index is the weekday of "today" in the current view. */
  isCurrentWeekday(weekday: number): boolean {
    return this.today().weekday === weekday && this.today().hasSame(this.viewDate(), 'month');
  }

  // -------------------------------------------------------------------------
  // 8. Lifecycle hooks (documented)
  // -------------------------------------------------------------------------

  constructor() {
    effect(() => {
      this.idService.setTestId(this.testId());
    });

    effect(() => {
      const externalValue = this.value();
      untracked(() => {
        this.updateInternalState(externalValue, true);
      });
    });

    effect(() => {
      const format = this.dateFormat();
      const locale = this.resolvedLocale();
      const dateOnly = this.dateOnly();
      const showSeconds = this.showSeconds();
      const selectedDate = this.selectedDate();

      untracked(() => {
        if (!selectedDate || this.manualInputError()) {
          return;
        }

        const normalizedDate = normalizeDateForFormat(selectedDate, dateOnly, showSeconds);

        if (normalizedDate.toMillis() !== selectedDate.toMillis()) {
          const jsDate = normalizedDate.toJSDate();

          this.selectedDate.set(normalizedDate);
          this.value.set(jsDate);
          this.onChange(jsDate);
        }

        this.inputDisplayValue.set(normalizedDate.setLocale(locale).toFormat(format));
      });
    });
  }

  /** Lifecycle hook: clean up background inert states when destroyed. */
  ngOnDestroy(): void {
    this.restoreModalBackground();
  }

  // -------------------------------------------------------------------------
  // 9. Internal helpers & event handlers (documented)
  // -------------------------------------------------------------------------

  /** Internal reference tracker for the NgControl. */
  private ngControlInstance: NgControl | null = null;
  /** Stores the element that had focus before opening the calendar for focus restoration. */
  private lastFocusedTrigger: HTMLElement | null = null;
  /** State storage for tracking elements that were made inert while the dialog was open. */
  private readonly modalBackgroundState = new Map<HTMLElement, boolean>();

  /** Updates internal signals and UI based on external value changes. */
  private updateInternalState(value: Date | string | null | undefined, emit = false): void {
    if (value === null || value === undefined || value === '') {
      if (this.selectedDate() !== null || this.manualInputError()) {
        this.selectedDate.set(null);
        this.inputDisplayValue.set('');
        this.manualInputError.set(false);
        this.inputAnnouncement.set('');
        this.viewDate.set(this.today());
        if (emit) {
          this.onChange(null);
        }
      }
      return;
    }

    let date: DateTime | undefined;
    let displayValue = '';

    if (value instanceof Date) {
      date = DateTime.fromJSDate(value);
      if (date.isValid) {
        displayValue = this.formatDate(date);
      }
    } else if (typeof value === 'string') {
      const result = this.parser.parse(
        value,
        {
          value: '',
          selectionStart: 0,
          selectionEnd: 0,
        },
        this.inputAutocomplete(),
        {
          now: this.today(),
          locale: this.resolvedLocale(),
          commit: true,
        },
      );

      if (result.date) {
        date = result.date;
        displayValue = result.value;

        const jsDate = date.toJSDate();
        const currentValue = this.value();
        const hasChanged =
          !(currentValue instanceof Date) || currentValue.getTime() !== jsDate.getTime();

        if (hasChanged) {
          this.value.set(jsDate);
        }
      } else {
        const processedResult = this.inputAutocomplete().process(value, {
          commit: true,
          now: this.today(),
          locale: this.resolvedLocale(),
        });

        if (processedResult.date) {
          date = processedResult.date;
          displayValue = processedResult.value;
        } else {
          let fallbackDate = DateTime.fromISO(value);
          if (!fallbackDate.isValid) {
            fallbackDate = DateTime.fromSQL(value);
          }

          if (fallbackDate.isValid) {
            date = fallbackDate;
            displayValue = this.formatDate(date);
          } else {
            date = undefined;
            displayValue = value;
          }
        }
      }
    }

    if (date?.isValid) {
      date = normalizeDateForFormat(date, this.dateOnly(), this.showSeconds());

      const currentIso = this.selectedDate()?.toISO();
      const newIso = date.toISO();

      if (
        newIso !== currentIso ||
        this.manualInputError() ||
        this.inputDisplayValue() !== displayValue
      ) {
        this.selectedDate.set(date);
        this.inputDisplayValue.set(displayValue);
        this.manualInputError.set(false);
        this.inputAnnouncement.set('');
        this.viewDate.set(date);
        if (emit) {
          this.onChange(date.toJSDate());
        }
      }
    } else {
      if (
        this.selectedDate() !== null ||
        !this.manualInputError() ||
        this.inputDisplayValue() !== displayValue
      ) {
        this.selectedDate.set(null);
        this.inputDisplayValue.set(displayValue);
        this.manualInputError.set(true);
        this.inputAnnouncement.set('');
        this.viewDate.set(this.today());
        if (emit) {
          this.onChange(null);
        }
      }
    }
  }

  /** Opens the calendar overlay and records the focus trigger. */
  protected openCalendar(trigger?: HTMLElement): void {
    if (this.computedDisabled()) {
      return;
    }

    this.lastFocusedTrigger =
      trigger ?? this.getCurrentTrigger() ?? this.dateInput()?.nativeElement ?? null;
    this.dialogAnnouncement.set('');
    this.isOpen.set(true);

    const selectedDate = this.selectedDate();
    if (selectedDate) {
      this.viewDate.set(selectedDate);
    }
  }

  /** Processes keyboard shortcuts for the text input. */
  protected handleInputKeydown(event: KeyboardEvent, input: HTMLInputElement): void {
    if (event.key === 'ArrowDown' && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      this.openCalendar(input);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      this.commitManualInput(input);
      return;
    }

    if (event.key === 'Escape' && this.isOpen()) {
      event.preventDefault();
      this.closeCalendar();
      return;
    }

    if (
      event.key === 'Backspace' &&
      input.selectionStart === input.selectionEnd &&
      input.selectionStart === input.value.length
    ) {
      if (input.value.endsWith(' Uhr')) {
        event.preventDefault();
        input.value = input.value.slice(0, -4).slice(0, -1);
        this.onManualInput(input);
      }
    }
  }

  /** Callback when the overlay is attached to the DOM. */
  protected onOverlayAttached(): void {
    this.makeModalBackgroundInert();

    const preferredDate = this.selectedDate()?.startOf('day') ?? this.today().startOf('day');
    const initialDate = this.findEnabledDate(preferredDate, 1);

    this.activeDate.set(initialDate);

    if (!this.viewDate().hasSame(initialDate, 'month')) {
      this.viewDate.set(initialDate.startOf('month'));
    }

    requestAnimationFrame(() => {
      if (this.focusActiveDate()) {
        return;
      }

      requestAnimationFrame(() => this.focusActiveDate());
    });
  }

  /** Callback when the overlay is removed from the DOM. */
  protected onOverlayDetached(): void {
    this.restoreModalBackground();

    if (this.isOpen()) {
      this.closeCalendar();
    }
  }

  /** Attempts to focus the current active date in the calendar dialog. */
  private focusActiveDate(): boolean {
    return this.calendarDialog()?.focusDate(this.activeDate()) ?? false;
  }

  /** Closes the calendar overlay and restores focus. */
  protected closeCalendar(): void {
    const wasOpen = this.isOpen();
    this.isOpen.set(false);
    this.dialogAnnouncement.set('');
    this.restoreModalBackground();
    this.onTouched();

    const trigger = this.lastFocusedTrigger;
    this.lastFocusedTrigger = null;

    if (wasOpen && trigger?.isConnected && !trigger.hasAttribute('disabled')) {
      requestAnimationFrame(() => trigger.focus());
    }
  }

  /** Toggles the open/closed state of the calendar overlay. */
  protected toggleCalendar(trigger: HTMLElement): void {
    if (this.computedDisabled()) {
      return;
    }

    if (this.isOpen()) {
      this.closeCalendar();
      return;
    }

    this.openCalendar(trigger);
  }

  /** Handles keydown events targeting the overlay. */
  protected handleOverlayKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeCalendar();
    }
  }

  /** Manages complex keyboard navigation within the calendar grid. */
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
        nextDate = event.shiftKey
          ? this.moveDateByYears(date, -1)
          : this.moveDateByMonths(date, -1);
        break;

      case 'PageDown':
        nextDate = event.shiftKey ? this.moveDateByYears(date, 1) : this.moveDateByMonths(date, 1);
        break;

      case 'Enter':
      case ' ':
        event.preventDefault();
        this.selectDate(date);
        return;

      case 'Escape':
        event.preventDefault();
        this.closeCalendar();
        return;

      default:
        return;
    }

    event.preventDefault();
    this.moveFocusToDate(nextDate, this.getNavigationDirection(event.key));
  }

  /** Calculates a new date by adding/subtracting months while handling month lengths. */
  private moveDateByMonths(date: DateTime, monthDifference: number): DateTime {
    const targetMonth = date.startOf('month').plus({ months: monthDifference });
    const targetDay = Math.min(date.day, targetMonth.daysInMonth ?? 1);

    return targetMonth.set({ day: targetDay });
  }

  /** Calculates a new date by adding/subtracting years while handling leap years. */
  private moveDateByYears(date: DateTime, yearDifference: number): DateTime {
    const targetYear = date.startOf('year').plus({ years: yearDifference });
    const targetMonth = targetYear.set({ month: date.month }).startOf('month');
    const targetDay = Math.min(date.day, targetMonth.daysInMonth ?? 1);

    return targetMonth.set({ day: targetDay });
  }

  /** Changes the focused active date and adjusts view month if necessary. */
  private moveFocusToDate(date: DateTime, direction: 1 | -1): void {
    const normalizedDate = this.findEnabledDate(date.startOf('day'), direction);
    const monthChanged = !this.viewDate().hasSame(normalizedDate, 'month');

    this.activeDate.set(normalizedDate);

    if (monthChanged) {
      this.viewDate.set(normalizedDate.startOf('month'));
      this.announceDisplayedMonth();
    }

    requestAnimationFrame(() => this.focusActiveDate());
  }

  /** Identifies whether a navigation key implies forward or backward movement. */
  private getNavigationDirection(key: string): 1 | -1 {
    return key === 'ArrowLeft' || key === 'ArrowUp' || key === 'PageUp' || key === 'End' ? -1 : 1;
  }

  /** Traverses from a start date in a direction to find the first enabled date. */
  private findEnabledDate(date: DateTime, direction: 1 | -1): DateTime {
    let candidate = date.startOf('day');

    for (let attempts = 0; attempts < 3660 && this.isDateDisabled(candidate); attempts += 1) {
      candidate = candidate.plus({ days: direction });
    }

    return candidate;
  }

  /** Compares a date to the current active calendar focus. */
  protected isActiveDate(date: DateTime): boolean {
    return this.activeDate().hasSame(date, 'day');
  }

  /** Updates the active focus in the calendar if the target date is valid. */
  protected setActiveDate(date: DateTime): void {
    if (!this.isDateDisabled(date)) {
      this.activeDate.set(date.startOf('day'));
    }
  }

  /** Internal helper for changing view month with associated active date update. */
  private changeViewMonth(monthDifference: number): void {
    this.updateCalendarView(this.viewDate().plus({ months: monthDifference }));
  }

  /** Internal helper for changing view year with associated active date update. */
  private changeViewYear(yearDifference: number): void {
    this.updateCalendarView(this.viewDate().plus({ years: yearDifference }));
  }

  /** Common logic for updating the month view and the corresponding active date. */
  private updateCalendarView(date: DateTime): void {
    const nextViewDate = date.startOf('month');
    const targetDay = Math.min(this.activeDate().day, nextViewDate.daysInMonth ?? 1);
    const nextActiveDate = this.findEnabledDate(nextViewDate.set({ day: targetDay }), 1);

    this.viewDate.set(nextActiveDate.startOf('month'));
    this.activeDate.set(nextActiveDate);
    this.announceDisplayedMonth();
  }

  /** Updates the selected date from a user selection in the grid. */
  protected selectDate(date: DateTime): void {
    if (this.isDateDisabled(date)) {
      return;
    }

    const currentDate = this.selectedDate();
    let newSelectedDate: DateTime;

    if (this.dateOnly()) {
      newSelectedDate = date.startOf('day');
    } else if (currentDate) {
      newSelectedDate = date.set({
        hour: currentDate.hour,
        minute: currentDate.minute,
        second: this.showSeconds() ? currentDate.second : 0,
      });
    } else {
      newSelectedDate = this.showSeconds() ? date : date.set({ second: 0 });
    }

    const jsDate = newSelectedDate.toJSDate();
    this.selectedDate.set(newSelectedDate);
    this.inputDisplayValue.set(this.formatDate(newSelectedDate));
    this.manualInputError.set(false);
    this.value.set(jsDate);
    this.onChange(jsDate);
    this.announceDialog(`Ausgewählt: ${this.getAccessibleDateLabel(newSelectedDate)}.`);
  }

  /** Selection action for "Today" / "Now". */
  protected selectNow(): void {
    const wasOpen = this.isOpen();
    const now = normalizeDateForFormat(DateTime.now(), this.dateOnly(), this.showSeconds());
    const jsDate = now.toJSDate();
    this.selectedDate.set(now);
    this.inputDisplayValue.set(this.formatDate(now));
    this.manualInputError.set(false);
    this.inputAnnouncement.set('');
    this.value.set(jsDate);
    this.onChange(jsDate);
    this.announceInput(
      this.dateOnly()
        ? `Heutiges Datum übernommen: ${this.getAccessibleDateLabel(now)}.`
        : `Aktuelles Datum und aktuelle Uhrzeit übernommen: ${this.formatDate(now)}.`,
    );
    this.closeCalendar();

    if (!wasOpen) {
      const input = this.dateInput()?.nativeElement;
      if (input) {
        requestAnimationFrame(() => input.focus());
      }
    }
  }

  /** Resets the value to null and clears the text input. */
  protected clearValue(event: MouseEvent, input: HTMLInputElement): void {
    event.stopPropagation();

    this.selectedDate.set(null);
    this.inputDisplayValue.set('');
    this.manualInputError.set(false);
    this.value.set(null);
    this.viewDate.set(DateTime.now());
    this.dialogAnnouncement.set('');
    this.announceInput('Datum gelöscht.');
    this.onChange(null);
    this.onTouched();

    input.value = '';
    requestAnimationFrame(() => input.focus());
  }

  /** Handles raw text input events to provide autocomplete suggestions. */
  protected onManualInput(input: HTMLInputElement): void {
    this.inputAnnouncement.set('');

    const isDeletion = input.value.length < this.inputDisplayValue().length;
    const result = this.inputAutocomplete().process(input.value, {
      isDeletion,
      now: this.today(),
      locale: this.resolvedLocale(),
    });

    this.applyManualInputResult(input, result, false);
  }

  /** Finalizes a manual input after it has been finished by the user. */
  protected commitManualInput(input: HTMLInputElement): void {
    const result = this.inputAutocomplete().process(input.value, {
      commit: true,
      now: this.today(),
      locale: this.resolvedLocale(),
    });

    this.applyManualInputResult(input, result, true);
    this.onTouched();
  }

  /** Handles clipboard pasting into the text input. */
  protected handlePaste(event: ClipboardEvent, input: HTMLInputElement): void {
    const clipboardData = event.clipboardData;
    const pastedValue = clipboardData?.getData('text/plain') || clipboardData?.getData('text');

    if (pastedValue === undefined) {
      return;
    }

    event.preventDefault();

    if (!pastedValue.trim()) {
      return;
    }

    const result = this.parser.parse(
      pastedValue,
      {
        value: input.value,
        selectionStart: input.selectionStart,
        selectionEnd: input.selectionEnd,
      },
      this.inputAutocomplete(),
      { now: this.today(), locale: this.resolvedLocale() },
    );

    this.applyManualInputResult(input, result, true);

    if (result.date) {
      this.announceInput(
        this.dateOnly()
          ? 'Eingefügtes Datum übernommen.'
          : 'Eingefügtes Datum und Uhrzeit übernommen.',
      );
    }

    input.setSelectionRange(input.value.length, input.value.length);
  }

  /** Logic to synchronize autocomplete result with internal component state. */
  private applyManualInputResult(
    input: HTMLInputElement,
    result: DateInputAutocompleteResult,
    requireComplete: boolean,
  ): void {
    input.value = result.value;
    this.inputDisplayValue.set(result.value);

    const isInvalid = !result.valid || (requireComplete && !result.complete);

    if (result.date) {
      this.applyManualDate(result.date);
    } else if (isInvalid) {
      this.selectedDate.set(null);
      this.manualInputError.set(true);
      this.value.set(result.value);
      this.onChange(null);
    } else {
      // Potentially valid prefix, don't update value yet, but ensure no error is shown
      this.manualInputError.set(false);
    }
  }

  /** Accepts a fully parsed and validated manual date entry. */
  private applyManualDate(parsedDate: DateTime): void {
    const normalizedDate = normalizeDateForFormat(parsedDate, this.dateOnly(), this.showSeconds());
    const jsDate = normalizedDate.toJSDate();

    this.selectedDate.set(normalizedDate);
    this.viewDate.set(normalizedDate);
    this.inputDisplayValue.set(this.formatDate(normalizedDate));
    this.manualInputError.set(false);
    this.value.set(jsDate);
    this.onChange(jsDate);
  }

  /** Callback from time selection controls in the dialog. */
  protected updateTime(unit: TimeUnit, rawValue: string | number): void {
    const value = Number(rawValue);

    if (!Number.isInteger(value)) {
      return;
    }

    const maximum = unit === 'hour' ? 23 : 59;
    const normalizedValue = Math.min(Math.max(value, 0), maximum);
    const currentDate = this.selectedDate() ?? DateTime.local().startOf('day');

    this.applyTimeChange(currentDate.set({ [unit]: normalizedValue }));
  }

  /** Shortcut actions for relative time adjustments. */
  protected adjustTime(adjustment: { hours?: number; minutes?: number; seconds?: number }): void {
    const currentDate = this.selectedDate() ?? DateTime.local().startOf('day');

    this.applyTimeChange(currentDate.plus(adjustment));
  }

  /** Common logic for applying time-specific updates to selection. */
  private applyTimeChange(date: DateTime): void {
    const jsDate = date.toJSDate();

    this.selectedDate.set(date);

    if (!this.viewDate().hasSame(date, 'month')) {
      this.viewDate.set(date.startOf('month'));
    }

    this.inputDisplayValue.set(this.formatDate(date));
    this.manualInputError.set(false);
    this.value.set(jsDate);
    this.onChange(jsDate);
    this.announceTime();
  }

  /** Helper to convert a DateTime object into a string for display. */
  private formatDate(date: DateTime): string {
    return date.setLocale(this.resolvedLocale()).toFormat(this.dateFormat());
  }

  /** Announces a human-friendly description of the selected time. */
  private announceTime(): void {
    const date = this.selectedDate();

    if (!date) {
      return;
    }

    const localizedDate = date.setLocale(this.resolvedLocale());
    const timeText = localizedDate.toLocaleString(
      this.showSeconds() ? DateTime.TIME_WITH_SECONDS : DateTime.TIME_SIMPLE,
    );

    this.announceDialog(`Uhrzeit: ${timeText}.`);
  }

  /** Triggers SR announcement of currently visible calendar month. */
  private announceDisplayedMonth(): void {
    this.announceDialog(`Angezeigt: ${this.formattedMonth()}.`);
  }

  /** Dispatches an announcement to the input's SR live region. */
  private announceInput(message: string): void {
    this.inputAnnouncement.set('');
    queueMicrotask(() => this.inputAnnouncement.set(message));
  }

  /** Dispatches an announcement to the dialog's SR live region. */
  private announceDialog(message: string): void {
    this.dialogAnnouncement.set('');
    queueMicrotask(() => this.dialogAnnouncement.set(message));
  }

  /** Injects the `inert` attribute to non-dialog body content for a modal experience. */
  private makeModalBackgroundInert(): void {
    if (typeof document === 'undefined' || this.modalBackgroundState.size > 0) {
      return;
    }

    const overlayContainer = document.querySelector<HTMLElement>('.cdk-overlay-container');

    for (const child of Array.from(document.body.children)) {
      if (
        !(child instanceof HTMLElement) ||
        child === overlayContainer ||
        child.contains(overlayContainer)
      ) {
        continue;
      }

      this.modalBackgroundState.set(child, child.hasAttribute('inert'));
      child.setAttribute('inert', '');
    }
  }

  /** Reverts `inert` changes made to background body elements. */
  private restoreModalBackground(): void {
    for (const [element, hadInert] of this.modalBackgroundState) {
      if (hadInert) {
        element.setAttribute('inert', '');
      } else {
        element.removeAttribute('inert');
      }
    }

    this.modalBackgroundState.clear();
  }

  /** Public/Protected check if a date is currently selectable. */
  protected isDateDisabled(date: DateTime): boolean {
    return !this.dateFilter()(date);
  }

  /** Generates an SR accessible date label. */
  protected getAccessibleDateLabel(date: DateTime): string {
    return date.setLocale(this.resolvedLocale()).toLocaleString({
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  /** Composite status checking for input validity. */
  protected hasInputError(): boolean {
    return (
      this.manualInputError() ||
      (!!this.ngControl?.invalid && (!!this.ngControl?.touched || !!this.ngControl?.dirty))
    );
  }

  /** Helper to manage ARIA description ID list based on error state. */
  protected inputDescriptionIds(): string {
    return this.hasInputError()
      ? `${this.ids().inputHint} ${this.ids().inputError}`
      : this.ids().inputHint;
  }

  /** Generates specific test ID strings. */
  protected testIdFor(part?: string): string {
    return this.idService.testIdFor(part);
  }

  /** Attempts to locate an appropriate UI element to take focus on calendar close. */
  private getCurrentTrigger(): HTMLElement | null {
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      return document.activeElement;
    }

    return this.dateInput()?.nativeElement ?? null;
  }
}
