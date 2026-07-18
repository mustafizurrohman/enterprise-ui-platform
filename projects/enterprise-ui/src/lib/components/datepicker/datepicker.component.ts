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
  signal,
  untracked,
  viewChild,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  AbstractControl,
  type ControlValueAccessor,
  FormsModule,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  NgControl,
  type ValidationErrors,
  type Validator,
} from "@angular/forms";
import {
  CdkConnectedOverlay,
  CdkOverlayOrigin,
  type ConnectedPosition,
} from "@angular/cdk/overlay";
import { MatIconModule } from "@angular/material/icon";
import { DateTime, Info } from "luxon";
import {
  DatepickerDialogComponent,
  type DatepickerDialogContext,
} from "./datepicker-dialog.component";
import type { TimeUnit } from "./time-wheel.component";
import {
  type DateInputAutocompleteResult,
  LuxonDateInputAutocomplete,
} from "./luxon-date-input-autocomplete";

@Component({
  selector: "datepicker",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CdkConnectedOverlay,
    CdkOverlayOrigin,
    MatIconModule,
    DatepickerDialogComponent,
  ],
  templateUrl: "./datepicker.component.html",
  styleUrl: "./datepicker.component.scss",
  providers: [
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
export class DatepickerComponent implements ControlValueAccessor, Validator {
  private static nextId = 0;
  private readonly componentId = signal(
    `datepicker-${DatepickerComponent.nextId++}`,
  );
  private lastFocusedTrigger: HTMLElement | null = null;

  readonly label = input<string>("Datum auswählen");
  readonly today = input<DateTime>(DateTime.now());
  readonly testId = input<string | null>(null);
  readonly locale = input<string | null>(null);
  readonly luxonDateFormat = input<string | null>(null);
  readonly dateFormatInput = input<string | null>(null, {
    alias: "dateFormat",
  });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly value = model<Date | string | null>(null);

  private readonly _disabledForm = signal(false);

  protected readonly computedDisabled = computed(
    () => this.disabled() || this._disabledForm(),
  );

  protected readonly resolvedLocale = computed(() =>
    resolveLocale(this.locale()),
  );

  protected readonly ids = computed(
    () =>
      ({
        root: this.componentId(),
        inputWrapper: `${this.componentId()}-input-wrapper`,
        input: `${this.componentId()}-input`,
        inputHint: `${this.componentId()}-hint`,
        inputError: `${this.componentId()}-error`,
        inputStatus: `${this.componentId()}-status`,
        clearButton: `${this.componentId()}-clear`,
        nowButton: `${this.componentId()}-now`,
        toggleButton: `${this.componentId()}-toggle`,
        dialog: `${this.componentId()}-dialog`,
        dialogTitle: `${this.componentId()}-dialog-title`,
        dialogDescription: `${this.componentId()}-dialog-description`,
        monthHeading: `${this.componentId()}-month-heading`,
        hourSelect: `${this.componentId()}-hour`,
        minuteSelect: `${this.componentId()}-minute`,
        secondSelect: `${this.componentId()}-second`,
        hourLabel: `${this.componentId()}-hour-label`,
        minuteLabel: `${this.componentId()}-minute-label`,
        secondLabel: `${this.componentId()}-second-label`,
        meridiemGroup: `${this.componentId()}-meridiem`,
        meridiemLabel: `${this.componentId()}-meridiem-label`,
        meridiemAm: `${this.componentId()}-meridiem-am`,
        meridiemPm: `${this.componentId()}-meridiem-pm`,
      }) as const,
  );
  protected readonly testIdPrefix = computed(
    () => this.testId()?.trim() || this.componentId(),
  );

  private readonly configuredDateFormat = computed(
    () => this.luxonDateFormat() ?? this.dateFormatInput(),
  );

  protected readonly dateFormat = computed(() =>
    LuxonDateInputAutocomplete.assertValidFormat(
      this.configuredDateFormat() ??
        LuxonDateInputAutocomplete.DEFAULT_DATETIME_FORMAT,
      this.resolvedLocale(),
    ),
  );

  private readonly dateFormatCapabilities = computed(() =>
    getLuxonFormatCapabilities(this.dateFormat(), this.resolvedLocale()),
  );

  readonly dateOnly = computed(() => !this.dateFormatCapabilities().hasTime);

  readonly showSeconds = computed(
    () => this.dateFormatCapabilities().hasSeconds,
  );

  readonly uses12HourClock = computed(
    () => this.dateFormatCapabilities().uses12HourClock,
  );

  readonly showMeridiem = computed(
    () => this.dateFormatCapabilities().showMeridiem,
  );

  protected readonly dateFormatDescription = computed(() => this.dateFormat());

  protected readonly calendarToggleLabel = computed(() => {
    if (this.isOpen()) {
      return "Kalender schließen";
    }

    return this.dateOnly()
      ? "Kalender zur Auswahl eines Datums öffnen"
      : "Kalender zur Auswahl von Datum und Uhrzeit öffnen";
  });

  protected readonly selectNowLabel = computed(() =>
    this.dateOnly()
      ? "Heutiges Datum auswählen"
      : "Aktuelles Datum und aktuelle Uhrzeit auswählen",
  );

  protected readonly dialogTitle = computed(() =>
    this.dateOnly() ? "Datum auswählen" : "Datum und Uhrzeit auswählen",
  );

  protected readonly formattedMonth = computed(() =>
    this.viewDate().setLocale(this.resolvedLocale()).toFormat("LLLL yyyy"),
  );

  readonly selectedDate = signal<DateTime | null>(null);
  protected readonly inputDisplayValue = signal("");
  private readonly manualInputError = signal(false);
  private readonly inputAutocomplete = computed(
    () =>
      new LuxonDateInputAutocomplete(this.dateFormat(), this.resolvedLocale()),
  );
  readonly viewDate = signal<DateTime>(DateTime.now());
  protected readonly isOpen = signal(false);
  protected readonly activeDate = signal<DateTime>(
    DateTime.local().startOf("day"),
  );
  protected readonly timeAnnouncement = signal("");
  protected readonly dateAnnouncement = signal("");
  protected readonly inputAnnouncement = signal("");

  private readonly dateInput =
    viewChild<ElementRef<HTMLInputElement>>("dateInput");
  private readonly calendarDialog = viewChild(DatepickerDialogComponent);

  protected readonly overlayPositions: ConnectedPosition[] = [
    {
      originX: "start",
      originY: "bottom",
      overlayX: "start",
      overlayY: "top",
      offsetY: 8,
    },
    {
      originX: "end",
      originY: "bottom",
      overlayX: "end",
      overlayY: "top",
      offsetY: 8,
    },
    {
      originX: "start",
      originY: "top",
      overlayX: "start",
      overlayY: "bottom",
      offsetY: -8,
    },
    {
      originX: "end",
      originY: "top",
      overlayX: "end",
      overlayY: "bottom",
      offsetY: -8,
    },
  ];

  readonly daysOfWeek = computed(() => {
    const locale = this.resolvedLocale();
    const longWeekdays = Info.weekdays("long", { locale });

    return Info.weekdays("short", { locale }).map((short, index) => ({
      short,
      long: longWeekdays[index] ?? short,
      weekday: index + 1,
    }));
  });

  readonly months = computed(() =>
    Info.months("long", { locale: this.resolvedLocale() }),
  );

  readonly grid = computed(() => {
    const startOfMonth = this.viewDate().startOf("month");
    const daysInMonth = startOfMonth.daysInMonth ?? 0;
    const firstDayWeekday = startOfMonth.weekday;

    // Monday-based index: 0 = Mon, 6 = Sun
    const mondayBasedFirstDayIndex = firstDayWeekday - 1;

    // Align the first day of the month to its correct weekday column.
    const leadingCellCount = mondayBasedFirstDayIndex;

    const cells: (DateTime | null)[] = Array.from(
      { length: leadingCellCount },
      () => null,
    );

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
  }));

  onChange: (value: Date | null) => void = () => {};
  onTouched: () => void = () => {};

  private readonly injector = inject(Injector);
  private _ngControl: NgControl | null = null;

  protected get ngControl(): NgControl | null {
    if (!this._ngControl) {
      this._ngControl = this.injector.get(NgControl, null, {
        optional: true,
        self: true,
      });
    }
    return this._ngControl;
  }

  constructor() {
    effect(() => {
      const v = this.value();
      untracked(() => {
        const currentIso = this.selectedDate()?.toISO();
        let newIso: string | null = null;

        if (v instanceof Date) {
          newIso = DateTime.fromJSDate(v).toISO();
        } else if (typeof v === "string") {
          newIso = DateTime.fromISO(v).toISO();
        }

        if (newIso !== currentIso) {
          this.writeValue(v);
        }
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

        const normalizedDate = dateOnly
          ? selectedDate.startOf("day")
          : showSeconds
            ? selectedDate
            : selectedDate.set({ second: 0, millisecond: 0 });

        if (normalizedDate.toMillis() !== selectedDate.toMillis()) {
          const jsDate = normalizedDate.toJSDate();

          this.selectedDate.set(normalizedDate);
          this.value.set(jsDate);
          this.onChange(jsDate);
        }

        this.inputDisplayValue.set(
          normalizedDate.setLocale(locale).toFormat(format),
        );
      });
    });
  }

  writeValue(value: Date | string | null): void {
    if (this.value() !== value) {
      this.value.set(value);
    }
    if (value) {
      let date: DateTime;
      if (value instanceof Date) {
        date = DateTime.fromJSDate(value);
      } else {
        date = DateTime.fromISO(value);
        if (!date.isValid) {
          date = DateTime.fromSQL(value); // Fallback for some formats
        }
      }
      if (date.isValid) {
        if (this.dateOnly()) {
          date = date.startOf("day");
        } else if (!this.showSeconds()) {
          date = date.set({ second: 0, millisecond: 0 });
        }

        this.selectedDate.set(date);
        this.inputDisplayValue.set(this.formatDate(date));
        this.manualInputError.set(false);
        this.inputAnnouncement.set("");
        this.viewDate.set(date);
      } else {
        this.selectedDate.set(null);
        this.inputDisplayValue.set("");
        this.manualInputError.set(true);
        this.inputAnnouncement.set("");
        this.viewDate.set(DateTime.now());
      }
    } else {
      this.selectedDate.set(null);
      this.inputDisplayValue.set("");
      this.manualInputError.set(false);
      this.inputAnnouncement.set("");
      this.viewDate.set(DateTime.now());
    }
  }

  registerOnChange(fn: (value: Date | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this._disabledForm.set(isDisabled);
  }

  validate(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) {
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

    this.lastFocusedTrigger = trigger ?? this.getCurrentTrigger();
    this.isOpen.set(true);

    if (this.selectedDate()) {
      this.viewDate.set(this.selectedDate()!);
    }
  }

  protected handleInputKeydown(
    event: KeyboardEvent,
    input: HTMLInputElement,
  ): void {
    if (event.key === "Enter") {
      event.preventDefault();
      this.commitManualInput(input);
      return;
    }

    if (event.key === "Escape" && this.isOpen()) {
      event.preventDefault();
      this.closeCalendar();
      return;
    }

    if (
      event.key === "Backspace" &&
      input.selectionStart === input.selectionEnd &&
      input.selectionStart === input.value.length
    ) {
      if (input.value.endsWith(" Uhr")) {
        event.preventDefault();
        input.value = input.value.slice(0, -4).slice(0, -1);
        this.onManualInput(input);
      }
    }
  }

  protected onOverlayAttached(): void {
    const initialDate =
      this.selectedDate()?.startOf("day") ?? DateTime.local().startOf("day");

    this.activeDate.set(initialDate);

    if (!this.viewDate().hasSame(initialDate, "month")) {
      this.viewDate.set(initialDate.startOf("month"));
    }

    requestAnimationFrame(() => {
      this.focusActiveDate();
    });
  }

  protected onOverlayDetached(): void {
    if (this.isOpen()) {
      this.closeCalendar();
    }
  }

  private focusActiveDate(): void {
    this.calendarDialog()?.focusDate(this.activeDate());
  }

  protected closeCalendar(): void {
    const wasOpen = this.isOpen();
    this.isOpen.set(false);
    this.onTouched();

    const trigger = this.lastFocusedTrigger;
    this.lastFocusedTrigger = null;

    if (wasOpen && trigger?.isConnected && !trigger.hasAttribute("disabled")) {
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
    if (event.key === "Escape") {
      event.preventDefault();
      this.closeCalendar();
    }
  }

  protected handleCalendarKeydown(event: KeyboardEvent, date: DateTime): void {
    let nextDate: DateTime | null = null;

    switch (event.key) {
      case "ArrowLeft":
        nextDate = date.minus({ days: 1 });
        break;

      case "ArrowRight":
        nextDate = date.plus({ days: 1 });
        break;

      case "ArrowUp":
        nextDate = date.minus({ days: 7 });
        break;

      case "ArrowDown":
        nextDate = date.plus({ days: 7 });
        break;

      case "Home":
        nextDate = date.minus({
          days: date.weekday - 1,
        });
        break;

      case "End":
        nextDate = date.plus({
          days: 7 - date.weekday,
        });
        break;

      case "PageUp":
        nextDate = event.shiftKey
          ? this.moveDateByYears(date, -1)
          : this.moveDateByMonths(date, -1);
        break;

      case "PageDown":
        nextDate = event.shiftKey
          ? this.moveDateByYears(date, 1)
          : this.moveDateByMonths(date, 1);
        break;

      case "Enter":
      case " ":
        event.preventDefault();
        this.selectDate(date);
        return;

      case "Escape":
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
    const targetMonth = date.startOf("month").plus({ months: monthDifference });
    const targetDay = Math.min(date.day, targetMonth.daysInMonth ?? 1);

    return targetMonth.set({ day: targetDay });
  }

  private moveDateByYears(date: DateTime, yearDifference: number): DateTime {
    const targetYear = date.startOf("year").plus({ years: yearDifference });
    const targetMonth = targetYear.set({ month: date.month }).startOf("month");
    const targetDay = Math.min(date.day, targetMonth.daysInMonth ?? 1);

    return targetMonth.set({ day: targetDay });
  }

  private moveFocusToDate(date: DateTime): void {
    const normalizedDate = date.startOf("day");

    this.activeDate.set(normalizedDate);

    if (!this.viewDate().hasSame(normalizedDate, "month")) {
      this.viewDate.set(normalizedDate.startOf("month"));
    }

    requestAnimationFrame(() => {
      this.focusActiveDate();
    });
  }

  protected isActiveDate(date: DateTime): boolean {
    return this.activeDate().hasSame(date, "day");
  }

  protected setActiveDate(date: DateTime): void {
    this.activeDate.set(date.startOf("day"));
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
    const nextViewDate = this.viewDate().set({ month }).startOf("month");
    const targetDay = Math.min(
      this.activeDate().day,
      nextViewDate.daysInMonth ?? 1,
    );

    this.viewDate.set(nextViewDate);
    this.activeDate.set(nextViewDate.set({ day: targetDay }));
  }

  setYear(year: number): void {
    const nextViewDate = this.viewDate().set({ year }).startOf("month");
    const targetDay = Math.min(
      this.activeDate().day,
      nextViewDate.daysInMonth ?? 1,
    );

    this.viewDate.set(nextViewDate);
    this.activeDate.set(nextViewDate.set({ day: targetDay }));
  }

  private changeViewMonth(monthDifference: number): void {
    const nextViewDate = this.viewDate()
      .plus({ months: monthDifference })
      .startOf("month");
    const targetDay = Math.min(
      this.activeDate().day,
      nextViewDate.daysInMonth ?? 1,
    );

    this.viewDate.set(nextViewDate);
    this.activeDate.set(nextViewDate.set({ day: targetDay }));
  }

  private changeViewYear(yearDifference: number): void {
    const nextViewDate = this.viewDate()
      .plus({ years: yearDifference })
      .startOf("month");
    const targetDay = Math.min(
      this.activeDate().day,
      nextViewDate.daysInMonth ?? 1,
    );

    this.viewDate.set(nextViewDate);
    this.activeDate.set(nextViewDate.set({ day: targetDay }));
  }

  protected selectDate(date: DateTime): void {
    let newSelectedDate: DateTime;
    if (this.dateOnly()) {
      newSelectedDate = date.startOf("day");
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

    const jsDate = newSelectedDate.toJSDate();
    this.selectedDate.set(newSelectedDate);
    this.inputDisplayValue.set(this.formatDate(newSelectedDate));
    this.manualInputError.set(false);
    this.value.set(jsDate);
    this.onChange(jsDate);
    this.dateAnnouncement.set(
      `${this.getAccessibleDateLabel(newSelectedDate)}.`,
    );
  }

  protected selectNow(): void {
    let now = DateTime.now();
    if (this.dateOnly()) {
      now = now.startOf("day");
    } else if (!this.showSeconds()) {
      now = now.set({ second: 0, millisecond: 0 });
    }
    const jsDate = now.toJSDate();
    this.selectedDate.set(now);
    this.inputDisplayValue.set(this.formatDate(now));
    this.manualInputError.set(false);
    this.inputAnnouncement.set("");
    this.value.set(jsDate);
    this.onChange(jsDate);
    this.closeCalendar();
  }

  protected clearValue(event: MouseEvent, input: HTMLInputElement): void {
    event.stopPropagation();

    this.selectedDate.set(null);
    this.inputDisplayValue.set("");
    this.manualInputError.set(false);
    this.value.set(null);
    this.viewDate.set(DateTime.now());
    this.dateAnnouncement.set("Datum gelöscht.");
    this.timeAnnouncement.set("");
    this.inputAnnouncement.set("");
    this.onChange(null);
    this.onTouched();

    input.value = "";
    requestAnimationFrame(() => input.focus());
  }

  protected onManualInput(input: HTMLInputElement): void {
    this.inputAnnouncement.set("");

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
    const pastedValue =
      clipboardData?.getData("text/plain") || clipboardData?.getData("text");

    if (pastedValue === undefined) {
      return;
    }

    event.preventDefault();

    if (!pastedValue.trim()) {
      return;
    }

    const selectionStart = input.selectionStart ?? 0;
    const selectionEnd = input.selectionEnd ?? input.value.length;
    const replacesCompleteValue =
      selectionStart === 0 && selectionEnd === input.value.length;
    const nextValue =
      input.value.slice(0, selectionStart) +
      pastedValue +
      input.value.slice(selectionEnd);
    const combinedResult = this.inputAutocomplete().processPastedValue(
      nextValue,
      { now: this.today(), locale: this.resolvedLocale() },
    );
    const pastedResult = this.inputAutocomplete().processPastedValue(
      pastedValue,
      { now: this.today(), locale: this.resolvedLocale() },
    );
    const shouldUsePastedValue =
      !!pastedResult.date &&
      (replacesCompleteValue ||
        !input.value ||
        looksLikeCompleteDateOrEpoch(pastedValue));
    const result = shouldUsePastedValue ? pastedResult : combinedResult;

    this.applyManualInputResult(input, result, true);

    if (result.date) {
      this.inputAnnouncement.set(
        this.dateOnly()
          ? "Eingefügtes Datum übernommen."
          : "Eingefügtes Datum und Uhrzeit übernommen.",
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
    this.manualInputError.set(
      !result.valid || (requireComplete && !result.complete),
    );

    if (result.date) {
      this.applyManualDate(result.date);
    }
  }

  private applyManualDate(parsedDate: DateTime): void {
    const normalizedDate = this.dateOnly()
      ? parsedDate.startOf("day")
      : this.showSeconds()
        ? parsedDate
        : parsedDate.set({ second: 0, millisecond: 0 });
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

    if (isNaN(value) || !Number.isInteger(value)) {
      return;
    }

    const maximum = unit === "hour" ? 23 : 59;
    const normalizedValue = Math.min(Math.max(value, 0), maximum);

    const currentDate = this.selectedDate() ?? DateTime.local().startOf("day");

    const newDate = currentDate.set({
      [unit]: normalizedValue,
    });
    const jsDate = newDate.toJSDate();
    this.selectedDate.set(newDate);
    this.inputDisplayValue.set(this.formatDate(newDate));
    this.manualInputError.set(false);
    this.value.set(jsDate);
    this.onChange(jsDate);
    this.announceTime();
  }

  protected adjustTime(adjustment: { hours?: number; minutes?: number }): void {
    const currentDate = this.selectedDate() ?? DateTime.local().startOf("day");
    const newDate = currentDate.plus(adjustment);

    const jsDate = newDate.toJSDate();
    this.selectedDate.set(newDate);
    this.inputDisplayValue.set(this.formatDate(newDate));
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
    const hourText = this.showMeridiem()
      ? localizedDate.toFormat("hh a")
      : `${localizedDate.toFormat("HH")} Uhr`;
    let announcement =
      `Uhrzeit ${hourText}, ` + `${localizedDate.toFormat("mm")} Minuten`;

    if (this.showSeconds()) {
      announcement += ` und ${localizedDate.toFormat("ss")} Sekunden`;
    }

    this.timeAnnouncement.set(announcement);
  }

  isSelected(date: DateTime | null): boolean {
    if (!date || !this.selectedDate()) return false;
    return date.hasSame(this.selectedDate()!, "day");
  }

  isToday(date: DateTime | null): boolean {
    if (!date) return false;
    return date.hasSame(this.today(), "day");
  }

  protected getAccessibleDateLabel(date: DateTime): string {
    const formattedDate = date.setLocale(this.resolvedLocale()).toLocaleString({
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const states: string[] = [];

    if (this.isToday(date)) {
      states.push("heute");
    }

    if (this.isSelected(date)) {
      states.push("ausgewählt");
    }

    return states.length > 0
      ? `${formattedDate}, ${states.join(", ")}`
      : formattedDate;
  }

  protected hasInputError(): boolean {
    return (
      this.manualInputError() ||
      (!!this.ngControl?.invalid &&
        (!!this.ngControl?.touched || !!this.ngControl?.dirty))
    );
  }

  protected inputDescriptionIds(): string {
    return this.hasInputError()
      ? `${this.ids().inputHint} ${this.ids().inputError}`
      : this.ids().inputHint;
  }

  protected testIdFor(part?: string): string {
    return part ? `${this.testIdPrefix()}-${part}` : this.testIdPrefix();
  }

  private getCurrentTrigger(): HTMLElement | null {
    if (
      typeof document !== "undefined" &&
      document.activeElement instanceof HTMLElement
    ) {
      return document.activeElement;
    }

    return this.dateInput()?.nativeElement ?? null;
  }
}

function looksLikeCompleteDateOrEpoch(value: string): boolean {
  const normalizedValue = value
    .trim()
    .replace(/(?:\s|\u00a0)*uhr(?:\s|\u00a0)*$/iu, "")
    .trimEnd();

  return (
    /[./:\-T]/u.test(normalizedValue) ||
    /^[+-]?\d{8,13}$/u.test(normalizedValue)
  );
}

type LuxonFormatCapabilities = Readonly<{
  hasTime: boolean;
  hasSeconds: boolean;
  uses12HourClock: boolean;
  showMeridiem: boolean;
}>;

const TIME_FIELD_TOKENS = new Set([
  "H",
  "HH",
  "h",
  "hh",
  "m",
  "mm",
  "s",
  "ss",
  "S",
  "SSS",
  "u",
  "uu",
  "uuu",
  "a",
]);

const SECOND_FIELD_TOKENS = new Set(["s", "ss", "S", "SSS", "u", "uu", "uuu"]);

const TIME_MACRO_TOKENS = new Set([
  "t",
  "tt",
  "ttt",
  "tttt",
  "T",
  "TT",
  "TTT",
  "TTTT",
  "f",
  "ff",
  "fff",
  "ffff",
  "F",
  "FF",
  "FFF",
  "FFFF",
]);

const SECOND_MACRO_TOKENS = new Set([
  "tt",
  "ttt",
  "tttt",
  "TT",
  "TTT",
  "TTTT",
  "F",
  "FF",
  "FFF",
  "FFFF",
]);

function getLuxonFormatCapabilities(
  format: string,
  locale = resolveLocale(null),
): LuxonFormatCapabilities {
  const tokens = getUnquotedLuxonTokens(format);
  const hasTimeMacro = tokens.some((token) => TIME_MACRO_TOKENS.has(token));
  const hasExplicit12HourToken = tokens.some(
    (token) => token === "h" || token === "hh",
  );
  const hasExplicit24HourToken = tokens.some(
    (token) => token === "H" || token === "HH",
  );
  const usesLocale12HourClock =
    hasTimeMacro && !hasExplicit24HourToken && is12HourLocale(locale);
  const uses12HourClock = hasExplicit12HourToken || usesLocale12HourClock;

  return {
    hasTime: tokens.some(
      (token) => TIME_FIELD_TOKENS.has(token) || TIME_MACRO_TOKENS.has(token),
    ),
    hasSeconds: tokens.some(
      (token) =>
        SECOND_FIELD_TOKENS.has(token) || SECOND_MACRO_TOKENS.has(token),
    ),
    uses12HourClock,
    showMeridiem:
      uses12HourClock &&
      (tokens.includes("a") || hasExplicit12HourToken || hasTimeMacro),
  };
}

function resolveLocale(configuredLocale: string | null): string {
  const normalizedLocale = configuredLocale?.trim();

  if (normalizedLocale) {
    return normalizedLocale;
  }

  if (typeof navigator !== "undefined") {
    const browserLocale =
      navigator.languages?.find((locale) => locale.trim().length > 0) ??
      navigator.language;

    if (browserLocale?.trim()) {
      return browserLocale;
    }
  }

  return Intl.DateTimeFormat().resolvedOptions().locale || "en-US";
}

function is12HourLocale(locale: string): boolean {
  const hourCycle = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
  }).resolvedOptions().hourCycle;

  return hourCycle === "h11" || hourCycle === "h12";
}

function getUnquotedLuxonTokens(format: string): string[] {
  const tokens: string[] = [];
  let insideLiteral = false;

  for (let index = 0; index < format.length; ) {
    const character = format[index];

    if (character === "'") {
      if (format[index + 1] === "'") {
        index += 2;
        continue;
      }

      insideLiteral = !insideLiteral;
      index += 1;
      continue;
    }

    if (!insideLiteral && /[A-Za-z]/u.test(character)) {
      let tokenEnd = index + 1;

      while (format[tokenEnd] === character) {
        tokenEnd += 1;
      }

      tokens.push(format.slice(index, tokenEnd));
      index = tokenEnd;
      continue;
    }

    index += 1;
  }

  return tokens;
}
