import {
  Component,
  computed,
  input,
  output,
  signal,
} from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { RepeatClickDirective } from "../../directives/repeat-click.directive";

import {
  type TimeUnit,
  type TimeUnitControlContext,
  type TimeUnitControlHourCycle,
  type TimeUnitControlMeridiem,
} from "./time-unit-control.types";

type TimeUnitConfiguration = {
  label: string;
  singularLabel: string;
  valueTextSuffix: string;
  minimum: number;
  maximum: number;
};

type TimeUnitControlAnimationDirection = "increment" | "decrement";
type TimeUnitControlAnimationPhase = "a" | "b";

type TimeUnitControlAnimationState = Readonly<{
  direction: TimeUnitControlAnimationDirection;
  phase: TimeUnitControlAnimationPhase;
  rapid: boolean;
}>;


const PRESS_HOLD_INITIAL_DELAY_MS = 300;
const RAPID_CHANGE_THRESHOLD_MS = PRESS_HOLD_INITIAL_DELAY_MS * 1.1;

const TIME_UNIT_CONFIGURATION: Record<TimeUnit, TimeUnitConfiguration> = {
  hour: {
    label: "Std",
    singularLabel: "Stunde",
    valueTextSuffix: "Uhr",
    minimum: 0,
    maximum: 23,
  },
  minute: {
    label: "Min",
    singularLabel: "Minute",
    valueTextSuffix: "Minuten",
    minimum: 0,
    maximum: 59,
  },
  second: {
    label: "Sek",
    singularLabel: "Sekunde",
    valueTextSuffix: "Sekunden",
    minimum: 0,
    maximum: 59,
  },
};

@Component({
  selector: "time-unit-control",
  standalone: true,
  imports: [MatIconModule, RepeatClickDirective],
  templateUrl: "./time-unit-control.component.html",
  styleUrl: "./time-unit-control.component.scss",
})
export class TimeUnitControlComponent {
  readonly context = input.required<TimeUnitControlContext>();

  readonly valueChange = output<number>();
  readonly offsetChange = output<number>();

  protected readonly unit = computed(() => this.context().unit);
  protected readonly value = computed(() => this.context().value);
  protected readonly displayValue = computed(() =>
    this.is12HourControl() ? to12Hour(this.value()) : this.value(),
  );
  protected readonly controlId = computed(() => this.context().controlId);
  protected readonly labelId = computed(() => this.context().labelId);
  protected readonly descriptionId = computed(
    () => this.context().descriptionId ?? null,
  );
  protected readonly testIdPrefix = computed(() => this.context().testIdPrefix);
  protected readonly unitId = computed(() => `${this.controlId()}-unit`);
  protected readonly valueId = computed(() => `${this.controlId()}-value`);
  protected readonly buttonStackId = computed(
    () => `${this.controlId()}-button-stack`,
  );
  protected readonly incrementButtonId = computed(
    () => `${this.controlId()}-increment`,
  );
  protected readonly decrementButtonId = computed(
    () => `${this.controlId()}-decrement`,
  );

  protected readonly configuration = computed<TimeUnitConfiguration>(() => {
    const configuration = TIME_UNIT_CONFIGURATION[this.unit()];

    if (this.unit() === "hour" && this.context().hourCycle === "h12") {
      return {
        ...configuration,
        minimum: 1,
        maximum: 12,
      };
    }

    return configuration;
  });

  protected readonly accessibleValueText = computed(() => {
    const accessibleValue = this.displayValue();

    if (this.is12HourControl() && this.context().meridiem) {
      return `${accessibleValue} ${this.context().meridiem}`;
    }

    return `${accessibleValue} ${this.configuration().valueTextSuffix}`;
  });

  protected readonly animationName = computed(() => {
    const state = this.animationState();

    return state ? `${state.direction}-${state.phase}` : null;
  });

  protected readonly isRapidChange = computed(
    () => this.animationState()?.rapid ?? false,
  );

  private readonly animationState = signal<TimeUnitControlAnimationState | null>(
    null,
  );

  private animationPhase: TimeUnitControlAnimationPhase = "b";
  private lastButtonChangeTimestamp: number | null = null;

  protected onTrigger(
    difference: number,
    direction: TimeUnitControlAnimationDirection,
  ): void {
    this.changeBy(difference, direction, true);
  }

  protected onInput(event: Event): void {
    const inputElement = event.target;

    if (!(inputElement instanceof HTMLInputElement)) {
      return;
    }

    let value = inputElement.value.replace(/[^0-9]/g, "");

    if (value.length > 2) {
      value = value.slice(-2);
    }

    inputElement.value = value;

    if (value.length > 0) {
      this.commit(value);
    }
  }

  protected onKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case "ArrowUp":
        event.preventDefault();
        this.changeBy(1, "increment");
        break;

      case "ArrowDown":
        event.preventDefault();
        this.changeBy(-1, "decrement");
        break;

      case "PageUp":
        event.preventDefault();
        this.changeBy(10, "increment");
        break;

      case "PageDown":
        event.preventDefault();
        this.changeBy(-10, "decrement");
        break;

      case "Home":
        event.preventDefault();
        this.emitAnimatedValue(
          this.toEmittedValue(this.configuration().minimum),
          "decrement",
        );
        break;

      case "End":
        event.preventDefault();
        this.emitAnimatedValue(
          this.toEmittedValue(this.configuration().maximum),
          "increment",
        );
        break;
    }
  }

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

  protected formatValue(value: number): string {
    return String(value).padStart(2, "0");
  }

  protected testIdFor(part: string): string {
    return `${this.testIdPrefix()}-${this.unit()}-${part}`;
  }

  private changeBy(
    difference: number,
    direction: TimeUnitControlAnimationDirection,
    isButtonInteraction = false,
  ): void {
    const nextValue = this.normalizeSteppedValue(this.value() + difference);
    if (nextValue !== this.value()) {
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
    const rapid =
      isButtonInteraction &&
      this.lastButtonChangeTimestamp !== null &&
      currentTimestamp - this.lastButtonChangeTimestamp <=
        RAPID_CHANGE_THRESHOLD_MS;

    this.lastButtonChangeTimestamp = isButtonInteraction
      ? currentTimestamp
      : null;

    this.animationPhase = this.animationPhase === "a" ? "b" : "a";
    this.animationState.set({
      direction,
      phase: this.animationPhase,
      rapid,
    });
  }

  private is12HourControl(): boolean {
    return this.unit() === "hour" && this.context().hourCycle === "h12";
  }

  private toEmittedValue(displayValue: number): number {
    if (!this.is12HourControl()) {
      return displayValue;
    }

    return to24Hour(displayValue, this.context().meridiem ?? "AM");
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

  return meridiem === "PM" ? normalizedHour + 12 : normalizedHour;
}

function normalizeToRange(
  value: number,
  minimum: number,
  maximum: number,
): number {
  const range = maximum - minimum + 1;

  return ((((value - minimum) % range) + range) % range) + minimum;
}
