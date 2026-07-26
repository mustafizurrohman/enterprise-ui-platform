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
  NgZone,
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
  private readonly idService = inject(DatepickerIdService);
  private readonly injector = inject(Injector);
  private readonly ngZone = inject(NgZone);
  private readonly parser = inject(DatepickerParserService);

  readonly label = input<string>('Datum auswählen');
  readonly today = input<DateTime>(DateTime.now());
  readonly testId = input<string | null>(null);
  readonly locale = input<string | null>(null);
  readonly luxonDateFormat = input<string | null>(null);
  readonly dateFormatInput = input<string | null>(null, {
    alias: 'dateFormat',
  });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly showQuickTimeControls = input(false, {
    transform: booleanAttribute,
  });
  readonly value = model<Date | string | null | undefined>(undefined);

  private readonly disabledByForm = signal(false);

  protected readonly computedDisabled = computed(() => this.disabled() || this.disabledByForm());

  protected readonly resolvedLocale = computed(() => resolveDatepickerLocale(this.locale()));

  protected readonly ids = this.idService.ids;
  protected readonly testIdPrefix = this.idService.testIdPrefix;

  private readonly configuredDateFormat = computed(
    () => this.luxonDateFormat() ?? this.dateFormatInput(),
  );

  protected readonly dateFormat = computed(() =>
    LuxonDateInputAutocomplete.assertValidFormat(
      this.configuredDateFormat() ?? LuxonDateInputAutocomplete.DEFAULT_DATETIME_FORMAT,
      this.resolvedLocale(),
    ),
  );

  private readonly dateFormatCapabilities = computed(() =>
    getLuxonFormatCapabilities(this.dateFormat(), this.resolvedLocale()),
  );

  readonly dateOnly = computed(() => !this.dateFormatCapabilities().hasTime);

  readonly showSeconds = computed(() => this.dateFormatCapabilities().hasSeconds);

  readonly uses12HourClock = computed(() => this.dateFormatCapabilities().uses12HourClock);

  readonly showMeridiem = computed(() => this.dateFormatCapabilities().showMeridiem);

  protected readonly dateFormatDescription = computed(() => this.dateFormat());

  protected readonly placeholder = computed(() => this.dateFormat().replace(/'/g, ''));

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

  protected readonly selectNowLabel = computed(() =>
    this.dateOnly() ? 'Heutiges Datum auswählen' : 'Aktuelles Datum und aktuelle Uhrzeit auswählen',
  );

  protected readonly dialogTitle = computed(() =>
    this.dateOnly() ? 'Datum auswählen' : 'Datum und Uhrzeit auswählen',
  );

  protected readonly formattedMonth = computed(() =>
    this.viewDate().setLocale(this.resolvedLocale()).toFormat('LLLL yyyy'),
  );

  readonly selectedDate = signal<DateTime | null>(null);
  protected readonly inputDisplayValue = signal('');
  private readonly manualInputError = signal(false);
  private readonly inputAutocomplete = computed(
    () => new LuxonDateInputAutocomplete(this.dateFormat(), this.resolvedLocale()),
  );
  readonly viewDate = signal<DateTime>(DateTime.now());
  protected readonly isOpen = signal(false);
  protected readonly activeDate = signal<DateTime>(DateTime.local().startOf('day'));
  protected readonly timeAnnouncement = signal('');
  protected readonly dateAnnouncement = signal('');
  protected readonly inputAnnouncement = signal('');
  protected readonly navigationAnnouncement = signal('');

  private readonly dateInput = viewChild<ElementRef<HTMLInputElement>>('dateInput');
  private readonly calendarDialog = viewChild(DatepickerDialogComponent);

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

  readonly daysOfWeek = computed(() => {
    const locale = this.resolvedLocale();
    const longWeekdays = Info.weekdays('long', { locale });

    return Info.weekdays('short', { locale }).map((short, index) => ({
      short,
      long: longWeekdays[index] ?? short,
      weekday: index + 1,
    }));
  });

  readonly months = computed(() => Info.months('long', { locale: this.resolvedLocale() }));

  readonly grid = computed(() => buildCalendarWeeks(this.viewDate()));

  protected readonly dialogContext = computed<DatepickerDialogContext>(() => ({
    dialogId: this.ids().dialog,
    dialogTitleId: this.ids().dialogTitle,
    dialogDescriptionId: this.ids().dialogDescription,
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
    dateAnnouncement: this.dateAnnouncement(),
    timeAnnouncement: this.timeAnnouncement(),
    navigationAnnouncement: this.navigationAnnouncement(),
    showQuickTimeControls: this.showQuickTimeControls(),
  }));

  onChange: (value: Date | null) => void = () => {};
  onTouched: () => void = () => {};

  private ngControlInstance: NgControl | null = null;
  private lastFocusedTrigger: HTMLElement | null = null;
  private navigationAnnouncementTimer: ReturnType<typeof setTimeout> | null = null;

  protected get ngControl(): NgControl | null {
    if (!this.ngControlInstance) {
      this.ngControlInstance = this.injector.get(NgControl, null, {
        optional: true,
        self: true,
      });
    }
    return this.ngControlInstance;
  }

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

  ngOnDestroy(): void {
    this.clearNavigationAnnouncementTimer();
  }

  writeValue(value: Date | string | null | undefined): void {
    if (this.value() !== value) {
      this.value.set(value);
    }
    this.updateInternalState(value);
  }

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

  registerOnChange(fn: (value: Date | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledByForm.set(isDisabled);
  }

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

  protected openCalendar(trigger?: HTMLElement): void {
    if (this.computedDisabled()) {
      return;
    }

    this.lastFocusedTrigger =
      this.dateInput()?.nativeElement ?? trigger ?? this.getCurrentTrigger();
    this.navigationAnnouncement.set('');
    this.dateAnnouncement.set('');
    this.isOpen.set(true);

    const selectedDate = this.selectedDate();
    if (selectedDate) {
      this.viewDate.set(selectedDate);
    }
  }

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

  protected onOverlayAttached(): void {
    const initialDate = this.selectedDate()?.startOf('day') ?? this.today().startOf('day');

    this.activeDate.set(initialDate);

    if (!this.viewDate().hasSame(initialDate, 'month')) {
      this.viewDate.set(initialDate.startOf('month'));
    }

    requestAnimationFrame(() => {
      if (this.focusActiveDate()) {
        this.scheduleNavigationAnnouncement();
        return;
      }

      requestAnimationFrame(() => {
        this.focusActiveDate();
        this.scheduleNavigationAnnouncement();
      });
    });
  }

  protected onOverlayDetached(): void {
    if (this.isOpen()) {
      this.closeCalendar();
    }
  }

  private focusActiveDate(): boolean {
    return this.calendarDialog()?.focusDate(this.activeDate()) ?? false;
  }

  protected closeCalendar(): void {
    const wasOpen = this.isOpen();
    this.isOpen.set(false);
    this.clearNavigationAnnouncementTimer();
    this.navigationAnnouncement.set('');
    this.onTouched();

    const trigger = this.lastFocusedTrigger;
    this.lastFocusedTrigger = null;

    if (wasOpen && trigger?.isConnected && !trigger.hasAttribute('disabled')) {
      requestAnimationFrame(() => trigger.focus());
    }
  }

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
    this.moveFocusToDate(nextDate);
  }

  private moveDateByMonths(date: DateTime, monthDifference: number): DateTime {
    const targetMonth = date.startOf('month').plus({ months: monthDifference });
    const targetDay = Math.min(date.day, targetMonth.daysInMonth ?? 1);

    return targetMonth.set({ day: targetDay });
  }

  private moveDateByYears(date: DateTime, yearDifference: number): DateTime {
    const targetYear = date.startOf('year').plus({ years: yearDifference });
    const targetMonth = targetYear.set({ month: date.month }).startOf('month');
    const targetDay = Math.min(date.day, targetMonth.daysInMonth ?? 1);

    return targetMonth.set({ day: targetDay });
  }

  private moveFocusToDate(date: DateTime): void {
    const normalizedDate = date.startOf('day');

    this.activeDate.set(normalizedDate);

    if (!this.viewDate().hasSame(normalizedDate, 'month')) {
      this.viewDate.set(normalizedDate.startOf('month'));
    }

    requestAnimationFrame(() => {
      this.focusActiveDate();
    });
  }

  protected isActiveDate(date: DateTime): boolean {
    return this.activeDate().hasSame(date, 'day');
  }

  protected setActiveDate(date: DateTime): void {
    this.activeDate.set(date.startOf('day'));
  }

  prevMonth(): void {
    this.changeViewMonth(-1);
  }

  nextMonth(): void {
    this.changeViewMonth(1);
  }

  prevYear(): void {
    this.changeViewYear(-1);
  }

  nextYear(): void {
    this.changeViewYear(1);
  }

  setMonth(month: number): void {
    this.updateCalendarView(this.viewDate().set({ month }));
  }

  setYear(year: number): void {
    this.updateCalendarView(this.viewDate().set({ year }));
  }

  private changeViewMonth(monthDifference: number): void {
    this.updateCalendarView(this.viewDate().plus({ months: monthDifference }));
  }

  private changeViewYear(yearDifference: number): void {
    this.updateCalendarView(this.viewDate().plus({ years: yearDifference }));
  }

  private updateCalendarView(date: DateTime): void {
    const nextViewDate = date.startOf('month');
    const targetDay = Math.min(this.activeDate().day, nextViewDate.daysInMonth ?? 1);

    this.viewDate.set(nextViewDate);
    this.activeDate.set(nextViewDate.set({ day: targetDay }));
  }

  protected selectDate(date: DateTime): void {
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
    this.announceDate(`Datum ausgewählt: ${this.getAccessibleDateLabel(newSelectedDate)}.`);
  }

  protected selectNow(): void {
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

    const input = this.dateInput()?.nativeElement;
    if (input) {
      requestAnimationFrame(() => input.focus());
    }
  }

  protected clearValue(event: MouseEvent, input: HTMLInputElement): void {
    event.stopPropagation();

    this.selectedDate.set(null);
    this.inputDisplayValue.set('');
    this.manualInputError.set(false);
    this.value.set(null);
    this.viewDate.set(DateTime.now());
    this.dateAnnouncement.set('');
    this.timeAnnouncement.set('');
    this.announceInput('Datum gelöscht.');
    this.onChange(null);
    this.onTouched();

    input.value = '';
    requestAnimationFrame(() => input.focus());
  }

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

  protected commitManualInput(input: HTMLInputElement): void {
    const result = this.inputAutocomplete().process(input.value, {
      commit: true,
      now: this.today(),
      locale: this.resolvedLocale(),
    });

    this.applyManualInputResult(input, result, true);
    this.onTouched();
  }

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

  protected adjustTime(adjustment: { hours?: number; minutes?: number; seconds?: number }): void {
    const currentDate = this.selectedDate() ?? DateTime.local().startOf('day');

    this.applyTimeChange(currentDate.plus(adjustment));
  }

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

  private formatDate(date: DateTime): string {
    return date.setLocale(this.resolvedLocale()).toFormat(this.dateFormat());
  }

  private announceTime(): void {
    const date = this.selectedDate();

    if (!date) {
      return;
    }

    const localizedDate = date.setLocale(this.resolvedLocale());
    const timeText = localizedDate.toLocaleString(
      this.showSeconds() ? DateTime.TIME_WITH_SECONDS : DateTime.TIME_SIMPLE,
    );

    this.announceTimeMessage(`Uhrzeit: ${timeText}`);
  }

  private scheduleNavigationAnnouncement(): void {
    this.clearNavigationAnnouncementTimer();
    this.ngZone.runOutsideAngular(() => {
      this.navigationAnnouncementTimer = setTimeout(() => {
        this.navigationAnnouncementTimer = null;

        if (!this.isOpen()) {
          return;
        }

        this.ngZone.run(() => {
          this.navigationAnnouncement.set(
            'Pfeiltasten navigieren zwischen Tagen. Pos1 und Ende springen zum Wochenanfang und Wochenende. Bild auf und Bild ab wechseln den Monat; mit Umschalttaste das Jahr. Enter oder Leertaste wählen den Tag. Escape schließt den Kalender.',
          );
        });
      }, 150);
    });
  }

  private clearNavigationAnnouncementTimer(): void {
    if (this.navigationAnnouncementTimer !== null) {
      clearTimeout(this.navigationAnnouncementTimer);
      this.navigationAnnouncementTimer = null;
    }
  }

  private announceInput(message: string): void {
    this.inputAnnouncement.set('');
    queueMicrotask(() => this.inputAnnouncement.set(message));
  }

  private announceDate(message: string): void {
    this.dateAnnouncement.set('');
    queueMicrotask(() => this.dateAnnouncement.set(message));
  }

  private announceTimeMessage(message: string): void {
    this.timeAnnouncement.set(message);
  }

  isSelected(date: DateTime | null): boolean {
    const selectedDate = this.selectedDate();

    return !!date && !!selectedDate && date.hasSame(selectedDate, 'day');
  }

  isToday(date: DateTime | null): boolean {
    return !!date && date.hasSame(this.today(), 'day');
  }

  isCurrentWeek(week: DatepickerWeek): boolean {
    return week.days.some((day) => this.isToday(day));
  }

  isCurrentWeekday(weekday: number): boolean {
    return this.today().weekday === weekday && this.today().hasSame(this.viewDate(), 'month');
  }

  protected getAccessibleDateLabel(date: DateTime): string {
    return date.setLocale(this.resolvedLocale()).toLocaleString({
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  protected hasInputError(): boolean {
    return (
      this.manualInputError() ||
      (!!this.ngControl?.invalid && (!!this.ngControl?.touched || !!this.ngControl?.dirty))
    );
  }

  protected inputDescriptionIds(): string {
    return this.hasInputError()
      ? `${this.ids().inputHint} ${this.ids().inputError}`
      : this.ids().inputHint;
  }

  protected testIdFor(part?: string): string {
    return this.idService.testIdFor(part);
  }

  private getCurrentTrigger(): HTMLElement | null {
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      return document.activeElement;
    }

    return this.dateInput()?.nativeElement ?? null;
  }
}
