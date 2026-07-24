import { Component, Input } from '@angular/core';
import { type Meta, type StoryObj } from '@storybook/angular';
// @ts-ignore
import { DatepickerComponent } from '../../../../../../enterprise-ui/src/lib/components/datepicker/datepicker.component';
// @ts-ignore
import template from './date-time.stories.html?raw';
import { MatIconModule } from '@angular/material/icon';
// @ts-ignore
import {
  COMMON_LUXON_DATE_FORMATS,
  DEFAULT_DATETIME_FORMAT,
} from '../../../../../../enterprise-ui/src/lib/components/datepicker/datepicker-formats';

@Component({
  selector: 'date-time-story-host',
  standalone: true,
  imports: [DatepickerComponent, MatIconModule],
  styleUrl: './date-time.scss',
  template,
})
class DateTimeStoryHostComponent {
  @Input() label: string = 'Datum auswählen';
  @Input() disabled: boolean = false;
  @Input() locale: string = 'de-DE';
  @Input() luxonDateFormat: string = DEFAULT_DATETIME_FORMAT;
  @Input() showQuickTimeControls: boolean = false;
  @Input() value: any = null;
}

const meta = {
  title: 'Components/Datepicker',
  component: DateTimeStoryHostComponent,
  argTypes: {
    label: {
      control: 'text',
      description: 'The label for the datepicker input',
      table: {
        defaultValue: {
          summary: 'Datum auswählen',
        },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the datepicker is disabled',
      table: {
        defaultValue: {
          summary: 'false',
        },
      },
    },
    luxonDateFormat: {
      control: {
        type: 'select',
      },
      options: COMMON_LUXON_DATE_FORMATS,
      description:
        'Luxon format used to parse and display the value. Date-only mode and second visibility are inferred from the selected format. Changing the format also updates the placeholder and currently displayed value.',
      table: {
        defaultValue: {
          summary: DEFAULT_DATETIME_FORMAT,
        },
      },
    },
    showQuickTimeControls: {
      control: 'boolean',
      description: 'Whether to show quick time adjustment buttons',
      table: {
        defaultValue: {
          summary: 'false',
        },
      },
    },
    value: {
      control: 'text',
      description: 'The date value used for two-way binding',
    },
  },
  args: {
    label: 'Datum auswählen',
    disabled: false,
    luxonDateFormat: DEFAULT_DATETIME_FORMAT,
    showQuickTimeControls: false,
    value: null,
  },
} satisfies Meta<DateTimeStoryHostComponent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const DateTime: Story = {};

export const DateInput: Story = {
  args: {
    value: '2026-07-23T20:43:00',
  },
};
