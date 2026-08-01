import { Component, computed, inject, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DateTime } from 'luxon';
import type {
  DatepickerDialogContext,
  DatepickerMeridiem,
  DatepickerTimeChange,
} from './datepicker-dialog.types';
import { DatepickerIdService } from './datepicker-id.service';
import { TimeUnitControlComponent } from './time-unit-control.component';
import type { TimeUnit, TimeUnitControlContext } from './time-unit-control.types';

type TimeAdjustmentUnit = TimeUnit | 'hours' | 'minutes';

const TIME_ADJUSTMENT_KEYS = {
  hour: 'hours',
  hours: 'hours',
  minute: 'minutes',
  minutes: 'minutes',
  second: 'seconds',
} as const;

/**
 * Component for selecting and adjusting time (hours, minutes, and optionally seconds).
 * It supports both manual entry via unit controls and quick adjustments via preset buttons.
 */
@Component({
  selector: 'time-picker',
  standalone: true,
  imports: [MatIconModule, TimeUnitControlComponent],
  templateUrl: './time-picker.component.html',
  styleUrl: './time-picker.component.scss',
})
export class TimePickerComponent {
  /** Service for generating unique and test IDs. */
  private readonly idService = inject(DatepickerIdService);

  /** The context containing configuration and state for the datepicker dialog. */
  readonly context = input.required<DatepickerDialogContext>();

  /** Emitted when a specific time unit (hour, minute, second) is changed. */
  readonly timeChanged = output<DatepickerTimeChange>();

  /** Emitted when the time is adjusted by a relative amount (e.g., +/- 15 minutes). */
  readonly timeAdjusted = output<{ hours?: number; minutes?: number }>();

  /** Whether to show the seconds selector. */
  protected readonly showSeconds = computed(() => this.context().showSeconds);

  /** Whether to show the meridiem (AM/PM) selector. */
  protected readonly showMeridiem = computed(() => this.context().showMeridiem);

  /** Whether to show quick time adjustment controls. */
  protected readonly showQuickTimeControls = computed(() => this.context().showQuickTimeControls);

  /** The available meridiem choices (AM/PM) with their respective labels and IDs. */
  protected readonly meridiemChoices = computed(() => [
    {
      value: 'AM' as const,
      id: this.context().meridiemAmId,
      label: 'AM, vormittags',
      testId: 'meridiem-am',
    },
    {
      value: 'PM' as const,
      id: this.context().meridiemPmId,
      label: 'PM, nachmittags und abends',
      testId: 'meridiem-pm',
    },
  ]);

  /** The current meridiem (AM or PM) based on the selected hour. */
  protected readonly meridiem = computed<DatepickerMeridiem>(() =>
    (this.context().selectedDate?.hour ?? 0) >= 12 ? 'PM' : 'AM',
  );

  /** Context for the hour unit control. */
  protected readonly hourControlContext = computed<TimeUnitControlContext>(() =>
    this.createTimeUnitControlContext('hour'),
  );

  /** Context for the minute unit control. */
  protected readonly minuteControlContext = computed<TimeUnitControlContext>(() =>
    this.createTimeUnitControlContext('minute'),
  );

  /** Context for the second unit control. */
  protected readonly secondControlContext = computed<TimeUnitControlContext>(() =>
    this.createTimeUnitControlContext('second'),
  );

  /** The list of time units (hours, minutes, and optionally seconds) to be displayed. */
  protected readonly timeUnits = computed(() => {
    const units: { type: TimeUnit; context: TimeUnitControlContext }[] = [
      { type: 'hour', context: this.hourControlContext() },
      { type: 'minute', context: this.minuteControlContext() },
    ];

    if (this.showSeconds()) {
      units.push({
        type: 'second',
        context: this.secondControlContext(),
      });
    }

    return units;
  });

  /** Available minute adjustments for quick time selection. */
  protected readonly minuteAdjustments = [
    { value: -30, label: '30 Minuten abziehen', id: 'subtract-30-mins' },
    { value: -15, label: '15 Minuten abziehen', id: 'subtract-15-mins' },
    { value: 15, label: '15 Minuten hinzufügen', id: 'add-15-mins' },
    { value: 30, label: '30 Minuten hinzufügen', id: 'add-30-mins' },
  ] as const;

  /** Available hour adjustments for quick time selection. */
  protected readonly hourAdjustments = [
    { value: -12, label: '12 Stunden abziehen', id: 'subtract-12-hrs' },
    { value: -6, label: '6 Stunden abziehen', id: 'subtract-6-hrs' },
    { value: 6, label: '6 Stunden hinzufügen', id: 'add-6-hrs' },
    { value: 12, label: '12 Stunden hinzufügen', id: 'add-12-hrs' },
  ] as const;

