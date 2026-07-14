import {
  Component,
  computed,
  HostListener,
  input,
  OnDestroy,
  output,
  signal,
} from "@angular/core";
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
type TimeWheelStep = 1 | -1;

type TimeWheelAnimationState = Readonly<{
  direction: TimeWheelAnimationDirection;
  phase: TimeWheelAnimationPhase;
}>;

const PRESS_REPEAT_INTERVAL_MS = 70;

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
export class TimeWheelComponent implements OnDestroy {
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

  protected readonly previousValue = computed(() =>
    this.formatValue(this.normalize(this.value() - 1)),
  );

  protected readonly nextValue = computed(() =>
    this.formatValue(this.normalize(this.value() + 1)),
  );

  protected readonly animationName = computed(() => {
    const state = this.animationState();

    return state ? `${state.direction}-${state.phase}` : null;
  });

  protected readonly pressedDirection =
    signal<TimeWheelAnimationDirection | null>(null);

  private readonly animationState = signal<TimeWheelAnimationState | null>(
    null,
  );

  private animationPhase: TimeWheelAnimationPhase = "b";
  private pressIntervalId: ReturnType<typeof setInterval> | null = null;
  private pressedValue: number | null = null;
  private activePointerId: number | null = null;

  ngOnDestroy(): void {
    this.stopPress();
  }

  protected increment(): void {
    this.changeBy(1, "increment");
  }

  protected decrement(): void {
    this.changeBy(-1, "decrement");
  }

  protected onButtonClick(
    event: MouseEvent,
    difference: TimeWheelStep,
    direction: TimeWheelAnimationDirection,
  ): void {
    // Pointer interactions are handled on pointerdown so holding the button can
    // repeat every 70 ms. A click with detail 0 is keyboard/assistive input.
    if (event.detail !== 0) {
      return;
    }

    this.changeBy(difference, direction);
  }

  protected startPress(
    event: PointerEvent,
    difference: TimeWheelStep,
    direction: TimeWheelAnimationDirection,
  ): void {
    if (event.button !== 0 || event.isPrimary === false) {
      return;
    }

    this.stopPress();

    this.activePointerId = event.pointerId;
    this.pressedValue = this.value();
    this.pressedDirection.set(direction);

    const button = event.currentTarget;

    if (button instanceof HTMLButtonElement) {
      button.setPointerCapture?.(event.pointerId);
    }

    this.emitPressedStep(difference, direction);
    this.pressIntervalId = setInterval(
      () => this.emitPressedStep(difference, direction),
      PRESS_REPEAT_INTERVAL_MS,
    );
  }

  protected stopPress(event?: PointerEvent): void {
    if (
      event &&
      this.activePointerId !== null &&
      event.pointerId !== this.activePointerId
    ) {
      return;
    }

    if (this.pressIntervalId !== null) {
      clearInterval(this.pressIntervalId);
      this.pressIntervalId = null;
    }

    this.pressedValue = null;
    this.activePointerId = null;
    this.pressedDirection.set(null);
  }

  @HostListener("window:blur")
  protected onWindowBlur(): void {
    this.stopPress();
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
        this.increment();
        break;

      case "ArrowDown":
        event.preventDefault();
        this.decrement();
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

  private emitPressedStep(
    difference: TimeWheelStep,
    direction: TimeWheelAnimationDirection,
  ): void {
    const currentValue = this.pressedValue ?? this.value();
    const nextValue = this.normalize(currentValue + difference);

    this.pressedValue = nextValue;
    this.emitAnimatedValue(nextValue, direction);
  }

  private changeBy(
    difference: number,
    direction: TimeWheelAnimationDirection,
  ): void {
    this.emitAnimatedValue(
      this.normalize(this.value() + difference),
      direction,
    );
  }

  private emitAnimatedValue(
    value: number,
    direction: TimeWheelAnimationDirection,
  ): void {
    if (value !== this.value()) {
      this.startCssAnimation(direction);
    }

    this.valueChange.emit(value);
  }

  private startCssAnimation(direction: TimeWheelAnimationDirection): void {
    this.animationPhase = this.animationPhase === "a" ? "b" : "a";
    this.animationState.set({
      direction,
      phase: this.animationPhase,
    });
  }

  private normalize(value: number): number {
    const range = this.configuration().maximum + 1;

    return ((value % range) + range) % range;
  }
}
