import { computed, Injectable, signal } from '@angular/core';

/**
 * Service that manages unique IDs and test IDs for the datepicker component and its sub-components.
 * It ensures that all interactive elements have stable, unique IDs for accessibility and automated testing.
 */
@Injectable()
export class DatepickerIdService {
  /** Internal counter for generating unique component IDs. */
  private static nextId = 0;

  /** Signal holding the base unique ID for the component instance. */
  private readonly componentIdSignal = signal(`datepicker-${DatepickerIdService.nextId++}`);
  /** Signal holding the configured test ID, which takes precedence over the component ID. */
  private readonly testIdSignal = signal<string | null>(null);

  /** Readonly access to the base component ID. */
  readonly componentId = this.componentIdSignal.asReadonly();

  /** The prefix used for all test IDs, defaulting to the component ID if no test ID is provided. */
  readonly testIdPrefix = computed(() => this.testIdSignal()?.trim() || this.componentIdSignal());

  /**
   * A computed object containing pre-generated IDs for all common sub-elements
   * of the datepicker, ensuring consistent naming across the component.
   */
  readonly ids = computed(() => {
    const root = this.componentIdSignal();
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
      dialogStatus: `${root}-dialog-status`,
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
   *
   * @param id The new component ID to use as a base.
   */
  setComponentId(id: string): void {
    this.componentIdSignal.set(id);
  }

  /**
   * Sets the test ID prefix.
   *
   * @param value The test ID prefix, or null to revert to the default component ID.
   */
  setTestId(value: string | null): void {
    this.testIdSignal.set(value);
  }

  /**
   * Returns a test ID for a specific part of the datepicker, optionally using a different base prefix.
   *
   * @param part Optional part name to append to the prefix.
   * @param basePrefix Optional base prefix. Defaults to testIdPrefix.
   * @returns The computed test ID string.
   */
  testIdFor(part?: string, basePrefix?: string): string {
    const prefix = basePrefix ?? this.testIdPrefix();
    return part ? `${prefix}-${part}` : prefix;
  }

  /**
   * Returns a unique ID for a specific part, optionally using a different base ID.
   *
   * @param part Part name to append to the base ID.
   * @param baseId Optional base ID. Defaults to componentId.
   * @returns The computed unique ID string.
   */
  idFor(part: string, baseId?: string): string {
    return `${baseId ?? this.componentIdSignal()}-${part}`;
  }
}
