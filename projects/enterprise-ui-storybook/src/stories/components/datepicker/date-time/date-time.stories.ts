import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import {
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { DatepickerComponent } from '../../../../../../enterprise-ui/src/lib/components/datepicker/datepicker.component';

const DEFAULT_DATETIME_FORMAT = "dd.MM.yyyy HH:mm 'Uhr'";

const COMMON_DATETIME_FORMATS = [
  DEFAULT_DATETIME_FORMAT,
  "dd.MM.yyyy HH:mm:ss 'Uhr'",
  'dd.MM.yyyy HH:mm',
  'dd.MM.yyyy HH:mm:ss',
  'yyyy-MM-dd HH:mm',
  'yyyy-MM-dd HH:mm:ss',
  'dd/MM/yyyy HH:mm',
  'dd-MM-yyyy HH:mm',
  'MM/dd/yyyy hh:mm a',
  'MM/dd/yyyy hh:mm:ss a',
] as const;

const meta = {
  title: 'Components/Datepicker',
  component: DatepickerComponent,
  decorators: [
    moduleMetadata({
      imports: [
        CommonModule,
        ReactiveFormsModule,
        DatepickerComponent,
      ],
    }),
  ],
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
    dateOnly: {
      control: 'boolean',
      description: 'Whether to show only the date or also the time',
      table: {
        defaultValue: {
          summary: 'false',
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
    showSeconds: {
      control: 'boolean',
      description: 'Whether to show seconds in the time picker',
      table: {
        defaultValue: {
          summary: 'false',
        },
      },
    },
    locale: {
      control: 'text',
      description: 'Locale used by Luxon for parsing and formatting',
      table: {
        defaultValue: {
          summary: 'de-DE',
        },
      },
    },
    luxonDateFormat: {
      control: {
        type: 'select',
      },
      options: COMMON_DATETIME_FORMATS,
      description:
        'Luxon format used to parse and display the value. Changing it also updates the placeholder and currently displayed value.',
      table: {
        defaultValue: {
          summary: DEFAULT_DATETIME_FORMAT,
        },
      },
    },
  },
  args: {
    label: 'Datum auswählen',
    dateOnly: false,
    disabled: false,
    showSeconds: false,
    locale: 'de-DE',
    luxonDateFormat: DEFAULT_DATETIME_FORMAT,
  },
} satisfies Meta<DatepickerComponent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const DateTime: Story = {
  render: (args) => ({
    props: args,
    template: `
      <datepicker
        [label]="label"
        [dateOnly]="dateOnly"
        [disabled]="disabled"
        [showSeconds]="showSeconds"
        [locale]="locale"
        [luxonDateFormat]="luxonDateFormat"
      />
    `,
  }),
};
