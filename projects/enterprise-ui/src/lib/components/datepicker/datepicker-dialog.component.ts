import { CommonModule, NgTemplateOutlet } from "@angular/common";
import { CdkTrapFocus } from "@angular/cdk/a11y";
import { MatIconModule } from "@angular/material/icon";
import { Component, computed, effect, input, output, untracked, viewChild } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from "@angular/material/autocomplete";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import { DateTime } from "luxon";
import { startWith, map, Observable } from "rxjs";
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
    CommonModule,
    NgTemplateOutlet,
    CdkTrapFocus,
    MatIconModule,
    MatAutocompleteModule,
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
  readonly nowSelected = output<void>();
  readonly confirmed = output<void>();
  readonly monthSelected = output<number>();
  readonly yearSelected = output<number>();

  protected readonly monthControl = new FormControl<string>("", { nonNullable: true });
  protected readonly yearControl = new FormControl<string>("", { nonNullable: true });

  protected filteredMonths$!: Observable<{ name: string; index: number }[]>;
  protected filteredYears$!: Observable<number[]>;

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

  constructor() {
    this.filteredMonths$ = this.monthControl.valueChanges.pipe(
      startWith(""),
      map((value) => this._filterMonths(value || "")),
    );

    this.filteredYears$ = this.yearControl.valueChanges.pipe(
      startWith(""),
      map((value) => this._filterYears(value || "")),
    );

    effect(() => {
      const context = this.context();
      untracked(() => {
        const monthName = context.months[context.viewDate.month - 1];
        if (this.monthControl.value !== monthName) {
          this.monthControl.setValue(monthName, { emitEvent: false });
        }
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
    const target = event.target as HTMLSelectElement;
    this.monthSelected.emit(Number(target.value));
  }

  protected onMonthOptionSelected(event: MatAutocompleteSelectedEvent): void {
    const monthName = event.option.viewValue;
    const monthIndex = this.context().months.indexOf(monthName) + 1;
    if (monthIndex > 0) {
      this.monthSelected.emit(monthIndex);
    }
  }

  protected onYearOptionSelected(event: MatAutocompleteSelectedEvent): void {
    const year = Number(event.option.value);
    if (!isNaN(year)) {
      this.yearSelected.emit(year);
    }
  }

  protected onMonthBlur(): void {
    const value = this.monthControl.value;
    const monthIndex = this.context().months.findIndex(
      (m) => m.toLowerCase() === value.toLowerCase(),
    );

    if (monthIndex !== -1) {
      const monthName = this.context().months[monthIndex];
      this.monthControl.setValue(monthName, { emitEvent: false });
      this.monthSelected.emit(monthIndex + 1);
    } else {
      // Restore original value
      this.monthControl.setValue(
        this.context().months[this.context().viewDate.month - 1],
        { emitEvent: false },
      );
    }
  }

  protected onYearBlur(): void {
    const value = this.yearControl.value;
    const year = parseInt(value, 10);
    if (!isNaN(year) && year > 0) {
      this.yearSelected.emit(year);
    } else {
      // Restore original value
      this.yearControl.setValue(this.context().viewDate.year.toString(), {
        emitEvent: false,
      });
    }
  }

  protected testIdFor(part: string): string {
    return `${this.testIdPrefix()}-${part}`;
  }

  private _filterMonths(value: string): { name: string; index: number }[] {
    const filterValue = value.toLowerCase();
    return this.context()
      .months.map((name, index) => ({ name, index: index + 1 }))
      .filter((month) => month.name.toLowerCase().includes(filterValue));
  }

  private _filterYears(value: string): number[] {
    const currentYear = DateTime.now().year;
    const years = Array.from({ length: 101 }, (_, i) => currentYear - 50 + i);
    const filterValue = value.toLowerCase();
    return years.filter((year) => year.toString().includes(filterValue));
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
