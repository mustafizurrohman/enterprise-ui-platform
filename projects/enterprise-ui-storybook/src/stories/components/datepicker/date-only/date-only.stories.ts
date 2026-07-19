import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { DatepickerComponent } from '../../../../../../enterprise-ui/src/lib/components/datepicker/datepicker.component';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

const meta: Meta<DatepickerComponent> = {
  title: 'Components/Datepicker',
  component: DatepickerComponent,
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
    },
    showQuickTimeControls: {
      control: 'boolean',
      description: 'Whether to show quick time adjustment buttons',
    }
  },
};

export default meta;
type Story = StoryObj<DatepickerComponent>;

export const DateOnly: Story = {
  args: {
    dateOnly: true,
    disabled: false,
  },
};
