import { Component, computed, input, output, signal } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";

export type TimeUnit = "hour" | "minute" | "second";

export type TimeWheelContext = Readonly<{
  unit: TimeUnit;
  value: number;
  controlId: string;
  labelId: string;
  testIdPrefix: string;
}>;

type TimeUnitConfiguration = {
  label: string;
  singularLabel: string;
  valueTextSuffix: string;
  maximum: number;
};

type TimeWheelAnimationDirection = "increment" | "decrement";
type TimeWheelAnimationPhase = "a" | "b";

type TimeWheelAnimationState = Readonly<{
  direction: TimeWheelAnimationDirection;
  phase: TimeWheelAnimationPhase;
  rapid: boolean;
}>;

const RAPID_CHANGE_THRESHOLD_MS = 180;

const TIME_UNIT_CONFIGURATION: Record<TimeUnit, TimeUnitConfiguration> = {
  hour: {
    label: "Stunden",
    singularLabel: "Stunde",
    valueTextSuffix: "Uhr",
    maximum: 23,
  },
  minute: {
    label: "Minuten",
    singularLabel: "Minute",
    valueTextSuffix: "Minuten",
    maximum: 59,
  },
  second: {
    label: "Sekunden",
    singularLabel: "Sekunde",
    valueTextSuffix: "Sekunden",
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
export class TimeWheelComponent {
  readonly context = input.required<TimeWheelContext>();

  readonly valueChange = output<number>();

  protected readonly unit = computed(() => this.context().unit);
  protected readonly value = computed(() => this.context().value);
  protected readonly controlId = computed(() => this.context().controlId);
  protected readonly labelId = computed(() => this.context().labelId);
  protected readonly testIdPrefix = computed(
    () => this.context().testIdPrefix,
  );

  protected readonly configuration = computed(
    () => TIME_UNIT_CONFIGURATION[this.unit()],
  );

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

  protected increment(): void {
    this.changeBy(1, "increment", true);
  }

  protected decrement(): void {
    this.changeBy(-1, "decrement", true);
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
        this.emitAnimatedValue(0, "decrement");
        break;

      case "End":
        event.preventDefault();
        this.emitAnimatedValue(this.configuration().maximum, "increment");
        break;
    }
  }

  protected commit(rawValue: string | number): void {
    const value = Number(rawValue);

    if (Number.isNaN(value) || !Number.isInteger(value)) {
      return;
    }

    this.valueChange.emit(
      Math.min(Math.max(value, 0), this.configuration().maximum),
    );
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
      this.normalize(this.value() + difference),
      direction,
      isButtonInteraction,
    );
  }

  private emitAnimatedValue(
    value: number,
    direction: TimeWheelAnimationDirection,
    isButtonInteraction = false,
  ): void {
    if (value !== this.value()) {
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

  private normalize(value: number): number {
    const range = this.configuration().maximum + 1;

    return ((value % range) + range) % range;
  }
}
