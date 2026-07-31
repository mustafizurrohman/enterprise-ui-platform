import { CdkTrapFocus } from '@angular/cdk/a11y';
import { Component, computed, inject, input, output, viewChild } from '@angular/core';
import { DateTime, Info } from 'luxon';
import { DatepickerGridComponent } from './datepicker-grid.component';
import { DatepickerIdService } from './datepicker-id.service';
import { type DatepickerGridContext, type DatepickerGridKeydown } from './datepicker-grid.types';
import { TimePickerComponent } from './time-picker.component';
import { DatepickerHeaderComponent } from './datepicker-header.component';
import { type DatepickerHeaderContext } from './datepicker-header.types';
import {
  type DatepickerDialogContext,
  type DatepickerMeridiem,
  type DatepickerTimeChange,
} from './datepicker-dialog.types';

@Component({
  selector: 'datepicker-dialog',
  standalone: true,
  imports: [CdkTrapFocus, DatepickerGridComponent, TimePickerComponent, DatepickerHeaderComponent],
  templateUrl: './datepicker-dialog.component.html',
  styleUrl: './datepicker-dialog.component.scss',
})
/**
 * A dialog component that displays a datepicker with a calendar grid, header, and optional time picker.
 */
export class DatepickerDialogComponent {
  private readonly idService = inject(DatepickerIdService);

  private readonly calendarGrid = viewChild.required(DatepickerGridComponent);

  /**
   * The context for the datepicker dialog, containing configuration and state.
   */
  readonly context = input.required<DatepickerDialogContext>();

  /**
   * Emitted when the previous month is requested.
   */
  readonly previousMonth = output<void>();

  /**
   * Emitted when the next month is requested.
   */
  readonly nextMonth = output<void>();

  /**
   * Emitted when the previous year is requested.
   */
  readonly previousYear = output<void>();

  /**
   * Emitted when the next year is requested.
   */
  readonly nextYear = output<void>();

  /**
   * Emitted when a date is selected.
   */
  readonly dateSelected = output<DateTime>();

  /**
   * Emitted when a date is focused in the calendar grid.
   */
  readonly dateFocused = output<DateTime>();

  /**
   * Emitted when a keydown event occurs in the calendar grid.
   */
  readonly dateKeydown = output<DatepickerGridKeydown>();

  /**
   * Emitted when the time is changed.
   */
  readonly timeChanged = output<DatepickerTimeChange>();

  /**
   * Emitted when the time is adjusted (e.g., via arrow keys).
   */
  readonly timeAdjusted = output<{
    hours?: number;
    minutes?: number;
    seconds?: number;
  }>();

  /**
   * Emitted when the "now" selection is requested.
   */
  readonly nowSelected = output<void>();

  /**
   * Emitted when the selection is confirmed.
   */
  readonly confirmed = output<void>();

  /**
   * Emitted when a month is selected from the header.
   */
  readonly monthSelected = output<number>();

  /**
   * Emitted when a year is selected from the header.
   */
  readonly yearSelected = output<number>();

  /**
   * The unique ID for the dialog.
   */
  protected readonly dialogId = computed(() => this.context().dialogId);

  /**
   * The ID for the dialog title.
   */
  protected readonly dialogTitleId = computed(() => this.context().dialogTitleId);

  /**
   * The ID for the dialog description.
   */
  protected readonly dialogDescriptionId = computed(() => this.context().dialogDescriptionId);

  /**
   * The ID for the dialog status region.
   */
  protected readonly dialogStatusId = computed(() => this.context().dialogStatusId);

  /**
   * The ID for the month heading.
   */
  protected readonly monthHeadingId = computed(() => this.context().monthHeadingId);

  /**
   * The title displayed in the dialog.
   */
  protected readonly dialogTitle = computed(() => this.context().dialogTitle);

  /**
   * The formatted string of the currently viewed month.
   */
  protected readonly formattedMonth = computed(() => this.context().formattedMonth);

  /**
   * The currently selected date, if any.
   */
  protected readonly selectedDate = computed(() => this.context().selectedDate);

  /**
   * The locale used for formatting.
   */
  protected readonly locale = computed(() => this.context().locale);

  /**
   * Short names of months for the current locale.
   */
  protected readonly shortMonths = computed(() =>
    Info.months('short', {
      locale: this.locale(),
    }),
  );

  /**
   * The currently viewed month as a string.
   */
  protected readonly selectedMonth = computed(() => this.context().viewDate.month.toString());

  /**
   * The prefix for test IDs.
   */
  protected readonly testIdPrefix = computed(() => this.context().testIdPrefix);

  /**
   * Whether only the date should be picked (excluding time).
   */
  protected readonly dateOnly = computed(() => this.context().dateOnly);

  /**
   * Whether seconds should be displayed in the time picker.
   */
  protected readonly showSeconds = computed(() => this.context().showSeconds);

  /**
   * Whether the 12-hour clock format is used.
   */
  protected readonly uses12HourClock = computed(() => this.context().uses12HourClock);

  /**
   * Whether the AM/PM meridiem should be displayed.
   */
  protected readonly showMeridiem = computed(() => this.context().showMeridiem);

  /**
   * The current meridiem (AM or PM) based on the selected date.
   */
  protected readonly meridiem = computed<DatepickerMeridiem>(() =>
    (this.selectedDate()?.hour ?? 0) >= 12 ? 'PM' : 'AM',
  );

  /**
   * The announcement text for the dialog status region.
   */
  protected readonly dialogAnnouncement = computed(() => this.context().dialogAnnouncement);

  /**
   * Whether quick time controls (e.g., "Now") should be shown.
   */
  protected readonly showQuickTimeControls = computed(() => this.context().showQuickTimeControls);

  /**
   * The label for the "Now" selection button.
   */
  protected readonly selectNowLabel = computed(() =>
    this.dateOnly() ? 'Heutiges Datum auswählen' : 'Aktuelles Datum und aktuelle Uhrzeit auswählen',
  );

  /**
   * The ID for the calendar grid.
   */
  protected readonly calendarGridId = computed(() => `${this.dialogId()}-grid`);

  /**
   * The context object for the header component.
   */
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

  /**
   * The context object for the calendar grid component.
   */
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
      isDateDisabled: context.isDateDisabled,
    };
  });

  /**
   * Sets focus to a specific date in the calendar grid.
   *
   * @param date - The date to focus.
   * @returns Whether the focus was successful.
   */
  focusDate(date: DateTime): boolean {
    return this.calendarGrid().focusDate(date);
  }

  /**
   * Generates a unique ID for a part of the dialog.
   *
   * @param part - The name of the part.
   * @returns The generated ID.
   */
  protected idFor(part: string): string {
    return this.idService.idFor(part, this.dialogId());
  }

  /**
   * Generates a test ID for a part of the dialog.
   *
   * @param part - The name of the part.
   * @returns The generated test ID.
   */
  protected testIdFor(part: string): string {
    return this.idService.testIdFor(part, this.testIdPrefix());
  }
}
