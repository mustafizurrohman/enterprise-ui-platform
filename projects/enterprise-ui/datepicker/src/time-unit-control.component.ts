import { Component, computed, inject, input, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RepeatClickDirective } from '@mr/enterprise-ui/common';
import { DatepickerIdService } from './datepicker-id.service';

import {
  type TimeUnit,
  type TimeUnitConfiguration,
  type TimeUnitControlAnimationDirection,
  type TimeUnitControlAnimationPhase,
  type TimeUnitControlAnimationState,
  type TimeUnitControlContext,
  type TimeUnitControlMeridiem,
} from './time-unit-control.types';

const PRESS_HOLD_INITIAL_DELAY_MS = 300;
const RAPID_CHANGE_THRESHOLD_MS = PRESS_HOLD_INITIAL_DELAY_MS * 1.1;

const TIME_UNIT_CONFIGURATION: Record<TimeUnit, TimeUnitConfiguration> = {
  hour: {
    label: 'Std',
    singularLabel: 'Stunde',
    valueTextSuffix: 'Uhr',
    minimum: 0,
    maximum: 23,
  },
  minute: {
    label: 'Min',
    singularLabel: 'Minute',
    valueTextSuffix: 'Minuten',
    minimum: 0,
    maximum: 59,
  },
  second: {
    label: 'Sek',
    singularLabel: 'Sekunde',
    valueTextSuffix: 'Sekunden',
    minimum: 0,
    maximum: 59,
  },
};

/**
 * A component for controlling a single time unit (hour, minute, or second) in a date picker.
 */
@Component({
  selector: 'time-unit-control',
  standalone: true,
  imports: [MatIconModule, RepeatClickDirective],
  templateUrl: './time-unit-control.component.html',
  styleUrl: './time-unit-control.component.scss',
})
export class TimeUnitControlComponent {
  private readonly idService = inject(DatepickerIdService);

  // --- Inputs ---

  /** The context for the time unit control, providing necessary configuration and identification. */
  readonly context = input.required<TimeUnitControlContext>();

  // --- Outputs ---

  /** Emits when the time unit value changes. */
  readonly valueChange = output<number>();

  /** Emits when the value is shifted by a specific amount. */
  readonly offsetChange = output<number>();

  // --- Computed Properties ---

  /** The current time unit (hour, minute, or second). */
  protected readonly unit = computed(() => this.context().unit);

  /** The current raw value of the time unit. */
  protected readonly value = computed(() => this.context().value);

  /** The value to be displayed in the UI, adjusted for 12-hour cycle if necessary. */
  protected readonly displayValue = computed(() =>
    this.is12HourControl() ? to12Hour(this.value()) : this.value(),
  );

  /** The unique identifier for the control. */
  protected readonly controlId = computed(() => this.context().controlId);

  /** The identifier for the control's label. */
  protected readonly labelId = computed(() => this.context().labelId);

  /** The identifier for the control's description, if available. */
  protected readonly descriptionId = computed(() => this.context().descriptionId ?? null);

  /** The prefix used for test identifiers. */
  protected readonly testIdPrefix = computed(() => this.context().testIdPrefix);

  /** The identifier for the unit display element. */
  protected readonly unitId = computed(() => this.idService.idFor('unit', this.controlId()));

  /** The identifier for the value display element. */
  protected readonly valueId = computed(() => this.idService.idFor('value', this.controlId()));

  /** The identifier for the button stack container. */
  protected readonly buttonStackId = computed(() =>
    this.idService.idFor('button-stack', this.controlId()),
  );

  /** The identifier for the increment button. */
  protected readonly incrementButtonId = computed(() =>
    this.idService.idFor('increment', this.controlId()),
  );

  /** The identifier for the decrement button. */
  protected readonly decrementButtonId = computed(() =>
    this.idService.idFor('decrement', this.controlId()),
  );

  /** The configuration for the current time unit (label, bounds, etc.). */
  protected readonly configuration = computed<TimeUnitConfiguration>(() => {
    const configuration = TIME_UNIT_CONFIGURATION[this.unit()];

    if (this.unit() === 'hour' && this.context().hourCycle === 'h12') {
      return {
        ...configuration,
        minimum: 1,
        maximum: 12,
      };
    }

    return configuration;
  });

  /** The text used for accessibility to describe the current value. */
  protected readonly accessibleValueText = computed(() => {
    const accessibleValue = this.displayValue();

    if (this.is12HourControl() && this.context().meridiem) {
      return `${accessibleValue} ${this.context().meridiem}`;
    }

    return `${accessibleValue} ${this.configuration().valueTextSuffix}`;
  });

  /** The name of the CSS animation to apply. */
  protected readonly animationName = computed(() => {
    const state = this.animationState();

    return state ? `${state.direction}-${state.phase}` : null;
  });

  /** Whether the value is changing rapidly (e.g., via press-and-hold). */
  protected readonly isRapidChange = computed(() => this.animationState()?.rapid ?? false);

  private readonly animationState = signal<TimeUnitControlAnimationState | null>(null);

  private animationPhase: TimeUnitControlAnimationPhase = 'b';
  private lastButtonChangeTimestamp: number | null = null;

