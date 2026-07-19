import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DatepickerComponent } from '../../../../../../enterprise-ui/src/lib/components/datepicker/datepicker.component';

@Component({
  selector: 'reactive-form-wrapper',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatepickerComponent],
  templateUrl: './reactive-form.component.html',
})
export class ReactiveFormWrapperComponent implements OnInit, OnChanges {
  @Input() label = '';
  @Input() disabled = false;
  @Input() showQuickTimeControls = false;

  form = new FormGroup({
    date: new FormControl({ value: null, disabled: this.disabled }),
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['disabled']) {
      if (this.disabled) {
        this.form.get('date')?.disable();
      } else {
        this.form.get('date')?.enable();
      }
    }
  }

  ngOnInit(): void {
    this.form.get('date')?.valueChanges.subscribe((value) => {
      console.log('Datepicker value updated:', value);
    });
  }
}
