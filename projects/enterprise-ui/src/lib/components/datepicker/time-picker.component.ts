import {
  Component,
  computed,
  input,
  output,
} from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { DateTime } from "luxon";
import {
  TimeUnitControlComponent,
} from "./time-unit-control.component";
import {
  type TimeUnit,
  type TimeUnitControlContext,
} from "./time-unit-control.types";
import {
  type DatepickerDialogContext,
  type DatepickerMeridiem,
  type DatepickerTimeChange,
} from "./datepicker-dialog.types";

@Component({
  selector: "time-picker",
  standalone: true,
  imports: [MatIconModule, TimeUnitControlComponent],
  templateUrl: "./time-picker.component.html",
  styleUrl: "./time-picker.component.scss",
})
export class TimePickerComponent {
  readonly context = input.required<DatepickerDialogContext>();

  readonly timeChanged = output<DatepickerTimeChange>();
  readonly timeAdjusted = output<{ hours?: number; minutes?: number }>();

  protected readonly showSeconds = computed(() => this.context().showSeconds);
  protected readonly showMeridiem = computed(() => this.context().showMeridiem);
  protected readonly showQuickTimeControls = computed(
    () => this.context().showQuickTimeControls,
  );
  protected readonly timeAnnouncement = computed(
    () => this.context().timeAnnouncement,
  );

  protected readonly meridiemChoices = computed(() => [
    {
      value: "AM" as const,
      id: this.context().meridiemAmId,
      label: "AM, vormittags",
      testId: "meridiem-am",
    },
    {
      value: "PM" as const,
      id: this.context().meridiemPmId,
      label: "PM, nachmittags und abends",
      testId: "meridiem-pm",
    },
  ]);

  protected readonly minuteAdjustments = [
    { value: -30, label: "30 Minuten abziehen", id: "subtract-30-mins" },
    { value: -15, label: "15 Minuten abziehen", id: "subtract-15-mins" },
    { value: 15, label: "15 Minuten hinzufügen", id: "add-15-mins" },
    { value: 30, label: "30 Minuten hinzufügen", id: "add-30-mins" },
  ] as const;

  protected readonly hourAdjustments = [
    { value: -12, label: "12 Stunden abziehen", id: "subtract-12-hrs" },
    { value: -6, label: "6 Stunden abziehen", id: "subtract-6-hrs" },
    { value: 6, label: "6 Stunden hinzufügen", id: "add-6-hrs" },
    { value: 12, label: "12 Stunden hinzufügen", id: "add-12-hrs" },
  ] as const;

  protected readonly adjustmentGroups = [
    {
      unit: "minutes" as const,
      id: "minute-adjustment-group",
      buttonsId: "minute-adjustment-buttons",
      label: "Minuten anpassen",
      labelText: "Minuten",
      icon: "schedule",
      testId: "minute-adjustment-group",
      iconTestId: "minute-icon",
      labelTestId: "minute-adjustment-label",
      adjustments: this.minuteAdjustments,
      controlsId: "minuteSelectId" as const,
    },
    {
      unit: "hours" as const,
      id: "hour-adjustment-group",
      buttonsId: "hour-adjustment-buttons",
      label: "Stunden anpassen",
      labelText: "Stunden",
      icon: "timer",
      testId: "hour-adjustment-group",
      iconTestId: "hour-icon",
      labelTestId: "hour-adjustment-label",
      adjustments: this.hourAdjustments,
      controlsId: "hourSelectId" as const,
    },
  ] as const;

  protected readonly meridiem = computed<DatepickerMeridiem>(() =>
    (this.context().selectedDate?.hour ?? 0) >= 12 ? "PM" : "AM",
  );

  protected readonly hourControlContext = computed<TimeUnitControlContext>(() =>
    this.createTimeUnitControlContext("hour"),
  );
  protected readonly minuteControlContext = computed<TimeUnitControlContext>(() =>
    this.createTimeUnitControlContext("minute"),
  );
  protected readonly secondControlContext = computed<TimeUnitControlContext>(() =>
    this.createTimeUnitControlContext("second"),
  );

  protected readonly timeUnits = computed(() => {
    const units: { type: TimeUnit; context: TimeUnitControlContext }[] = [
      { type: "hour", context: this.hourControlContext() },
      { type: "minute", context: this.minuteControlContext() },
    ];

    if (this.showSeconds()) {
      units.push({
        type: "second",
        context: this.secondControlContext(),
      });
    }

    return units;
  });

  protected emitTimeChange(unit: TimeUnit, value: number): void {
    this.timeChanged.emit({ unit, value });
  }

  protected emitTimeAdjustment(
    unit: "hours" | "minutes",
    value: number,
  ): void {
    this.timeAdjusted.emit({ [unit]: value });
  }

  protected selectMeridiem(meridiem: DatepickerMeridiem): void {
    const selectedDate = this.context().selectedDate;

    if (selectedDate && meridiem === this.meridiem()) {
      return;
    }

    const currentHour = selectedDate?.hour ?? 0;
    const hour = meridiem === "PM" ? (currentHour % 12) + 12 : currentHour % 12;

    this.timeChanged.emit({ unit: "hour", value: hour });
  }

  protected idFor(part: string): string {
    return `${this.context().dialogId}-${part}`;
  }

  protected testIdFor(part: string): string {
    return `${this.context().testIdPrefix}-${part}`;
  }

  private createTimeUnitControlContext(unit: TimeUnit): TimeUnitControlContext {
    const context = this.context();

    return {
      unit,
      value: this.getTimeValue(context.selectedDate, unit),
      controlId: this.getTimeId(context, unit, "control"),
      labelId: this.getTimeId(context, unit, "label"),
      descriptionId: this.idFor("time-instructions"),
      testIdPrefix: context.testIdPrefix,
      hourCycle: context.uses12HourClock ? "h12" : "h23",
      meridiem: this.meridiem(),
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
