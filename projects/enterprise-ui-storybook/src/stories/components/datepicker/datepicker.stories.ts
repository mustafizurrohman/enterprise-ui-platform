import type { Meta, StoryObj } from '@storybook/angular';
import { MrDatepickerComponent } from '../../../../../enterprise-ui/src/lib/components/datepicker/mr-datepicker.component';

const meta: Meta<MrDatepickerComponent> = {
  title: 'Components/Datepicker',
  component: MrDatepickerComponent,
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
