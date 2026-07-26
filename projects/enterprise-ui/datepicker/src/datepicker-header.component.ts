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
export class DatepickerHeaderComponent {
  private readonly idService = inject(DatepickerIdService);

  readonly context = input.required<DatepickerHeaderContext>();

  readonly previousMonth = output<void>();
  readonly nextMonth = output<void>();
  readonly previousYear = output<void>();
  readonly nextYear = output<void>();
  readonly monthSelected = output<number>();
  readonly yearSelected = output<number>();

  protected readonly isMonthSelectFocused = signal(false);
  protected readonly yearControl = new FormControl('', { nonNullable: true });

  constructor() {
    effect(() => this.synchronizeYearControl(this.context().viewYear));
  }

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

  protected onYearEnter(event: Event): void {
    const inputElement = event.target;

    if (inputElement instanceof HTMLInputElement) {
      inputElement.blur();
    }
  }

  protected onYearBlur(): void {
    const year = this.yearControl.value;

    if (FOUR_DIGIT_YEAR_PATTERN.test(year) && Number(year) > 0) {
      this.yearSelected.emit(Number(year));
      return;
    }

    this.restoreCurrentYear();
  }

  protected idFor(part: string): string {
    return this.idService.idFor(part, this.context().dialogId);
  }

  protected testIdFor(part: string): string {
    return this.idService.testIdFor(part, this.context().testIdPrefix);
  }

  private synchronizeYearControl(year: number): void {
    const yearValue = year.toString();

    if (this.yearControl.value === yearValue) {
      return;
    }

    // The control mirrors calendar navigation; emitting would incorrectly
    // treat a programmatic month/year change as user input.
    this.yearControl.setValue(yearValue, { emitEvent: false });
  }

  private restoreCurrentYear(): void {
    this.synchronizeYearControl(this.context().viewYear);
  }
}
