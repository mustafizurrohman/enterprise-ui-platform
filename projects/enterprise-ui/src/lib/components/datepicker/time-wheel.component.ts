import {
  Component,
  OnDestroy,
  computed,
  input,
  output,
  signal,
} from "@angular/core";
import { MatIconModule } from "@angular/material/icon";

export type TimeUnit = "hour" | "minute" | "second";
export type TimeWheelHourCycle = "h12" | "h23";
export type TimeWheelMeridiem = "AM" | "PM";

export type TimeWheelContext = Readonly<{
  unit: TimeUnit;
  value: number;
  controlId: string;
  labelId: string;
  descriptionId?: string;
  testIdPrefix: string;
  hourCycle?: TimeWheelHourCycle;
  meridiem?: TimeWheelMeridiem;
}>;

type TimeUnitConfiguration = {
  label: string;
  singularLabel: string;
  valueTextSuffix: string;
  minimum: number;
  maximum: number;
};

type TimeWheelAnimationDirection = "increment" | "decrement";
type TimeWheelAnimationPhase = "a" | "b";

type TimeWheelAnimationState = Readonly<{
  direction: TimeWheelAnimationDirection;
  phase: TimeWheelAnimationPhase;
  rapid: boolean;
}>;


const PRESS_HOLD_INITIAL_DELAY_MS = 300;
const RAPID_CHANGE_THRESHOLD_MS = PRESS_HOLD_INITIAL_DELAY_MS * 1.1;
const PRESS_HOLD_MINIMUM_DELAY_MS = PRESS_HOLD_INITIAL_DELAY_MS * 0.8;
const PRESS_HOLD_ACCELERATION_STEP_MS = PRESS_HOLD_INITIAL_DELAY_MS * 0.02;

const TIME_UNIT_CONFIGURATION: Record<TimeUnit, TimeUnitConfiguration> = {
  hour: {
    label: "Std",
    singularLabel: "Std",
    valueTextSuffix: "Uhr",
    minimum: 0,
    maximum: 23,
  },
  minute: {
    label: "Min",
    singularLabel: "Min",
    valueTextSuffix: "Minuten",
    minimum: 0,
    maximum: 59,
  },
  second: {
    label: "Sek",
    singularLabel: "Sek",
    valueTextSuffix: "Sekunden",
    minimum: 0,
    maximum: 59,
  },
};

@Component({
  selector: "time-wheel",
  standalone: true,
  imports: [MatIconModule],
  templateUrl: "./time-wheel.component.html",
  styleUrl: "./time-wheel.component.scss",
})
export class TimeWheelComponent implements OnDestroy {
  readonly context = input.required<TimeWheelContext>();

  readonly valueChange = output<number>();

  protected readonly unit = computed(() => this.context().unit);
  protected readonly value = computed(() => this.context().value);
  protected readonly displayValue = computed(() =>
    this.is12HourWheel() ? to12Hour(this.value()) : this.value(),
  );
  protected readonly controlId = computed(() => this.context().controlId);
  protected readonly labelId = computed(() => this.context().labelId);
  protected readonly descriptionId = computed(
    () => this.context().descriptionId ?? null,
  );
  protected readonly testIdPrefix = computed(() => this.context().testIdPrefix);
  protected readonly wheelId = computed(() => `${this.controlId()}-wheel`);
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

