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
    disabled: {
      control: 'boolean',
      description: 'Whether the datepicker is disabled',
    },
    showQuickTimeControls: {
      control: 'boolean',
      description: 'Whether to show quick time adjustment buttons',
    }
  },
};

export default meta;
type Story = StoryObj<ReactiveFormWrapperComponent>;

export const ReactiveForm: Story = {
  args: {
    label: 'Datepicker in Reactive Form',
    disabled: false,
  },
};
