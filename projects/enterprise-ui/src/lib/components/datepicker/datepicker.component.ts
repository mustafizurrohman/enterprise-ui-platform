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
import { LuxonDateInputAutocomplete } from "./luxon-date-input-autocomplete";

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
  private readonly componentId = signal(`datepicker-${DatepickerComponent.nextId++}`);
  private lastFocusedTrigger: HTMLElement | null = null;

  readonly label = input<string>("Datum auswählen");
  readonly value = model<Date | string | null>(null);
  readonly dateOnly = input(false, { transform: booleanAttribute });
  readonly showSeconds = input(false, { transform: booleanAttribute });
  readonly today = input<DateTime>(DateTime.now());
  readonly testId = input<string | null>(null);
  readonly luxonDateFormat = input<string | null>(null, { alias: "dateFormat" });

  readonly disabled = input(false, { transform: booleanAttribute });
  private readonly _disabledForm = signal(false);
  protected readonly computedDisabled = computed(
    () => this.disabled() || this._disabledForm(),
  );

  protected readonly ids = computed(
    () =>
      ({
        input: `${this.componentId()}-input`,
        inputHint: `${this.componentId()}-hint`,
        inputError: `${this.componentId()}-error`,
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
      }) as const,
  );
  protected readonly testIdPrefix = computed(
    () => this.testId()?.trim() || this.componentId(),
  );

  protected readonly dateFormat = computed(() => {
    const configuredFormat = this.luxonDateFormat()?.trim();
    if (configuredFormat) {
      return configuredFormat;
    }

    return LuxonDateInputAutocomplete.getFormat({
      dateOnly: this.dateOnly(),
      showSeconds: this.showSeconds(),
    });
  });

  protected readonly dateFormatDescription = computed(() => {
    const configuredFormat = this.luxonDateFormat()?.trim();
    if (configuredFormat) {
      return configuredFormat;
    }

    return LuxonDateInputAutocomplete.getFormatDescription({
      dateOnly: this.dateOnly(),
      showSeconds: this.showSeconds(),
    });
  });

  protected readonly calendarToggleLabel = computed(() => {
    if (this.isOpen()) {
      return "Kalender schließen";
    }

    return this.dateOnly()
      ? "Kalender zur Auswahl eines Datums öffnen"
      : "Kalender zur Auswahl von Datum und Uhrzeit öffnen";
  });

  protected readonly dialogTitle = computed(() =>
    this.dateOnly() ? "Datum auswählen" : "Datum und Uhrzeit auswählen",
  );

  protected readonly formattedMonth = computed(() =>
    this.viewDate().setLocale("de").toFormat("LLLL yyyy"),
  );

  readonly selectedDate = signal<DateTime | null>(null);
  protected readonly inputDisplayValue = signal("");
  private readonly manualInputError = signal(false);
  private readonly inputAutocomplete = computed(
    () => new LuxonDateInputAutocomplete(this.dateFormat()),
  );
  readonly viewDate = signal<DateTime>(DateTime.now());
  protected readonly isOpen = signal(false);
  protected readonly activeDate = signal<DateTime>(
    DateTime.local().startOf("day"),
  );
  protected readonly timeAnnouncement = signal("");
  protected readonly dateAnnouncement = signal("");

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

  daysOfWeek = Info.weekdays("short", { locale: "de" }).map((short, i) => ({
    short,
    long: Info.weekdays("long", { locale: "de" })[i] ?? short,
    weekday: i + 1,
  }));


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
    dialogTitle: this.dialogTitle(),
    formattedMonth: this.formattedMonth(),
    daysOfWeek: this.daysOfWeek,
    weeks: this.grid(),
    selectedDate: this.selectedDate(),
    activeDate: this.activeDate(),
    today: this.today(),
    viewDate: this.viewDate(),
    testIdPrefix: this.testIdPrefix(),
    dateOnly: this.dateOnly(),
    showSeconds: this.showSeconds(),
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
      const selectedDate = this.selectedDate();
      untracked(() => {
        if (selectedDate && !this.manualInputError()) {
          this.inputDisplayValue.set(selectedDate.toFormat(format));
        }
      });
    });
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
    this.inputDisplayValue.set(newSelectedDate.toFormat(this.dateFormat()));
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
    this.inputDisplayValue.set(now.toFormat(this.dateFormat()));
    this.manualInputError.set(false);
    this.value.set(jsDate);
    this.onChange(jsDate);
    this.closeCalendar();
  }

  protected clearValue(
    event: MouseEvent,
    input: HTMLInputElement,
  ): void {
    event.stopPropagation();

    this.selectedDate.set(null);
    this.inputDisplayValue.set("");
    this.manualInputError.set(false);
    this.value.set(null);
    this.viewDate.set(DateTime.now());
    this.dateAnnouncement.set("Datum gelöscht.");
    this.timeAnnouncement.set("");
    this.onChange(null);
    this.onTouched();

    input.value = "";
    requestAnimationFrame(() => input.focus());
  }

  protected onManualInput(input: HTMLInputElement): void {
    const isDeletion = input.value.length < this.inputDisplayValue().length;
    const result = this.inputAutocomplete().process(input.value, {
      isDeletion,
      now: this.today(),
    });

    input.value = result.value;
    this.inputDisplayValue.set(result.value);
    this.manualInputError.set(!result.valid);

    if (result.date) {
      this.applyManualDate(result.date);
    }
  }

  protected commitManualInput(input: HTMLInputElement): void {
    const result = this.inputAutocomplete().process(input.value, {
      commit: true,
      now: this.today(),
    });

    input.value = result.value;
    this.inputDisplayValue.set(result.value);
    this.manualInputError.set(!result.valid || !result.complete);

    if (result.date) {
      this.applyManualDate(result.date);
    }

    this.onTouched();
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
    this.inputDisplayValue.set(normalizedDate.toFormat(this.dateFormat()));
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
    this.inputDisplayValue.set(newDate.toFormat(this.dateFormat()));
    this.manualInputError.set(false);
    this.value.set(jsDate);
    this.onChange(jsDate);
    this.announceTime();
  }

  private announceTime(): void {
    const date = this.selectedDate();

    if (!date) {
      return;
    }

    let announcement =
      `Uhrzeit ${date.toFormat("HH")} Uhr, ` + `${date.toFormat("mm")} Minuten`;

    if (this.showSeconds()) {
      announcement += ` und ${date.toFormat("ss")} Sekunden`;
    }

    this.timeAnnouncement.set(announcement);
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
        this.inputDisplayValue.set(date.toFormat(this.dateFormat()));
        this.manualInputError.set(false);
        this.viewDate.set(date);
      } else {
        this.selectedDate.set(null);
        this.inputDisplayValue.set("");
        this.manualInputError.set(true);
        this.viewDate.set(DateTime.now());
      }
    } else {
      this.selectedDate.set(null);
      this.inputDisplayValue.set("");
      this.manualInputError.set(false);
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

  isSelected(date: DateTime | null): boolean {
    if (!date || !this.selectedDate()) return false;
    return date.hasSame(this.selectedDate()!, "day");
  }

  isToday(date: DateTime | null): boolean {
    if (!date) return false;
    return date.hasSame(this.today(), "day");
  }

  protected isCurrentWeek(weekInfo: {
    weekNumber: number;
    days: (DateTime | null)[];
  }): boolean {
    return weekInfo.days.some((day) => this.isToday(day));
  }

  protected isCurrentWeekday(weekday: number): boolean {
    return (
      this.today().weekday === weekday &&
      this.today().hasSame(this.viewDate(), "month")
    );
  }

  protected getAccessibleDateLabel(date: DateTime): string {
    const formattedDate = date.setLocale("de").toLocaleString({
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
