import { CdkTrapFocus } from "@angular/cdk/a11y";
import {
  Component,
  computed,
  inject,
  input,
  output,
  viewChild,
} from "@angular/core";
import { DateTime, Info } from "luxon";
import { DatepickerGridComponent } from "./datepicker-grid.component";
import { DatepickerIdService } from "./datepicker-id.service";
import {
  type DatepickerGridContext,
  type DatepickerGridKeydown,
  type DatepickerWeek,
  type DatepickerWeekday,
} from "./datepicker-grid.types";
import { type TimeUnit } from "./time-unit-control.types";
import { TimePickerComponent } from "./time-picker.component";
import { DatepickerHeaderComponent } from "./datepicker-header.component";
import { type DatepickerHeaderContext } from "./datepicker-header.types";
import {
  type DatepickerDialogContext,
  type DatepickerMeridiem,
  type DatepickerTimeChange,
} from "./datepicker-dialog.types";

@Component({
  selector: "datepicker-dialog",
  standalone: true,
  imports: [
    CdkTrapFocus,
    DatepickerGridComponent,
    TimePickerComponent,
    DatepickerHeaderComponent,
  ],
  templateUrl: "./datepicker-dialog.component.html",
  styleUrl: "./datepicker-dialog.component.scss",
})
export class DatepickerDialogComponent {
  private readonly idService = inject(DatepickerIdService);
  readonly context = input.required<DatepickerDialogContext>();

  readonly previousMonth = output<void>();
  readonly nextMonth = output<void>();
  readonly previousYear = output<void>();
  readonly nextYear = output<void>();
  readonly dateSelected = output<DateTime>();
  readonly dateFocused = output<DateTime>();
  readonly dateKeydown = output<DatepickerGridKeydown>();
  readonly timeChanged = output<DatepickerTimeChange>();
  readonly timeAdjusted = output<{
    hours?: number;
    minutes?: number;
    seconds?: number;
  }>();
  readonly nowSelected = output<void>();
  readonly confirmed = output<void>();
  readonly monthSelected = output<number>();
  readonly yearSelected = output<number>();

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
  protected readonly selectedDate = computed(() => this.context().selectedDate);
  protected readonly locale = computed(() => this.context().locale);
  protected readonly shortMonths = computed(() =>
    Info.months("short", {
      locale: this.locale(),
    }),
  );
  protected readonly selectedMonth = computed(() =>
    this.context().viewDate.month.toString(),
  );
  protected readonly testIdPrefix = computed(() => this.context().testIdPrefix);
  protected readonly dateOnly = computed(() => this.context().dateOnly);
  protected readonly showSeconds = computed(() => this.context().showSeconds);
  protected readonly uses12HourClock = computed(
    () => this.context().uses12HourClock,
  );
  protected readonly showMeridiem = computed(() => this.context().showMeridiem);
  protected readonly meridiem = computed<DatepickerMeridiem>(() =>
    (this.selectedDate()?.hour ?? 0) >= 12 ? "PM" : "AM",
  );
  protected readonly dateAnnouncement = computed(
    () => this.context().dateAnnouncement,
  );
  protected readonly timeAnnouncement = computed(
    () => this.context().timeAnnouncement,
  );
  protected readonly showQuickTimeControls = computed(
    () => this.context().showQuickTimeControls,
  );

  protected readonly selectNowLabel = computed(() =>
    this.dateOnly()
      ? "Heutiges Datum auswählen"
      : "Aktuelles Datum und aktuelle Uhrzeit auswählen",
  );

  protected readonly calendarGridId = computed(() => `${this.dialogId()}-grid`);

  protected readonly headerContext = computed<DatepickerHeaderContext>(() => {
    const context = this.context();
    return {
      dialogId: this.dialogId(),
      testIdPrefix: this.testIdPrefix(),
      calendarGridId: this.calendarGridId(),
      monthHeadingId: this.monthHeadingId(),
      formattedMonth: this.formattedMonth(),
      selectedMonth: this.selectedMonth(),
      shortMonths: this.shortMonths(),
      todayMonth: context.today.month,
      todayYear: context.today.year,
      viewYear: context.viewDate.year,
    };
  });

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
      locale: context.locale,
    };
  });

  private readonly calendarGrid = viewChild.required(DatepickerGridComponent);

  focusDate(date: DateTime): void {
    this.calendarGrid().focusDate(date);
  }

  protected idFor(part: string): string {
    return this.idService.idFor(part, this.dialogId());
  }

  protected testIdFor(part: string): string {
    return this.idService.testIdFor(part, this.testIdPrefix());
  }
}
