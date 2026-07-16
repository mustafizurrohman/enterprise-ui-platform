import { NgTemplateOutlet } from "@angular/common";
import { CdkTrapFocus } from "@angular/cdk/a11y";
import { MatIconModule } from "@angular/material/icon";
import {
  Component,
  computed,
  effect,
  input,
  output,
  untracked,
  viewChild,
} from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import { DateTime, Info } from "luxon";
import {
  DatepickerGridComponent,
  type DatepickerGridContext,
  type DatepickerGridKeydown,
  type DatepickerWeek,
  type DatepickerWeekday,
} from "./datepicker-grid.component";
import {
  TimeWheelComponent,
  type TimeUnit,
  type TimeWheelContext,
} from "./time-wheel.component";

export type DatepickerTimeChange = {
  unit: TimeUnit;
  value: number;
};

export type DatepickerDialogContext = Readonly<{
  dialogId: string;
  dialogTitleId: string;
  dialogDescriptionId: string;
  monthHeadingId: string;
  hourSelectId: string;
  minuteSelectId: string;
  secondSelectId: string;
  hourLabelId: string;
  minuteLabelId: string;
  secondLabelId: string;
  dialogTitle: string;
  formattedMonth: string;
  months: readonly string[];
  daysOfWeek: readonly DatepickerWeekday[];
  weeks: readonly DatepickerWeek[];
  selectedDate: DateTime | null;
  activeDate: DateTime;
  today: DateTime;
  viewDate: DateTime;
  testIdPrefix: string;
  dateOnly: boolean;
  showSeconds: boolean;
  dateAnnouncement: string;
  timeAnnouncement: string;
}>;

@Component({
  selector: "datepicker-dialog",
  standalone: true,
  imports: [
    NgTemplateOutlet,
    CdkTrapFocus,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    DatepickerGridComponent,
    TimeWheelComponent,
  ],
  templateUrl: "./datepicker-dialog.component.html",
  styleUrl: "./datepicker-dialog.component.scss",
})
export class DatepickerDialogComponent {
  readonly context = input.required<DatepickerDialogContext>();

  readonly previousMonth = output<void>();
  readonly nextMonth = output<void>();
  readonly previousYear = output<void>();
  readonly nextYear = output<void>();
  readonly dateSelected = output<DateTime>();
  readonly dateFocused = output<DateTime>();
  readonly dateKeydown = output<DatepickerGridKeydown>();
  readonly timeChanged = output<DatepickerTimeChange>();
  readonly timeAdjusted = output<{ hours?: number; minutes?: number }>();
  readonly nowSelected = output<void>();
  readonly confirmed = output<void>();
  readonly monthSelected = output<number>();
  readonly yearSelected = output<number>();

  protected readonly yearControl = new FormControl<string>("", {
    nonNullable: true,
  });

  protected readonly dialogId = computed(() => this.context().dialogId);
  protected readonly dialogTitleId = computed(
    () => this.context().dialogTitleId,
  );
  protected readonly dialogDescriptionId = computed(
    () => this.context().dialogDescriptionId,
  );
  protected readonly monthHeadingId = computed(
    () => this.context().monthHeadingId,
  );
  protected readonly dialogTitle = computed(() => this.context().dialogTitle);
  protected readonly formattedMonth = computed(
    () => this.context().formattedMonth,
  );
  protected readonly selectedDate = computed(
    () => this.context().selectedDate,
  );
  protected readonly shortMonths = computed(() =>
    Info.months("short", {
      locale: this.context().viewDate.locale ?? undefined,
    }),
  );
  protected readonly selectedMonth = computed(
    () => this.context().viewDate.month.toString(),
  );
  protected readonly testIdPrefix = computed(
    () => this.context().testIdPrefix,
  );
  protected readonly dateOnly = computed(() => this.context().dateOnly);
  protected readonly showSeconds = computed(() => this.context().showSeconds);
  protected readonly dateAnnouncement = computed(
    () => this.context().dateAnnouncement,
  );
  protected readonly timeAnnouncement = computed(
    () => this.context().timeAnnouncement,
  );

