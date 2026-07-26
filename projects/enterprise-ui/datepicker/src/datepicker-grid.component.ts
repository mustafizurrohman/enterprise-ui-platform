import {
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
  viewChildren,
} from "@angular/core";
import { DateTime } from "luxon";
import {
  type DatepickerGridContext,
  type DatepickerGridKeydown,
  type DatepickerWeek,
} from "./datepicker-grid.types";
import { DatepickerIdService } from "./datepicker-id.service";

@Component({
  selector: "datepicker-grid",
  standalone: true,
  templateUrl: "./datepicker-grid.component.html",
  styleUrl: "./datepicker-grid.component.scss",
})
export class DatepickerGridComponent {
  private readonly idService = inject(DatepickerIdService);
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
  protected readonly testIdPrefix = computed(() => this.context().testIdPrefix);
  protected readonly locale = computed(() => this.context().locale);

  private readonly calendarDayButtons =
    viewChildren<ElementRef<HTMLButtonElement>>("calendarDay");

  focusDate(date: DateTime): boolean {
    const isoDate = date.toISODate();

    if (!isoDate) {
      return false;
    }

    const button = this.calendarDayButtons().find(
      ({ nativeElement }) => nativeElement.dataset["date"] === isoDate,
    )?.nativeElement;

    if (!button) {
      return false;
    }

    button.focus({ preventScroll: true });
    return button.ownerDocument.activeElement === button;
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
    return date.setLocale(this.locale()).toLocaleString({
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  protected dateIso(date: DateTime): string {
    return date.toISODate() ?? String(date.toMillis());
  }

  protected idFor(part: string): string {
    return this.idService.idFor(part, this.gridId());
  }

  protected testIdFor(part: string): string {
    return this.idService.testIdFor(part, this.testIdPrefix());
  }
}