    if (this.is12HourWheel() && this.context().meridiem) {
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

  private readonly animationState = signal<TimeWheelAnimationState | null>(
    null,
  );

  private animationPhase: TimeWheelAnimationPhase = "b";
  private lastButtonChangeTimestamp: number | null = null;
  private pressHoldTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private clickSuppressionTimeoutId: ReturnType<typeof setTimeout> | null =
    null;
  private pressHoldValue: number | null = null;
  private pressHoldDifference = 0;
  private pressHoldDirection: TimeWheelAnimationDirection | null = null;
  private pressHoldDelayMs = PRESS_HOLD_INITIAL_DELAY_MS;
  private pressHoldActive = false;
  private suppressNextClick = false;

  ngOnDestroy(): void {
    this.resetPressHoldState();
    this.suppressNextClick = false;
    this.clearClickSuppressionTimeout();
  }

  protected onButtonClick(
    difference: number,
    direction: TimeWheelAnimationDirection,
  ): void {
    if (this.suppressNextClick) {
      this.suppressNextClick = false;
      this.clearClickSuppressionTimeout();
      return;
    }

    this.changeBy(difference, direction, true);
  }

  protected startPressAndHold(
    event: PointerEvent,
    difference: number,
    direction: TimeWheelAnimationDirection,
  ): void {
    if (event.button !== 0 || !event.isPrimary) {
      return;
    }

    this.resetPressHoldState();
    this.clearClickSuppressionTimeout();
    this.suppressNextClick = true;
    this.pressHoldValue = this.value();
    this.pressHoldDifference = difference;
    this.pressHoldDirection = direction;
    this.pressHoldActive = true;

    this.performPressHoldStep();

    if (this.pressHoldActive) {
      this.schedulePressHoldStep();
    }

    const button = event.currentTarget;

    if (
      button instanceof HTMLElement &&
      typeof button.setPointerCapture === "function" &&
      Number.isInteger(event.pointerId)
    ) {
      try {
        button.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture is optional; pointerup/pointerleave still stop repeat.
      }
    }
  }

  protected stopPressAndHold(): void {
    this.resetPressHoldState();

    if (this.suppressNextClick) {
      this.scheduleClickSuppressionReset();
    }
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
    direction: TimeWheelAnimationDirection,
    isButtonInteraction = false,
  ): void {
    this.emitAnimatedValue(
      this.normalizeSteppedValue(this.value() + difference),
      direction,
      isButtonInteraction,
    );
  }

  private performPressHoldStep(): void {
    if (
      this.pressHoldValue === null ||
      this.pressHoldDirection === null ||
      this.pressHoldDifference === 0
    ) {
      return;
    }

    const currentValue = this.pressHoldValue;
    const nextValue = this.normalizeSteppedValue(
      currentValue + this.pressHoldDifference,
    );

    this.pressHoldValue = nextValue;
    this.emitAnimatedValue(
      nextValue,
      this.pressHoldDirection,
      true,
      currentValue,
    );
  }

  private schedulePressHoldStep(): void {
    const delay = this.pressHoldDelayMs;

    this.pressHoldTimeoutId = setTimeout(() => {
      this.pressHoldTimeoutId = null;

      if (!this.pressHoldActive) {
        return;
      }

      this.performPressHoldStep();

      if (!this.pressHoldActive) {
        return;
      }

      this.pressHoldDelayMs = Math.max(
        PRESS_HOLD_MINIMUM_DELAY_MS,
        this.pressHoldDelayMs - PRESS_HOLD_ACCELERATION_STEP_MS,
      );
      this.schedulePressHoldStep();
    }, delay);
  }

  private resetPressHoldState(): void {
    this.clearPressHoldTimeout();
    this.pressHoldValue = null;
    this.pressHoldDifference = 0;
    this.pressHoldDirection = null;
    this.pressHoldDelayMs = PRESS_HOLD_INITIAL_DELAY_MS;
    this.pressHoldActive = false;
  }

  private clearPressHoldTimeout(): void {
    if (this.pressHoldTimeoutId === null) {
      return;
    }

    clearTimeout(this.pressHoldTimeoutId);
    this.pressHoldTimeoutId = null;
  }

  private scheduleClickSuppressionReset(): void {
    this.clearClickSuppressionTimeout();
    this.clickSuppressionTimeoutId = setTimeout(() => {
      this.suppressNextClick = false;
      this.clickSuppressionTimeoutId = null;
    }, 0);
  }

  private clearClickSuppressionTimeout(): void {
    if (this.clickSuppressionTimeoutId === null) {
      return;
    }

    clearTimeout(this.clickSuppressionTimeoutId);
    this.clickSuppressionTimeoutId = null;
  }

  private emitAnimatedValue(
    value: number,
    direction: TimeWheelAnimationDirection,
    isButtonInteraction = false,
    currentValue = this.value(),
  ): void {
    if (value !== currentValue) {
      this.startCssAnimation(direction, isButtonInteraction);
    }

    this.valueChange.emit(value);
  }

  private startCssAnimation(
    direction: TimeWheelAnimationDirection,
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

  private is12HourWheel(): boolean {
    return this.unit() === "hour" && this.context().hourCycle === "h12";
  }

  private toEmittedValue(displayValue: number): number {
    if (!this.is12HourWheel()) {
      return displayValue;
    }

    return to24Hour(displayValue, this.context().meridiem ?? "AM");
  }

  private normalizeSteppedValue(value: number): number {
    if (this.is12HourWheel()) {
      return normalizeToRange(value, 0, 23);
    }

    const { minimum, maximum } = this.configuration();

    return normalizeToRange(value, minimum, maximum);
  }
}

function to12Hour(hour: number): number {
  return normalizeToRange(hour, 0, 23) % 12 || 12;
}

function to24Hour(hour: number, meridiem: TimeWheelMeridiem): number {
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
