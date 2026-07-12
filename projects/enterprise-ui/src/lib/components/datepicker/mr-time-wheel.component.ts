import { Component, computed, input, output } from "@angular/core";

export type TimeUnit = "hour" | "minute" | "second";

type TimeUnitConfiguration = {
  label: string;
  singularLabel: string;
  valueTextSuffix: string;
  maximum: number;
};

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
  selector: "mr-time-wheel",
  standalone: true,
  templateUrl: "./mr-time-wheel.component.html",
  styleUrl: "./mr-time-wheel.component.scss",
})
export class MrTimeWheelComponent {
  readonly unit = input.required<TimeUnit>();
  readonly value = input.required<number>();
  readonly controlId = input.required<string>();
  readonly labelId = input.required<string>();
  readonly testIdPrefix = input.required<string>();

  readonly valueChange = output<number>();

  protected readonly configuration = computed(
    () => TIME_UNIT_CONFIGURATION[this.unit()],
  );

  protected readonly previousValue = computed(() =>
    this.formatValue(this.normalize(this.value() - 1)),
  );

  protected readonly nextValue = computed(() =>
    this.formatValue(this.normalize(this.value() + 1)),
  );

  protected increment(): void {
    this.changeBy(1);
  }

  protected decrement(): void {
    this.changeBy(-1);
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
        this.changeBy(10);
        break;

      case "PageDown":
        event.preventDefault();
        this.changeBy(-10);
        break;

      case "Home":
        event.preventDefault();
        this.valueChange.emit(0);
        break;

      case "End":
        event.preventDefault();
        this.valueChange.emit(this.configuration().maximum);
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

  private changeBy(difference: number): void {
    this.valueChange.emit(this.normalize(this.value() + difference));
  }

  private normalize(value: number): number {
    const range = this.configuration().maximum + 1;

    return ((value % range) + range) % range;
  }
}
