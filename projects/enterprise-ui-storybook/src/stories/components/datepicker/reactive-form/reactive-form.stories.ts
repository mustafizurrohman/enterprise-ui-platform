import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { ReactiveFormWrapperComponent } from './reactive-form.component';

const meta: Meta<ReactiveFormWrapperComponent> = {
  title: 'Components/Datepicker',
  component: ReactiveFormWrapperComponent,
  decorators: [
    moduleMetadata({
      imports: [ReactiveFormWrapperComponent],
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
type Story = StoryObj<ReactiveFormWrapperComponent>;

export const ReactiveForm: Story = {
  args: {
    label: 'Datepicker in Reactive Form',
    dateOnly: false,
    disabled: false,
    showSeconds: false,
  },
};
