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
    placeholder: {
      control: 'text',
      description: 'The placeholder for the datepicker input',
    },
    dateOnly: {
      control: 'boolean',
      description: 'Whether to show only the date or also the time',
    },
  },
};

export default meta;
type Story = StoryObj<MrDatepickerComponent>;

export const Default: Story = {
  args: {
    label: 'Datum auswählen',
    placeholder: 'Select date',
    dateOnly: false,
  },
};

export const DateOnly: Story = {
  args: {
    dateOnly: true,
  },
};
