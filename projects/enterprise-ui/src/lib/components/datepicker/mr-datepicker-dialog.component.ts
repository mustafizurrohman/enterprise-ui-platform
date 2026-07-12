import { Component, computed, input, output, viewChild } from "@angular/core";
import { NgTemplateOutlet } from "@angular/common";
import { CdkTrapFocus } from "@angular/cdk/a11y";
import { MatIconModule } from "@angular/material/icon";
import { DateTime } from "luxon";
import { MrDatepickerGridComponent, type MrDatepickerGridKeydown, type MrDatepickerWeek, type MrDatepickerWeekday } from "./mr-datepicker-grid.component";
import { MrTimeWheelComponent, type TimeUnit } from "./mr-time-wheel.component";

export type MrDatepickerTimeChange = {
  unit: TimeUnit;
  value: number;
};

@Component({
  selector: "mr-datepicker-dialog",
  standalone: true,
  imports: [NgTemplateOutlet, CdkTrapFocus, MatIconModule, MrDatepickerGridComponent, MrTimeWheelComponent],
  templateUrl: "./mr-datepicker-dialog.component.html",
  styleUrl: "./mr-datepicker-dialog.component.scss",
})
export class MrDatepickerDialogComponent {
  readonly dialogId = input.required<string>();
  readonly dialogTitleId = input.required<string>();
  readonly dialogDescriptionId = input.required<string>();
  readonly monthHeadingId = input.required<string>();
  readonly hourSelectId = input.required<string>();
  readonly minuteSelectId = input.required<string>();
  readonly secondSelectId = input.required<string>();
  readonly hourLabelId = input.required<string>();
  readonly minuteLabelId = input.required<string>();
  readonly secondLabelId = input.required<string>();
  readonly dialogTitle = input.required<string>();
  readonly formattedMonth = input.required<string>();
  readonly daysOfWeek = input.required<readonly MrDatepickerWeekday[]>();
  readonly weeks = input.required<readonly MrDatepickerWeek[]>();
  readonly monthAbbreviation = input.required<string>();
  readonly selectedDate = input<DateTime | null>(null);
  readonly activeDate = input.required<DateTime>();
  readonly today = input.required<DateTime>();
  readonly viewDate = input.required<DateTime>();
  readonly testIdPrefix = input.required<string>();
  readonly dateOnly = input.required<boolean>();
  readonly showSeconds = input.required<boolean>();
  readonly dateAnnouncement = input.required<string>();
  readonly timeAnnouncement = input.required<string>();

  readonly previousMonth = output<void>();
  readonly nextMonth = output<void>();
  readonly dateSelected = output<DateTime>();
  readonly dateFocused = output<DateTime>();
  readonly dateKeydown = output<MrDatepickerGridKeydown>();
  readonly timeChanged = output<MrDatepickerTimeChange>();
  readonly nowSelected = output<void>();
  readonly confirmed = output<void>();

  protected readonly calendarGridId = computed(() => `${this.dialogId()}-grid`);
  private readonly calendarGrid = viewChild.required(MrDatepickerGridComponent);

  focusDate(date: DateTime): void {
    this.calendarGrid().focusDate(date);
  }

  protected emitTimeChange(unit: TimeUnit, value: number): void {
    this.timeChanged.emit({ unit, value });
  }

  protected testIdFor(part: string): string {
    return `${this.testIdPrefix()}-${part}`;
  }
}