  protected readonly calendarGridId = computed(
    () => `${this.dialogId()}-grid`,
  );

  protected readonly gridContext = computed<DatepickerGridContext>(() => {
    const context = this.context();

    return {
      gridId: this.calendarGridId(),
      daysOfWeek: context.daysOfWeek,
      weeks: context.weeks,
      selectedDate: context.selectedDate,
      activeDate: context.activeDate,
      today: context.today,
      viewDate: context.viewDate,
      monthHeadingId: context.monthHeadingId,
      testIdPrefix: context.testIdPrefix,
    };
  });

  protected readonly hourWheelContext = computed<TimeWheelContext>(() =>
    this.createTimeWheelContext("hour"),
  );
  protected readonly minuteWheelContext = computed<TimeWheelContext>(() =>
    this.createTimeWheelContext("minute"),
  );
  protected readonly secondWheelContext = computed<TimeWheelContext>(() =>
    this.createTimeWheelContext("second"),
  );

  private readonly calendarGrid = viewChild.required(DatepickerGridComponent);

  constructor() {
    effect(() => {
      const context = this.context();
      untracked(() => {
        const yearStr = context.viewDate.year.toString();
        if (this.yearControl.value !== yearStr) {
          this.yearControl.setValue(yearStr, { emitEvent: false });
        }
      });
    });
  }

  focusDate(date: DateTime): void {
    this.calendarGrid().focusDate(date);
  }

  protected emitTimeChange(unit: TimeUnit, value: number): void {
    this.timeChanged.emit({ unit, value });
  }

  protected onMonthChange(event: Event): void {
    const month = Number.parseInt(
      (event.target as HTMLSelectElement).value,
      10,
    );

    if (Number.isInteger(month) && month >= 1 && month <= 12) {
      this.monthSelected.emit(month);
    }
  }

  protected onYearInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitizedValue = input.value.replace(/\D/g, "").slice(0, 4);

    if (input.value !== sanitizedValue) {
      input.value = sanitizedValue;
    }

    if (this.yearControl.value !== sanitizedValue) {
      this.yearControl.setValue(sanitizedValue, { emitEvent: false });
    }
  }

  protected onYearEnter(event: Event): void {
    (event.target as HTMLInputElement).blur();
  }

  protected onYearBlur(): void {
    const value = this.yearControl.value;

    if (/^\d{4}$/.test(value) && Number(value) > 0) {
      this.yearSelected.emit(Number(value));
      return;
    }

    this.restoreCurrentYear();
  }

  protected idFor(part: string): string {
    return `${this.dialogId()}-${part}`;
  }

  protected testIdFor(part: string): string {
    return `${this.testIdPrefix()}-${part}`;
  }

  private restoreCurrentYear(): void {
    this.yearControl.setValue(this.context().viewDate.year.toString(), {
      emitEvent: false,
    });
  }

  private createTimeWheelContext(unit: TimeUnit): TimeWheelContext {
    const context = this.context();

    return {
      unit,
      value: this.getTimeValue(context.selectedDate, unit),
      controlId: this.getTimeId(context, unit, "control"),
      labelId: this.getTimeId(context, unit, "label"),
      descriptionId: this.idFor("time-instructions"),
      testIdPrefix: context.testIdPrefix,
    };
  }

  private getTimeValue(date: DateTime | null, unit: TimeUnit): number {
    if (!date) {
      return 0;
    }

    switch (unit) {
      case "hour":
        return date.hour;
      case "minute":
        return date.minute;
      case "second":
        return date.second;
    }
  }

  private getTimeId(
    context: DatepickerDialogContext,
    unit: TimeUnit,
    type: "control" | "label",
  ): string {
    if (type === "control") {
      switch (unit) {
        case "hour":
          return context.hourSelectId;
        case "minute":
          return context.minuteSelectId;
        case "second":
          return context.secondSelectId;
      }
    }

    switch (unit) {
      case "hour":
        return context.hourLabelId;
      case "minute":
        return context.minuteLabelId;
      case "second":
        return context.secondLabelId;
    }
  }
}
