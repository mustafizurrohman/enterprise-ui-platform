import {
  Component,
  input,
  output,
  signal,
  effect,
  untracked,
} from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import { RepeatClickDirective } from "../../directives/repeat-click.directive";
import { DatepickerHeaderContext } from "./datepicker-header.types";

@Component({
  selector: "datepicker-header",
  standalone: true,
  imports: [
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    RepeatClickDirective,
  ],
  templateUrl: "./datepicker-header.component.html",
  styleUrl: "./datepicker-header.component.scss",
})
export class DatepickerHeaderComponent {
  readonly context = input.required<DatepickerHeaderContext>();

  readonly previousMonth = output<void>();
  readonly nextMonth = output<void>();
  readonly previousYear = output<void>();
  readonly nextYear = output<void>();
  readonly monthSelected = output<number>();
  readonly yearSelected = output<number>();

  protected readonly isMonthSelectFocused = signal(false);
  protected readonly yearControl = new FormControl<string>("", {
    nonNullable: true,
  });

  constructor() {
    effect(() => {
      const context = this.context();
      untracked(() => {
        const yearStr = context.viewYear.toString();
        if (this.yearControl.value !== yearStr) {
          this.yearControl.setValue(yearStr, { emitEvent: false });
        }
      });
    });
  }

  protected onMonthChange(event: Event): void {
    const month = Number.parseInt(
      (event.target as HTMLSelectElement).value,
      10,
    );

    if (Number.isInteger(month) && month >= 1 && month <= 12) {
      this.monthSelected.emit(month);
    }

    this.isMonthSelectFocused.set(false);
  }

  protected onYearInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitizedValue = input.value.replace(/\D/g, "").slice(0, 4);

    if (input.value !== sanitizedValue) {
      input.value = sanitizedValue;
    }

    if (this.yearControl.value !== sanitizedValue) {
      this.yearControl.setValue(sanitizedValue, { emitEvent: false });
    }
  }

  protected onYearEnter(event: Event): void {
    (event.target as HTMLInputElement).blur();
  }

  protected onYearBlur(): void {
    const value = this.yearControl.value;

    if (/^\d{4}$/.test(value) && Number(value) > 0) {
      this.yearSelected.emit(Number(value));
      return;
    }

    this.restoreCurrentYear();
  }

  protected idFor(part: string): string {
    return `${this.context().dialogId}-${part}`;
  }

  protected testIdFor(part: string): string {
    return `${this.context().testIdPrefix}-${part}`;
  }

  private restoreCurrentYear(): void {
    this.yearControl.setValue(this.context().viewYear.toString(), {
      emitEvent: false,
    });
  }
}
