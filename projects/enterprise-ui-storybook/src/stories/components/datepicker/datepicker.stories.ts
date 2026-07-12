import type { Meta, StoryObj } from '@storybook/angular';
import { MrDatepickerComponent } from '../../../../../enterprise-ui/src/lib/components/datepicker/mr-datepicker.component';

const meta: Meta<MrDatepickerComponent> = {
  title: 'Components/Datepicker',
  component: MrDatepickerComponent,
};

export default meta;
type Story = StoryObj<MrDatepickerComponent>;

export const Default: Story = {
  args: {},
};
