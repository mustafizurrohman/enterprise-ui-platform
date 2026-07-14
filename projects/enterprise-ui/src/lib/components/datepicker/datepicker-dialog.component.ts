import { NgTemplateOutlet } from "@angular/common";
import { CdkTrapFocus } from "@angular/cdk/a11y";
import { MatIconModule } from "@angular/material/icon";
import { Component, computed, input, output, viewChild } from "@angular/core";
import { DateTime } from "luxon";
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
  readonly dateSelected = output<DateTime>();
  readonly dateFocused = output<DateTime>();
  readonly dateKeydown = output<DatepickerGridKeydown>();
  readonly timeChanged = output<DatepickerTimeChange>();
  readonly nowSelected = output<void>();
  readonly confirmed = output<void>();

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

  focusDate(date: DateTime): void {
    this.calendarGrid().focusDate(date);
  }

  protected emitTimeChange(unit: TimeUnit, value: number): void {
    this.timeChanged.emit({ unit, value });
  }

  protected testIdFor(part: string): string {
    return `${this.testIdPrefix()}-${part}`;
  }

  private createTimeWheelContext(unit: TimeUnit): TimeWheelContext {
    const context = this.context();

    return {
      unit,
      value: this.getTimeValue(context.selectedDate, unit),
      controlId: this.getTimeId(context, unit, "control"),
      labelId: this.getTimeId(context, unit, "label"),
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
