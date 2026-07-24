export const DEFAULT_DATETIME_FORMAT = "dd.MM.yyyy HH:mm 'Uhr'";
export const DEFAULT_DATE_FORMAT = 'dd.MM.yyyy';
export const DEFAULT_DATETIME_SECONDS_FORMAT = "dd.MM.yyyy HH:mm:ss 'Uhr'";

/**
 * Common Luxon date formats used for parsing and display in the Datepicker.
 * Can be used as an Enum.
 */
export const DATE_FORMATS = {
  // German — dots, padded
  GERMAN_DATE_PADDED: DEFAULT_DATE_FORMAT,
  GERMAN_DATETIME_PADDED: 'dd.MM.yyyy HH:mm',
  GERMAN_DATETIME_DEFAULT: DEFAULT_DATETIME_FORMAT,
  GERMAN_DATETIME_SECONDS_PADDED: 'dd.MM.yyyy HH:mm:ss',
  GERMAN_DATETIME_UHR_PADDED: DEFAULT_DATETIME_SECONDS_FORMAT,

  // German — dots, unpadded
  GERMAN_DATE_UNPADDED: 'd.M.yyyy',
  GERMAN_DATETIME_UNPADDED: 'd.M.yyyy H:mm',
  GERMAN_DATETIME_UHR_UNPADDED: "d.M.yyyy H:mm 'Uhr'",
  GERMAN_DATETIME_SECONDS_UNPADDED: 'd.M.yyyy H:mm:ss',
  GERMAN_DATETIME_UHR_SECONDS_UNPADDED: "d.M.yyyy H:mm:ss 'Uhr'",

  // ISO 8601-style — hyphen and space
  ISO_DATE: 'yyyy-MM-dd',
  ISO_DATETIME: 'yyyy-MM-dd HH:mm',
  ISO_DATETIME_SECONDS: 'yyyy-MM-dd HH:mm:ss',

  // ISO 8601-style — T separator
  ISO_DATETIME_T: "yyyy-MM-dd'T'HH:mm",
  ISO_DATETIME_T_SECONDS: "yyyy-MM-dd'T'HH:mm:ss",

  // Year first — slash
  YEAR_FIRST_DATE: 'yyyy/MM/dd',
  YEAR_FIRST_DATETIME: 'yyyy/MM/dd HH:mm',
  YEAR_FIRST_DATETIME_SECONDS: 'yyyy/MM/dd HH:mm:ss',

  // European — slash, padded
  EU_DATE_SLASH_PADDED: 'dd/MM/yyyy',
  EU_DATETIME_SLASH_PADDED: 'dd/MM/yyyy HH:mm',
  EU_DATETIME_SECONDS_SLASH_PADDED: 'dd/MM/yyyy HH:mm:ss',

  // European — slash, unpadded
  EU_DATE_SLASH_UNPADDED: 'd/M/yyyy',
  EU_DATETIME_SLASH_UNPADDED: 'd/M/yyyy H:mm',
  EU_DATETIME_SECONDS_SLASH_UNPADDED: 'd/M/yyyy H:mm:ss',

  // European — hyphen, padded
  EU_DATE_HYPHEN_PADDED: 'dd-MM-yyyy',
  EU_DATETIME_HYPHEN_PADDED: 'dd-MM-yyyy HH:mm',
  EU_DATETIME_SECONDS_HYPHEN_PADDED: 'dd-MM-yyyy HH:mm:ss',

  // European — hyphen, unpadded
  EU_DATE_HYPHEN_UNPADDED: 'd-M-yyyy',
  EU_DATETIME_HYPHEN_UNPADDED: 'd-M-yyyy H:mm',
  EU_DATETIME_SECONDS_HYPHEN_UNPADDED: 'd-M-yyyy H:mm:ss',

  // US — slash, padded, 12-hour
  US_DATE_SLASH_PADDED: 'MM/dd/yyyy',
  US_DATETIME_SLASH_PADDED: 'MM/dd/yyyy hh:mm a',
  US_DATETIME_SECONDS_SLASH_PADDED: 'MM/dd/yyyy hh:mm:ss a',

  // US — slash, unpadded, 12-hour
  US_DATE_SLASH_UNPADDED: 'M/d/yyyy',
  US_DATETIME_SLASH_UNPADDED: 'M/d/yyyy h:mm a',
  US_DATETIME_SECONDS_SLASH_UNPADDED: 'M/d/yyyy h:mm:ss a',

  // US — hyphen, padded, 12-hour
  US_DATE_HYPHEN_PADDED: 'MM-dd-yyyy',
  US_DATETIME_HYPHEN_PADDED: 'MM-dd-yyyy hh:mm a',
  US_DATETIME_SECONDS_HYPHEN_PADDED: 'MM-dd-yyyy hh:mm:ss a',

  // US — hyphen, unpadded, 12-hour
  US_DATE_HYPHEN_UNPADDED: 'M-d-yyyy',
  US_DATETIME_HYPHEN_UNPADDED: 'M-d-yyyy h:mm a',
  US_DATETIME_SECONDS_HYPHEN_UNPADDED: 'M-d-yyyy h:mm:ss a',

  // Short year — German
  SHORT_YEAR_GERMAN_DATE: 'dd.MM.yy',
  SHORT_YEAR_GERMAN_DATETIME: 'dd.MM.yy HH:mm',
  SHORT_YEAR_GERMAN_DATETIME_SECONDS: 'dd.MM.yy HH:mm:ss',

  // Short year — European slash
  SHORT_YEAR_EU_DATE_SLASH: 'dd/MM/yy',
  SHORT_YEAR_EU_DATETIME_SLASH: 'dd/MM/yy HH:mm',
  SHORT_YEAR_EU_DATETIME_SECONDS_SLASH: 'dd/MM/yy HH:mm:ss',

  // Short year — European hyphen
  SHORT_YEAR_EU_DATE_HYPHEN: 'dd-MM-yy',
  SHORT_YEAR_EU_DATETIME_HYPHEN: 'dd-MM-yy HH:mm',
  SHORT_YEAR_EU_DATETIME_SECONDS_HYPHEN: 'dd-MM-yy HH:mm:ss',

  // Short year — US slash
  SHORT_YEAR_US_DATE_SLASH: 'MM/dd/yy',
  SHORT_YEAR_US_DATETIME_SLASH: 'MM/dd/yy hh:mm a',
  SHORT_YEAR_US_DATETIME_SECONDS_SLASH: 'MM/dd/yy hh:mm:ss a',

  // Short year — US hyphen
  SHORT_YEAR_US_DATE_HYPHEN: 'MM-dd-yy',
  SHORT_YEAR_US_DATETIME_HYPHEN: 'MM-dd-yy hh:mm a',
  SHORT_YEAR_US_DATETIME_SECONDS_HYPHEN: 'MM-dd-yy hh:mm:ss a',

  // European — abbreviated month name
  EU_DATE_ABBR_MONTH: 'dd MMM yyyy',
  EU_DATETIME_ABBR_MONTH: 'dd MMM yyyy HH:mm',
  EU_DATETIME_SECONDS_ABBR_MONTH: 'dd MMM yyyy HH:mm:ss',

  // European — abbreviated month name, unpadded
  EU_DATE_ABBR_MONTH_UNPADDED: 'd MMM yyyy',
  EU_DATETIME_ABBR_MONTH_UNPADDED: 'd MMM yyyy H:mm',
  EU_DATETIME_SECONDS_ABBR_MONTH_UNPADDED: 'd MMM yyyy H:mm:ss',

  // European — full month name
  EU_DATE_FULL_MONTH: 'dd MMMM yyyy',
  EU_DATETIME_FULL_MONTH: 'dd MMMM yyyy HH:mm',
  EU_DATETIME_SECONDS_FULL_MONTH: 'dd MMMM yyyy HH:mm:ss',

  // European — full month name, unpadded
  EU_DATE_FULL_MONTH_UNPADDED: 'd MMMM yyyy',
  EU_DATETIME_FULL_MONTH_UNPADDED: 'd MMMM yyyy H:mm',
  EU_DATETIME_SECONDS_FULL_MONTH_UNPADDED: 'd MMMM yyyy H:mm:ss',

  // US — abbreviated month name
  US_DATE_ABBR_MONTH: 'MMM dd, yyyy',
  US_DATETIME_ABBR_MONTH: 'MMM dd, yyyy hh:mm a',
  US_DATETIME_SECONDS_ABBR_MONTH: 'MMM dd, yyyy hh:mm:ss a',

  // US — abbreviated month name, unpadded
  US_DATE_ABBR_MONTH_UNPADDED: 'MMM d, yyyy',
  US_DATETIME_ABBR_MONTH_UNPADDED: 'MMM d, yyyy h:mm a',
  US_DATETIME_SECONDS_ABBR_MONTH_UNPADDED: 'MMM d, yyyy h:mm:ss a',

  // US — full month name
  US_DATE_FULL_MONTH: 'MMMM dd, yyyy',
  US_DATETIME_FULL_MONTH: 'MMMM dd, yyyy hh:mm a',
  US_DATETIME_SECONDS_FULL_MONTH: 'MMMM dd, yyyy hh:mm:ss a',

  // US — full month name, unpadded
  US_DATE_FULL_MONTH_UNPADDED: 'MMMM d, yyyy',
  US_DATETIME_FULL_MONTH_UNPADDED: 'MMMM d, yyyy h:mm a',
  US_DATETIME_SECONDS_FULL_MONTH_UNPADDED: 'MMMM d, yyyy h:mm:ss a',

  // European — abbreviated weekday and month
  EU_DATE_WEEKDAY_ABBR_MONTH: 'ccc, dd MMM yyyy',
  EU_DATETIME_WEEKDAY_ABBR_MONTH: 'ccc, dd MMM yyyy HH:mm',
  EU_DATETIME_SECONDS_WEEKDAY_ABBR_MONTH: 'ccc, dd MMM yyyy HH:mm:ss',

  // European — full weekday and month
  EU_DATE_WEEKDAY_FULL_MONTH: 'cccc, dd MMMM yyyy',
  EU_DATETIME_WEEKDAY_FULL_MONTH: 'cccc, dd MMMM yyyy HH:mm',
  EU_DATETIME_SECONDS_WEEKDAY_FULL_MONTH: 'cccc, dd MMMM yyyy HH:mm:ss',

  // US — abbreviated weekday and month
  US_DATE_WEEKDAY_ABBR_MONTH: 'ccc, MMM dd, yyyy',
  US_DATETIME_WEEKDAY_ABBR_MONTH: 'ccc, MMM dd, yyyy hh:mm a',
  US_DATETIME_SECONDS_WEEKDAY_ABBR_MONTH: 'ccc, MMM dd, yyyy hh:mm:ss a',

  // US — full weekday and month
  US_DATE_WEEKDAY_FULL_MONTH: 'cccc, MMMM dd, yyyy',
  US_DATETIME_WEEKDAY_FULL_MONTH: 'cccc, MMMM dd, yyyy hh:mm a',
  US_DATETIME_SECONDS_WEEKDAY_FULL_MONTH: 'cccc, MMMM dd, yyyy hh:mm:ss a',
} as const;

/**
 * An array of all common Luxon date formats for easy use in Storybook or selection menus.
 */
export const COMMON_LUXON_DATE_FORMATS: string[] = Object.values(DATE_FORMATS);