  /** Configuration for grouping time adjustments in the UI. */
  protected readonly adjustmentGroups = [
    {
      unit: 'minutes' as const,
      id: 'minute-adjustment-group',
      buttonsId: 'minute-adjustment-buttons',
      label: 'Minuten anpassen',
      labelText: 'Minuten',
      icon: 'schedule',
      testId: 'minute-adjustment-group',
      iconTestId: 'minute-icon',
      labelTestId: 'minute-adjustment-label',
      adjustments: this.minuteAdjustments,
      controlsId: 'minuteSelectId' as const,
    },
    {
      unit: 'hours' as const,
      id: 'hour-adjustment-group',
      buttonsId: 'hour-adjustment-buttons',
      label: 'Stunden anpassen',
      labelText: 'Stunden',
      icon: 'timer',
      testId: 'hour-adjustment-group',
      iconTestId: 'hour-icon',
      labelTestId: 'hour-adjustment-label',
      adjustments: this.hourAdjustments,
      controlsId: 'hourSelectId' as const,
    },
  ] as const;

  /**
   * Emits a time change event for a specific unit.
   *
   * @param unit The time unit that changed.
   * @param value The new value for the unit.
   */
  protected emitTimeChange(unit: TimeUnit, value: number): void {
    this.timeChanged.emit({ unit, value });
  }

  /**
   * Emits a time adjustment event.
   *
   * @param unit The unit being adjusted.
   * @param value The amount to adjust by.
   */
  protected emitTimeAdjustment(unit: TimeAdjustmentUnit, value: number): void {
    const adjustmentKey = TIME_ADJUSTMENT_KEYS[unit];

    this.timeAdjusted.emit({ [adjustmentKey]: value });
  }

  /**
   * Selects the meridiem (AM/PM) and updates the hour accordingly.
   *
   * @param meridiem The selected meridiem.
   */
  protected selectMeridiem(meridiem: DatepickerMeridiem): void {
    const selectedDate = this.context().selectedDate;

    if (selectedDate && meridiem === this.meridiem()) {
      return;
    }

    const currentHour = selectedDate?.hour ?? 0;
    const hour = meridiem === 'PM' ? (currentHour % 12) + 12 : currentHour % 12;

    this.timeChanged.emit({ unit: 'hour', value: hour });
  }

  /**
   * Sets the time to the current system time.
   */
  protected setCurrentTime(): void {
    const now = DateTime.now();

    this.timeChanged.emit({ unit: 'hour', value: now.hour });
    this.timeChanged.emit({ unit: 'minute', value: now.minute });

    if (this.showSeconds()) {
      this.timeChanged.emit({ unit: 'second', value: now.second });
    }
  }

  /**
   * Generates a unique ID for a component part based on the dialog ID.
   *
   * @param part The name of the component part.
   * @returns A unique ID string.
   */
  protected idFor(part: string): string {
    return this.idService.idFor(part, this.context().dialogId);
  }

  /**
   * Generates a test ID for a component part based on the test ID prefix.
   *
   * @param part The name of the component part.
   * @returns A test ID string.
   */
  protected testIdFor(part: string): string {
    return this.idService.testIdFor(part, this.context().testIdPrefix);
  }

  /**
   * Creates the context for a time unit control.
   *
   * @param unit The time unit to create the context for.
   * @returns The unit control context.
   */
  private createTimeUnitControlContext(unit: TimeUnit): TimeUnitControlContext {
    const context = this.context();

    return {
      unit,
      value: this.getTimeValue(context.selectedDate, unit),
      controlId: this.getTimeId(context, unit, 'control'),
      labelId: this.getTimeId(context, unit, 'label'),
      descriptionId: this.idFor('time-instructions'),
      testIdPrefix: context.testIdPrefix,
      hourCycle: context.uses12HourClock ? 'h12' : 'h23',
      meridiem: this.meridiem(),
    };
  }

  /**
   * Extracts the value for a specific time unit from a DateTime object.
   *
   * @param date The date to extract the value from.
   * @param unit The time unit.
   * @returns The value of the unit, or 0 if date is null.
   */
  private getTimeValue(date: DateTime | null, unit: TimeUnit): number {
    if (!date) {
      return 0;
    }

    switch (unit) {
      case 'hour':
        return date.hour;
      case 'minute':
        return date.minute;
      case 'second':
        return date.second;
    }
  }

  /**
   * Retrieves the ID (either control or label) for a specific time unit from the dialog context.
   *
   * @param context The dialog context.
   * @param unit The time unit.
   * @param type Whether to return the control ID or the label ID.
   * @returns The requested ID string.
   */
  private getTimeId(
    context: DatepickerDialogContext,
    unit: TimeUnit,
    type: 'control' | 'label',
  ): string {
    if (type === 'control') {
      switch (unit) {
        case 'hour':
          return context.hourSelectId;
        case 'minute':
          return context.minuteSelectId;
        case 'second':
          return context.secondSelectId;
      }
    }

    switch (unit) {
      case 'hour':
        return context.hourLabelId;
      case 'minute':
        return context.minuteLabelId;
      case 'second':
        return context.secondLabelId;
    }
  }
}
