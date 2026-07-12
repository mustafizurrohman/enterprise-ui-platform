import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MrDatepickerComponent } from '../../../../../enterprise-ui/src/lib/components/datepicker/mr-datepicker.component';
import { CommonModule } from '@angular/common';

const meta: Meta<MrDatepickerComponent> = {
  title: 'Components/Datepicker',
  component: MrDatepickerComponent,
  decorators: [
    moduleMetadata({
      imports: [ReactiveFormsModule, CommonModule],
    }),
  ],
  argTypes: {
    label: {
      control: 'text',
      description: 'The label for the datepicker input',
    },
    dateOnly: {
      control: 'boolean',
      description: 'Whether to show only the date or also the time',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the datepicker is disabled',
    },
    showSeconds: {
      control: 'boolean',
      description: 'Whether to show seconds in the time picker',
    }
  },
};

export default meta;
type Story = StoryObj<MrDatepickerComponent>;

export const DateTime: Story = {
  args: {
    label: 'Datum auswählen',
    dateOnly: false,
    disabled: false,
    showSeconds: false,
  },
};

export const DateOnly: Story = {
  args: {
    dateOnly: true,
    disabled: false,
  },
};

export const ReactiveForm: Story = {
  render: (args) => {
    const form = new FormGroup({
      date: new FormControl(null),
    });

    form.get('date')?.valueChanges.subscribe((value) => {
      console.log('Datepicker value updated:', value);
    });

    return {
      props: {
        ...args,
        form,
      },
      template: `
        <form [formGroup]="form">
          <mr-datepicker
            formControlName="date"
            [label]="label"
            [dateOnly]="dateOnly"
            [disabled]="disabled"
            [showSeconds]="showSeconds"
          ></mr-datepicker>
        </form>
        <div style="margin-top: 20px;">
            <p>Current Form Value: {{ form.get('date')?.value || 'null' }}</p>
        </div>
      `,
    };
  },
  args: {
    label: 'Datepicker in Reactive Form',
    dateOnly: false,
    disabled: false,
    showSeconds: false,
  },
};
