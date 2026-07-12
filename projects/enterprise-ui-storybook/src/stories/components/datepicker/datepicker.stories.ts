import type { Meta, StoryObj } from '@storybook/angular';
import { Datepicker } from '../../../../../enterprise-ui/src/lib/components/datepicker/datepicker';

const meta: Meta<Datepicker> = {
  title: 'Components/Datepicker',
  component: Datepicker,
};

export default meta;
type Story = StoryObj<Datepicker>;

export const Default: Story = {
  args: {},
};
