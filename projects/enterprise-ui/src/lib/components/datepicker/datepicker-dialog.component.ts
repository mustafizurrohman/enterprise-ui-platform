import { CdkTrapFocus } from "@angular/cdk/a11y";
import {
  Component,
  computed,
  input,
  output,
  viewChild,
} from "@angular/core";
import { DateTime, Info } from "luxon";
import {
  DatepickerGridComponent,
  type DatepickerGridContext,
  type DatepickerGridKeydown,
  type DatepickerWeek,
  type DatepickerWeekday,
} from "./datepicker-grid.component";
import { type TimeUnit } from "./time-unit-control.component";
import { TimePickerComponent } from "./time-picker.component";
import {
  DatepickerHeaderComponent,
  type DatepickerHeaderContext,
} from "./datepicker-header.component";

export type DatepickerTimeChange = {
  unit: TimeUnit;
  value: number;
};

export type DatepickerMeridiem = "AM" | "PM";

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
  meridiemGroupId: string;
  meridiemLabelId: string;
  meridiemAmId: string;
  meridiemPmId: string;
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
  uses12HourClock: boolean;
  showMeridiem: boolean;
  locale: string;
  dateAnnouncement: string;
  timeAnnouncement: string;
  showQuickTimeControls: boolean;
}>;

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
    return `${this.dialogId()}-${part}`;
  }

  protected testIdFor(part: string): string {
    return `${this.testIdPrefix()}-${part}`;
  }
}
