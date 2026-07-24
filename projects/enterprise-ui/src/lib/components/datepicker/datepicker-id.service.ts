import { computed, Injectable, signal } from "@angular/core";

@Injectable()
export class DatepickerIdService {
  private static nextId = 0;

  private readonly _componentId = signal(
    `datepicker-${DatepickerIdService.nextId++}`,
  );
  private readonly _testId = signal<string | null>(null);

  readonly componentId = this._componentId.asReadonly();

  readonly testIdPrefix = computed(
    () => this._testId()?.trim() || this._componentId(),
  );

  readonly ids = computed(() => {
    const root = this._componentId();
    return {
      root,
      inputWrapper: `${root}-input-wrapper`,
      input: `${root}-input`,
      inputHint: `${root}-hint`,
      inputError: `${root}-error`,
      inputStatus: `${root}-status`,
      clearButton: `${root}-clear`,
      nowButton: `${root}-now`,
      toggleButton: `${root}-toggle`,
      dialog: `${root}-dialog`,
      dialogTitle: `${root}-dialog-title`,
      dialogDescription: `${root}-dialog-description`,
      monthHeading: `${root}-month-heading`,
      hourSelect: `${root}-hour`,
      minuteSelect: `${root}-minute`,
      secondSelect: `${root}-second`,
      hourLabel: `${root}-hour-label`,
      minuteLabel: `${root}-minute-label`,
      secondLabel: `${root}-second-label`,
      meridiemGroup: `${root}-meridiem`,
      meridiemLabel: `${root}-meridiem-label`,
      meridiemAm: `${root}-meridiem-am`,
      meridiemPm: `${root}-meridiem-pm`,
    } as const;
  });

  /**
   * Sets the component ID. Useful for testing or when a specific ID is required.
   * @param id The component ID.
   */
  setComponentId(id: string): void {
    this._componentId.set(id);
  }

  /**
   * Sets the test ID prefix.
   * @param value The test ID prefix.
   */
  setTestId(value: string | null): void {
    this._testId.set(value);
  }

  /**
   * Returns a test ID for a specific part of the datepicker, optionally using a different base prefix.
   * @param part Optional part name.
   * @param basePrefix Optional base prefix. Defaults to testIdPrefix.
   * @returns The computed test ID.
   */
  testIdFor(part?: string, basePrefix?: string): string {
    const prefix = basePrefix ?? this.testIdPrefix();
    return part ? `${prefix}-${part}` : prefix;
  }

  /**
   * Returns a unique ID for a specific part, optionally using a different base ID.
   * @param part Part name.
   * @param baseId Optional base ID. Defaults to componentId.
   * @returns The computed ID.
   */
  idFor(part: string, baseId?: string): string {
    return `${baseId ?? this._componentId()}-${part}`;
  }
}
