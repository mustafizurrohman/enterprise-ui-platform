import {
  Component,
  ElementRef,
  input,
  output,
  viewChildren,
} from "@angular/core";
import { DateTime } from "luxon";

export type MrDatepickerWeekday = {
  short: string;
  long: string;
  weekday: number;
};

export type MrDatepickerWeek = {
  weekNumber: number;
  days: (DateTime | null)[];
};

export type MrDatepickerGridKeydown = {
  event: KeyboardEvent;
  date: DateTime;
};

@Component({
  selector: "mr-datepicker-grid",
  standalone: true,
  templateUrl: "./mr-datepicker-grid.component.html",
  styleUrl: "./mr-datepicker-grid.component.scss",
})
export class MrDatepickerGridComponent {
  readonly gridId = input.required<string>();
  readonly daysOfWeek = input.required<readonly MrDatepickerWeekday[]>();
  readonly weeks = input.required<readonly MrDatepickerWeek[]>();
  readonly monthAbbreviation = input.required<string>();
  readonly selectedDate = input<DateTime | null>(null);
  readonly activeDate = input.required<DateTime>();
  readonly today = input.required<DateTime>();
  readonly viewDate = input.required<DateTime>();
  readonly monthHeadingId = input.required<string>();
  readonly testIdPrefix = input.required<string>();

  readonly dateSelected = output<DateTime>();
  readonly dateFocused = output<DateTime>();
  readonly dateKeydown = output<MrDatepickerGridKeydown>();

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

  protected isCurrentWeek(week: MrDatepickerWeek): boolean {
    return week.days.some((day) => this.isToday(day));
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
