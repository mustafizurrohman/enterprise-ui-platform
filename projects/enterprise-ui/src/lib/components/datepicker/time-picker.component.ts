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
  type TimeUnit,
  type TimeUnitControlContext,
} from "./time-unit-control.component";
import type {
  DatepickerDialogContext,
  DatepickerMeridiem,
  DatepickerTimeChange,
} from "./datepicker-dialog.component";

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

  protected emitTimeChange(unit: TimeUnit, value: number): void {
    this.timeChanged.emit({ unit, value });
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
