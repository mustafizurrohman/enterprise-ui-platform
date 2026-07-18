import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { DatepickerComponent } from '../../../../../../enterprise-ui/src/lib/components/datepicker/datepicker.component';
import template from './date-time.stories.html?raw';

const DEFAULT_DATETIME_FORMAT = "dd.MM.yyyy HH:mm 'Uhr'";

const COMMON_LUXON_DATE_FORMATS = [
  // German — dots, padded
  'dd.MM.yyyy',
  'dd.MM.yyyy HH:mm',
  DEFAULT_DATETIME_FORMAT,
  'dd.MM.yyyy HH:mm:ss',
  "dd.MM.yyyy HH:mm:ss 'Uhr'",

  // German — dots, unpadded
  'd.M.yyyy',
  'd.M.yyyy H:mm',
  "d.M.yyyy H:mm 'Uhr'",
  'd.M.yyyy H:mm:ss',
  "d.M.yyyy H:mm:ss 'Uhr'",

  // ISO 8601-style — hyphen and space
  'yyyy-MM-dd',
  'yyyy-MM-dd HH:mm',
  'yyyy-MM-dd HH:mm:ss',

  // ISO 8601-style — T separator
  'yyyy-MM-dd',
  "yyyy-MM-dd'T'HH:mm",
  "yyyy-MM-dd'T'HH:mm:ss",

  // Year first — slash
  'yyyy/MM/dd',
  'yyyy/MM/dd HH:mm',
  'yyyy/MM/dd HH:mm:ss',

  // European — slash, padded
  'dd/MM/yyyy',
  'dd/MM/yyyy HH:mm',
  'dd/MM/yyyy HH:mm:ss',

  // European — slash, unpadded
  'd/M/yyyy',
  'd/M/yyyy H:mm',
  'd/M/yyyy H:mm:ss',

  // European — hyphen, padded
  'dd-MM-yyyy',
  'dd-MM-yyyy HH:mm',
  'dd-MM-yyyy HH:mm:ss',

  // European — hyphen, unpadded
  'd-M-yyyy',
  'd-M-yyyy H:mm',
  'd-M-yyyy H:mm:ss',

  // US — slash, padded, 12-hour
  'MM/dd/yyyy',
  'MM/dd/yyyy hh:mm a',
  'MM/dd/yyyy hh:mm:ss a',

  // US — slash, unpadded, 12-hour
  'M/d/yyyy',
  'M/d/yyyy h:mm a',
  'M/d/yyyy h:mm:ss a',

  // US — hyphen, padded, 12-hour
  'MM-dd-yyyy',
  'MM-dd-yyyy hh:mm a',
  'MM-dd-yyyy hh:mm:ss a',

  // US — hyphen, unpadded, 12-hour
  'M-d-yyyy',
  'M-d-yyyy h:mm a',
  'M-d-yyyy h:mm:ss a',

  // Short year — German
  'dd.MM.yy',
  'dd.MM.yy HH:mm',
  'dd.MM.yy HH:mm:ss',

  // Short year — European slash
  'dd/MM/yy',
  'dd/MM/yy HH:mm',
  'dd/MM/yy HH:mm:ss',

  // Short year — European hyphen
  'dd-MM-yy',
  'dd-MM-yy HH:mm',
  'dd-MM-yy HH:mm:ss',

  // Short year — US slash
  'MM/dd/yy',
  'MM/dd/yy hh:mm a',
  'MM/dd/yy hh:mm:ss a',

  // Short year — US hyphen
  'MM-dd-yy',
  'MM-dd-yy hh:mm a',
  'MM-dd-yy hh:mm:ss a',

  // European — abbreviated month name
  'dd MMM yyyy',
  'dd MMM yyyy HH:mm',
  'dd MMM yyyy HH:mm:ss',

  // European — abbreviated month name, unpadded
  'd MMM yyyy',
  'd MMM yyyy H:mm',
  'd MMM yyyy H:mm:ss',

  // European — full month name
  'dd MMMM yyyy',
  'dd MMMM yyyy HH:mm',
  'dd MMMM yyyy HH:mm:ss',

  // European — full month name, unpadded
  'd MMMM yyyy',
  'd MMMM yyyy H:mm',
  'd MMMM yyyy H:mm:ss',

  // US — abbreviated month name
  'MMM dd, yyyy',
  'MMM dd, yyyy hh:mm a',
  'MMM dd, yyyy hh:mm:ss a',

  // US — abbreviated month name, unpadded
  'MMM d, yyyy',
  'MMM d, yyyy h:mm a',
  'MMM d, yyyy h:mm:ss a',

  // US — full month name
  'MMMM dd, yyyy',
  'MMMM dd, yyyy hh:mm a',
  'MMMM dd, yyyy hh:mm:ss a',

  // US — full month name, unpadded
  'MMMM d, yyyy',
  'MMMM d, yyyy h:mm a',
  'MMMM d, yyyy h:mm:ss a',

  // European — abbreviated weekday and month
  'ccc, dd MMM yyyy',
  'ccc, dd MMM yyyy HH:mm',
  'ccc, dd MMM yyyy HH:mm:ss',

  // European — full weekday and month
  'cccc, dd MMMM yyyy',
  'cccc, dd MMMM yyyy HH:mm',
  'cccc, dd MMMM yyyy HH:mm:ss',

  // US — abbreviated weekday and month
  'ccc, MMM dd, yyyy',
  'ccc, MMM dd, yyyy hh:mm a',
  'ccc, MMM dd, yyyy hh:mm:ss a',

  // US — full weekday and month
  'cccc, MMMM dd, yyyy',
  'cccc, MMMM dd, yyyy hh:mm a',
  'cccc, MMMM dd, yyyy hh:mm:ss a',
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
    value: {
      control: 'text',
      description: 'The current value of the datepicker',
    },
  },
  args: {
    label: 'Datum auswählen',
    disabled: false,
    locale: 'de-DE',
    luxonDateFormat: DEFAULT_DATETIME_FORMAT,
    value: null,
  },
} satisfies Meta<DatepickerComponent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const DateTime: Story = {
  render: (args) => ({
    props: args,
    template,
  }),
};
