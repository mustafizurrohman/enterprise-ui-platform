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
import { CdkTrapFocus } from "@angular/cdk/a11y";
import { DateTime, Info } from "luxon";
import { MrDatepickerGridComponent } from "./mr-datepicker-grid.component";
import { MrTimeWheelComponent, type TimeUnit } from "./mr-time-wheel.component";

@Component({
  selector: "mr-datepicker",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CdkConnectedOverlay,
    CdkOverlayOrigin,
    CdkTrapFocus,
    MatIconModule,
    MrDatepickerGridComponent,
    MrTimeWheelComponent,
  ],
  templateUrl: "./mr-datepicker.component.html",
  styleUrl: "./mr-datepicker.component.scss",
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MrDatepickerComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => MrDatepickerComponent),
      multi: true,
    },
  ],
})
export class MrDatepickerComponent implements ControlValueAccessor, Validator {
  private static nextId = 0;
  private readonly componentId = `mr-datepicker-${MrDatepickerComponent.nextId++}`;
  private lastFocusedTrigger: HTMLElement | null = null;

  readonly label = input<string>("Datum auswählen");
  readonly value = model<string | null>(null);
  readonly dateOnly = input(false, { transform: booleanAttribute });
  readonly showSeconds = input(false, { transform: booleanAttribute });
  readonly today = input<DateTime>(DateTime.now());
  readonly testId = input<string | null>(null);

  readonly disabled = input(false, { transform: booleanAttribute });
  private readonly _disabledForm = signal(false);
  protected readonly computedDisabled = computed(
    () => this.disabled() || this._disabledForm(),
  );

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
  protected readonly testIdPrefix = computed(
    () => this.testId()?.trim() || this.componentId,
  );

  protected readonly dateFormat = computed(() => {
    if (this.dateOnly()) {
      return "dd.MM.yyyy";
    }
    return this.showSeconds()
      ? "dd.MM.yyyy HH:mm:ss 'Uhr'"
      : "dd.MM.yyyy HH:mm 'Uhr'";
  });

  protected readonly dateFormatDescription = computed(() => {
    if (this.dateOnly()) {
      return "TT.MM.JJJJ";
    }
    return this.showSeconds()
      ? "TT.MM.JJJJ HH:mm:ss Uhr"
      : "TT.MM.JJJJ HH:mm Uhr";
  });

  readonly selectedDate = signal<DateTime | null>(null);
  readonly viewDate = signal<DateTime>(DateTime.now());
  protected readonly isOpen = signal(false);
  protected readonly activeDate = signal<DateTime>(
    DateTime.local().startOf("day"),
  );
  protected readonly timeAnnouncement = signal("");
  protected readonly dateAnnouncement = signal("");

  private readonly dateInput =
    viewChild<ElementRef<HTMLInputElement>>("dateInput");
  private readonly calendarGrid = viewChild(MrDatepickerGridComponent);

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

  protected readonly monthAbbreviation = computed(() =>
    this.viewDate()
      .startOf("month")
      .setLocale("de")
      .toFormat("LLL")
      .toUpperCase(),
  );

  readonly grid = computed(() => {
    const startOfMonth = this.viewDate().startOf("month");
    const daysInMonth = startOfMonth.daysInMonth ?? 0;
    const firstDayWeekday = startOfMonth.weekday;

    // Monday-based index: 0 = Mon, 6 = Sun
    const mondayBasedFirstDayIndex = firstDayWeekday - 1;

    // The first cell is always reserved for the month abbreviation.
    // A month beginning on Monday therefore starts in the first column
    // of the following row; all other months keep day 1 in its weekday column.
    const leadingCellCount =
      mondayBasedFirstDayIndex === 0 ? 7 : mondayBasedFirstDayIndex;

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

  onChange: (value: string | null) => void = () => {};
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
        if (v !== this.selectedDate()?.toISO()) {
          this.writeValue(v);
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
    if (event.key === "Enter" || event.key === "ArrowDown") {
      event.preventDefault();
      this.openCalendar(input);
      return;
    }

    if (event.key === "Escape" && this.isOpen()) {
      event.preventDefault();
      this.closeCalendar();
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
    this.calendarGrid()?.focusDate(this.activeDate());
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

    const iso = newSelectedDate.toISO();
    this.selectedDate.set(newSelectedDate);
    this.value.set(iso);
    this.onChange(iso);
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
    const iso = now.toISO();
    this.selectedDate.set(now);
    this.value.set(iso);
    this.onChange(iso);
    this.closeCalendar();
  }

  protected onManualInput(input: HTMLInputElement): void {
    const value = input.value;
    const parsedDate = DateTime.fromFormat(value, this.dateFormat());

    if (parsedDate.isValid) {
      const iso = parsedDate.toISO();
      this.selectedDate.set(parsedDate);
      this.viewDate.set(parsedDate);
      this.value.set(iso);
      this.onChange(iso);
    } else {
      input.value = this.selectedDate()
        ? this.selectedDate()!.toFormat(this.dateFormat())
        : "";
    }
    this.onTouched();
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
    const iso = newDate.toISO();
    this.selectedDate.set(newDate);
    this.value.set(iso);
    this.onChange(iso);
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

  writeValue(value: string | null): void {
    if (this.value() !== value) {
      this.value.set(value);
    }
    if (value) {
      let date = DateTime.fromISO(value);
      if (!date.isValid) {
        date = DateTime.fromSQL(value); // Fallback for some formats
      }
      if (date.isValid) {
        if (this.dateOnly()) {
          date = date.startOf("day");
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

  validate(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) {
      return null;
    }
    let date = DateTime.fromISO(value);
    if (!date.isValid) {
      date = DateTime.fromSQL(value);
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
      !!this.ngControl?.invalid &&
      (!!this.ngControl?.touched || !!this.ngControl?.dirty)
    );
  }

  protected inputDescriptionIds(): string {
    return this.hasInputError()
      ? `${this.inputHintId} ${this.inputErrorId}`
      : this.inputHintId;
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
