import {
  Component,
  computed,
  ElementRef,
  input,
  output,
  viewChildren,
} from "@angular/core";
import { DateTime } from "luxon";

export type DatepickerWeekday = {
  short: string;
  long: string;
  weekday: number;
};

export type DatepickerWeek = {
  weekNumber: number;
  days: (DateTime | null)[];
};

export type DatepickerGridKeydown = {
  event: KeyboardEvent;
  date: DateTime;
};

export type DatepickerGridContext = Readonly<{
  gridId: string;
  daysOfWeek: readonly DatepickerWeekday[];
  weeks: readonly DatepickerWeek[];
  selectedDate: DateTime | null;
  activeDate: DateTime;
  today: DateTime;
  viewDate: DateTime;
  monthHeadingId: string;
  testIdPrefix: string;
}>;

@Component({
  selector: "datepicker-grid",
  standalone: true,
  templateUrl: "./datepicker-grid.component.html",
  styleUrl: "./datepicker-grid.component.scss",
})
export class DatepickerGridComponent {
  readonly context = input.required<DatepickerGridContext>();

  readonly dateSelected = output<DateTime>();
  readonly dateFocused = output<DateTime>();
  readonly dateKeydown = output<DatepickerGridKeydown>();

  protected readonly gridId = computed(() => this.context().gridId);
  protected readonly daysOfWeek = computed(() => this.context().daysOfWeek);
  protected readonly weeks = computed(() => this.context().weeks);
  protected readonly selectedDate = computed(() => this.context().selectedDate);
  protected readonly activeDate = computed(() => this.context().activeDate);
  protected readonly today = computed(() => this.context().today);
  protected readonly viewDate = computed(() => this.context().viewDate);
  protected readonly monthHeadingId = computed(
    () => this.context().monthHeadingId,
  );
  protected readonly testIdPrefix = computed(
    () => this.context().testIdPrefix,
  );

  private readonly calendarDayButtons =
    viewChildren<ElementRef<HTMLButtonElement>>("calendarDay");

  focusDate(date: DateTime): void {
    const isoDate = date.toISODate();

    if (!isoDate) {
      return;
    }

    this.calendarDayButtons()
      .find(({ nativeElement }) => nativeElement.dataset["date"] === isoDate)
      ?.nativeElement.focus();
  }

  protected selectDate(date: DateTime): void {
    this.dateSelected.emit(date);
  }

  protected focusDateCell(date: DateTime): void {
    this.dateFocused.emit(date);
  }

  protected handleDateKeydown(event: KeyboardEvent, date: DateTime): void {
    this.dateKeydown.emit({ event, date });
  }

  protected isSelected(date: DateTime): boolean {
    return !!this.selectedDate()?.hasSame(date, "day");
  }

  protected isToday(date: DateTime | null): boolean {
    return !!date?.hasSame(this.today(), "day");
  }

  protected isActiveDate(date: DateTime): boolean {
    return this.activeDate().hasSame(date, "day");
  }

  protected isCurrentWeek(week: DatepickerWeek): boolean {
    return week.days.some((day) => this.isToday(day));
  }

  protected hasDates(week: DatepickerWeek): boolean {
    return week.days.some((day) => day !== null);
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

  protected dateIso(date: DateTime): string {
    return date.toISODate() ?? String(date.toMillis());
  }

  protected testIdFor(part: string): string {
    return `${this.testIdPrefix()}-${part}`;
  }
}