  /**
   * Handles a value change triggered by a button interaction.
   * @param difference The amount to shift the value by.
   * @param direction The direction of the animation.
   */
  protected onTrigger(difference: number, direction: TimeUnitControlAnimationDirection): void {
    this.changeBy(difference, direction, true);
  }

  /**
   * Handles direct input into the control.
   * @param event The input event.
   */
  protected onInput(event: Event): void {
    const inputElement = event.target;

    if (!(inputElement instanceof HTMLInputElement)) {
      return;
    }

    let value = inputElement.value.replace(/\D/gu, '');

    if (value.length > 2) {
      value = value.slice(-2);
    }

    inputElement.value = value;

    if (value.length > 0) {
      this.commit(value);
    }
  }

  /**
   * Handles keyboard navigation and value changes.
   * @param event The keyboard event.
   */
  protected onKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        this.changeBy(1, 'increment');
        break;

      case 'ArrowDown':
        event.preventDefault();
        this.changeBy(-1, 'decrement');
        break;

      case 'PageUp':
        event.preventDefault();
        this.changeBy(10, 'increment');
        break;

      case 'PageDown':
        event.preventDefault();
        this.changeBy(-10, 'decrement');
        break;

      case 'Home':
        event.preventDefault();
        this.emitAnimatedValue(this.toEmittedValue(this.configuration().minimum), 'decrement');
        break;

      case 'End':
        event.preventDefault();
        this.emitAnimatedValue(this.toEmittedValue(this.configuration().maximum), 'increment');
        break;
    }
  }

  /**
   * Validates and emits a new value.
   * @param rawValue The raw string or numeric value to commit.
   */
  protected commit(rawValue: string | number): void {
    const value = Number(rawValue);

    if (Number.isNaN(value) || !Number.isInteger(value)) {
      return;
    }

    const clampedValue = Math.min(
      Math.max(value, this.configuration().minimum),
      this.configuration().maximum,
    );

    this.valueChange.emit(this.toEmittedValue(clampedValue));
  }

  /**
   * Formats the numeric value as a string (padded to 2 digits).
   * @param value The value to format.
   * @returns The formatted string.
   */
  protected formatValue(value: number): string {
    return String(value).padStart(2, '0');
  }

  /**
   * Generates a test identifier for a specific part of the component.
   * @param part The name of the part.
   * @returns The generated test identifier.
   */
  protected testIdFor(part: string): string {
    return this.idService.testIdFor(`${this.unit()}-${part}`, this.testIdPrefix());
  }

  private changeBy(
    difference: number,
    direction: TimeUnitControlAnimationDirection,
    isButtonInteraction = false,
  ): void {
    const currentValue = this.value();
    const nextValue = this.normalizeSteppedValue(currentValue + difference);

    if (nextValue !== currentValue) {
      this.startCssAnimation(direction, isButtonInteraction);
    }

    this.offsetChange.emit(difference);
  }

  private emitAnimatedValue(
    value: number,
    direction: TimeUnitControlAnimationDirection,
    isButtonInteraction = false,
    currentValue = this.value(),
  ): void {
    if (value !== currentValue) {
      this.startCssAnimation(direction, isButtonInteraction);
    }

    this.valueChange.emit(value);
  }

  private startCssAnimation(
    direction: TimeUnitControlAnimationDirection,
    isButtonInteraction: boolean,
  ): void {
    const currentTimestamp = Date.now();
    // Repeated button emissions arrive after the directive's initial hold
    // delay. Mark those updates as rapid so CSS can use the shorter animation.
    const rapid =
      isButtonInteraction &&
      this.lastButtonChangeTimestamp !== null &&
      currentTimestamp - this.lastButtonChangeTimestamp <= RAPID_CHANGE_THRESHOLD_MS;

    this.lastButtonChangeTimestamp = isButtonInteraction ? currentTimestamp : null;

    this.animationPhase = this.animationPhase === 'a' ? 'b' : 'a';
    this.animationState.set({
      direction,
      phase: this.animationPhase,
      rapid,
    });
  }

  private is12HourControl(): boolean {
    return this.unit() === 'hour' && this.context().hourCycle === 'h12';
  }

  private toEmittedValue(displayValue: number): number {
    if (!this.is12HourControl()) {
      return displayValue;
    }

    return to24Hour(displayValue, this.context().meridiem ?? 'AM');
  }

  private normalizeSteppedValue(value: number): number {
    if (this.is12HourControl()) {
      return normalizeToRange(value, 0, 23);
    }

    const { minimum, maximum } = this.configuration();

    return normalizeToRange(value, minimum, maximum);
  }
}

function to12Hour(hour: number): number {
  return normalizeToRange(hour, 0, 23) % 12 || 12;
}

function to24Hour(hour: number, meridiem: TimeUnitControlMeridiem): number {
  const normalizedHour = hour % 12;

  return meridiem === 'PM' ? normalizedHour + 12 : normalizedHour;
}

function normalizeToRange(value: number, minimum: number, maximum: number): number {
  const range = maximum - minimum + 1;

  return ((((value - minimum) % range) + range) % range) + minimum;
}
