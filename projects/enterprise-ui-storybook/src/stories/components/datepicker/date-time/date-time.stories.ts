import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { DatepickerComponent } from '../../../../../../enterprise-ui/src/lib/components/datepicker/datepicker.component';

const DEFAULT_DATETIME_FORMAT = "dd.MM.yyyy HH:mm 'Uhr'";

const COMMON_LUXON_DATE_FORMATS = [
  // Date only
  'dd.MM.yyyy',
  'yyyy-MM-dd',
  'dd/MM/yyyy',
  'dd-MM-yyyy',
  'MM/dd/yyyy',

  // Date and time without seconds
  DEFAULT_DATETIME_FORMAT,
  'dd.MM.yyyy HH:mm',
  'yyyy-MM-dd HH:mm',
  'dd/MM/yyyy HH:mm',
  'dd-MM-yyyy HH:mm',
  'MM/dd/yyyy hh:mm a',

  // Date and time with seconds
  "dd.MM.yyyy HH:mm:ss 'Uhr'",
  'dd.MM.yyyy HH:mm:ss',
  'yyyy-MM-dd HH:mm:ss',
  'MM/dd/yyyy hh:mm:ss a',
] as const;

const meta = {
  title: 'Components/Datepicker',
  component: DatepickerComponent,
  decorators: [
    moduleMetadata({
      imports: [DatepickerComponent],
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
    disabled: {
      control: 'boolean',
      description: 'Whether the datepicker is disabled',
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
      options: COMMON_LUXON_DATE_FORMATS,
      description:
        'Luxon format used to parse and display the value. Date-only mode and second visibility are inferred from the selected format. Changing the format also updates the placeholder and currently displayed value.',
      table: {
        defaultValue: {
          summary: DEFAULT_DATETIME_FORMAT,
        },
      },
    },
  },
  args: {
    label: 'Datum auswählen',
    disabled: false,
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
        [disabled]="disabled"
        [locale]="locale"
        [luxonDateFormat]="luxonDateFormat"
      />
    `,
  }),
};
