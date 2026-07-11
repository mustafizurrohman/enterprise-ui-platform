import type { Meta, StoryObj } from '@storybook/angular';
import { Datepicker } from './datepicker';

const meta: Meta<Datepicker> = {
  title: 'Components/Datepicker',
  component: Datepicker,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<Datepicker>;

export const Default: Story = {
  args: {},
};
