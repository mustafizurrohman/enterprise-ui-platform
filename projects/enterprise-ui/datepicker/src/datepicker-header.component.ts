import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { RepeatClickDirective } from '@mr/enterprise-ui/common';
import type { DatepickerHeaderContext } from './datepicker-header.types';
import { DatepickerIdService } from './datepicker-id.service';

const FOUR_DIGIT_YEAR_PATTERN = /^\d{4}$/u;

@Component({
  selector: 'datepicker-header',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    ReactiveFormsModule,
    RepeatClickDirective,
  ],
  templateUrl: './datepicker-header.component.html',
  styleUrl: './datepicker-header.component.scss',
})
/**
 * A component that displays the header of a datepicker, including month selection and year input.
 */
export class DatepickerHeaderComponent {
  private readonly idService = inject(DatepickerIdService);

  /**
   * The context for the datepicker header, containing display data and ID configurations.
   */
  readonly context = input.required<DatepickerHeaderContext>();

  /**
   * Emitted when navigation to the previous month is requested.
   */
  readonly previousMonth = output<void>();

  /**
   * Emitted when navigation to the next month is requested.
   */
  readonly nextMonth = output<void>();

  /**
   * Emitted when navigation to the previous year is requested.
   */
  readonly previousYear = output<void>();

  /**
   * Emitted when navigation to the next year is requested.
   */
  readonly nextYear = output<void>();

  /**
   * Emitted when a specific month is selected.
   */
  readonly monthSelected = output<number>();

  /**
   * Emitted when a specific year is selected.
   */
  readonly yearSelected = output<number>();

  /**
   * Whether the month selection dropdown is currently focused.
   */
  protected readonly isMonthSelectFocused = signal(false);

  /**
   * The control for the year input field.
   */
  protected readonly yearControl = new FormControl('', { nonNullable: true });

  constructor() {
    effect(() => this.synchronizeYearControl(this.context().viewYear));
  }

  /**
   * Handles changes to the month selection.
   *
   * @param event - The change event from the select element.
   */
  protected onMonthChange(event: Event): void {
    const selectElement = event.target;

    if (!(selectElement instanceof HTMLSelectElement)) {
      return;
    }

    const month = Number.parseInt(selectElement.value, 10);

    if (Number.isInteger(month) && month >= 1 && month <= 12) {
      this.monthSelected.emit(month);
    }

    this.isMonthSelectFocused.set(false);
  }

  /**
   * Handles input in the year field, sanitizing the value to only allow digits.
   *
   * @param event - The input event.
   */
  protected onYearInput(event: Event): void {
    const inputElement = event.target;

    if (!(inputElement instanceof HTMLInputElement)) {
      return;
    }

    const sanitizedValue = inputElement.value.replace(/\D/gu, '').slice(0, 4);

    if (inputElement.value !== sanitizedValue) {
      inputElement.value = sanitizedValue;
    }

    if (this.yearControl.value !== sanitizedValue) {
      this.yearControl.setValue(sanitizedValue, { emitEvent: false });
    }
  }

  /**
   * Handles the Enter key in the year input by blurring the field.
   *
   * @param event - The event object.
   */
  protected onYearEnter(event: Event): void {
    const inputElement = event.target;

    if (inputElement instanceof HTMLInputElement) {
      inputElement.blur();
    }
  }

  /**
   * Handles blur on the year input, committing the new year if valid or restoring the current one.
   */
  protected onYearBlur(): void {
    const year = this.yearControl.value;

    if (FOUR_DIGIT_YEAR_PATTERN.test(year) && Number(year) > 0) {
      this.yearSelected.emit(Number(year));
      return;
    }

    this.restoreCurrentYear();
  }

  /**
   * Generates a unique ID for a part of the header component.
   *
   * @param part - The name of the part.
   * @returns The generated ID.
   */
  protected idFor(part: string): string {
    return this.idService.idFor(part, this.context().dialogId);
  }

  /**
   * Generates a test ID for a part of the header component.
   *
   * @param part - The name of the part.
   * @returns The generated test ID.
   */
  protected testIdFor(part: string): string {
    return this.idService.testIdFor(part, this.context().testIdPrefix);
  }

  /**
   * Synchronizes the year control value with the provided year.
   *
   * @param year - The year to synchronize with.
   */
  private synchronizeYearControl(year: number): void {
    const yearValue = year.toString();

    if (this.yearControl.value === yearValue) {
      return;
    }

    // The control mirrors calendar navigation; emitting would incorrectly
    // treat a programmatic month/year change as user input.
    this.yearControl.setValue(yearValue, { emitEvent: false });
  }

  /**
   * Restores the year control to match the current view year.
   */
  private restoreCurrentYear(): void {
    this.synchronizeYearControl(this.context().viewYear);
  }
}
