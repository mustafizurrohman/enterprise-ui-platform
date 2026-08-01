export const DEFAULT_DATETIME_FORMAT = "dd.MM.yyyy HH:mm 'Uhr'";
export const DEFAULT_DATE_FORMAT = 'dd.MM.yyyy';
export const DEFAULT_DATETIME_SECONDS_FORMAT = "dd.MM.yyyy HH:mm:ss 'Uhr'";

/**
 * Common Luxon date formats used for parsing and display in the Datepicker.
 * Can be used as an Enum.
 */
export const DATE_FORMATS = {
  // Dot separator — German, four-digit year
  GERMAN_DATE_PADDED: DEFAULT_DATE_FORMAT,
  GERMAN_DATETIME_PADDED: 'dd.MM.yyyy HH:mm',
  GERMAN_DATETIME_DEFAULT: DEFAULT_DATETIME_FORMAT,
  GERMAN_DATETIME_SECONDS_PADDED: 'dd.MM.yyyy HH:mm:ss',
  GERMAN_DATETIME_UHR_PADDED: DEFAULT_DATETIME_SECONDS_FORMAT,
  GERMAN_DATE_UNPADDED: 'd.M.yyyy',
  GERMAN_DATETIME_UNPADDED: 'd.M.yyyy H:mm',
  GERMAN_DATETIME_UHR_UNPADDED: "d.M.yyyy H:mm 'Uhr'",
  GERMAN_DATETIME_SECONDS_UNPADDED: 'd.M.yyyy H:mm:ss',
  GERMAN_DATETIME_UHR_SECONDS_UNPADDED: "d.M.yyyy H:mm:ss 'Uhr'",

  // Dot separator — German, two-digit year
  SHORT_YEAR_GERMAN_DATE: 'dd.MM.yy',
  SHORT_YEAR_GERMAN_DATETIME: 'dd.MM.yy HH:mm',
  SHORT_YEAR_GERMAN_DATETIME_SECONDS: 'dd.MM.yy HH:mm:ss',

  // Slash separator — year first
  YEAR_FIRST_DATE: 'yyyy/MM/dd',
  YEAR_FIRST_DATETIME: 'yyyy/MM/dd HH:mm',
  YEAR_FIRST_DATETIME_SECONDS: 'yyyy/MM/dd HH:mm:ss',

  // Slash separator — European, four-digit year
  EU_DATE_SLASH_PADDED: 'dd/MM/yyyy',
  EU_DATETIME_SLASH_PADDED: 'dd/MM/yyyy HH:mm',
  EU_DATETIME_SECONDS_SLASH_PADDED: 'dd/MM/yyyy HH:mm:ss',
  EU_DATE_SLASH_UNPADDED: 'd/M/yyyy',
  EU_DATETIME_SLASH_UNPADDED: 'd/M/yyyy H:mm',
  EU_DATETIME_SECONDS_SLASH_UNPADDED: 'd/M/yyyy H:mm:ss',

  // Slash separator — European, two-digit year
  SHORT_YEAR_EU_DATE_SLASH: 'dd/MM/yy',
  SHORT_YEAR_EU_DATETIME_SLASH: 'dd/MM/yy HH:mm',
  SHORT_YEAR_EU_DATETIME_SECONDS_SLASH: 'dd/MM/yy HH:mm:ss',

  // Slash separator — US, four-digit year
  US_DATE_SLASH_PADDED: 'MM/dd/yyyy',
  US_DATETIME_SLASH_PADDED: 'MM/dd/yyyy hh:mm a',
  US_DATETIME_SECONDS_SLASH_PADDED: 'MM/dd/yyyy hh:mm:ss a',
  US_DATE_SLASH_UNPADDED: 'M/d/yyyy',
  US_DATETIME_SLASH_UNPADDED: 'M/d/yyyy h:mm a',
  US_DATETIME_SECONDS_SLASH_UNPADDED: 'M/d/yyyy h:mm:ss a',

  // Slash separator — US, two-digit year
  SHORT_YEAR_US_DATE_SLASH: 'MM/dd/yy',
  SHORT_YEAR_US_DATETIME_SLASH: 'MM/dd/yy hh:mm a',
  SHORT_YEAR_US_DATETIME_SECONDS_SLASH: 'MM/dd/yy hh:mm:ss a',

  // Hyphen separator — ISO, year first
  ISO_DATE: 'yyyy-MM-dd',
  ISO_DATETIME: 'yyyy-MM-dd HH:mm',
  ISO_DATETIME_SECONDS: 'yyyy-MM-dd HH:mm:ss',

  // Hyphen separator — European, four-digit year
  EU_DATE_HYPHEN_PADDED: 'dd-MM-yyyy',
  EU_DATETIME_HYPHEN_PADDED: 'dd-MM-yyyy HH:mm',
  EU_DATETIME_SECONDS_HYPHEN_PADDED: 'dd-MM-yyyy HH:mm:ss',
  EU_DATE_HYPHEN_UNPADDED: 'd-M-yyyy',
  EU_DATETIME_HYPHEN_UNPADDED: 'd-M-yyyy H:mm',
  EU_DATETIME_SECONDS_HYPHEN_UNPADDED: 'd-M-yyyy H:mm:ss',

  // Hyphen separator — European, two-digit year
  SHORT_YEAR_EU_DATE_HYPHEN: 'dd-MM-yy',
  SHORT_YEAR_EU_DATETIME_HYPHEN: 'dd-MM-yy HH:mm',
  SHORT_YEAR_EU_DATETIME_SECONDS_HYPHEN: 'dd-MM-yy HH:mm:ss',

  // Hyphen separator — US, four-digit year
  US_DATE_HYPHEN_PADDED: 'MM-dd-yyyy',
  US_DATETIME_HYPHEN_PADDED: 'MM-dd-yyyy hh:mm a',
  US_DATETIME_SECONDS_HYPHEN_PADDED: 'MM-dd-yyyy hh:mm:ss a',
  US_DATE_HYPHEN_UNPADDED: 'M-d-yyyy',
  US_DATETIME_HYPHEN_UNPADDED: 'M-d-yyyy h:mm a',
  US_DATETIME_SECONDS_HYPHEN_UNPADDED: 'M-d-yyyy h:mm:ss a',

  // Hyphen separator — US, two-digit year
  SHORT_YEAR_US_DATE_HYPHEN: 'MM-dd-yy',
  SHORT_YEAR_US_DATETIME_HYPHEN: 'MM-dd-yy hh:mm a',
  SHORT_YEAR_US_DATETIME_SECONDS_HYPHEN: 'MM-dd-yy hh:mm:ss a',

  // T separator — ISO
  ISO_DATETIME_T: "yyyy-MM-dd'T'HH:mm",
  ISO_DATETIME_T_SECONDS: "yyyy-MM-dd'T'HH:mm:ss",

  // Space separator — European abbreviated month
  EU_DATE_ABBR_MONTH: 'dd MMM yyyy',
  EU_DATETIME_ABBR_MONTH: 'dd MMM yyyy HH:mm',
  EU_DATETIME_SECONDS_ABBR_MONTH: 'dd MMM yyyy HH:mm:ss',
  EU_DATE_ABBR_MONTH_UNPADDED: 'd MMM yyyy',
  EU_DATETIME_ABBR_MONTH_UNPADDED: 'd MMM yyyy H:mm',
  EU_DATETIME_SECONDS_ABBR_MONTH_UNPADDED: 'd MMM yyyy H:mm:ss',

  // Space separator — European full month
  EU_DATE_FULL_MONTH: 'dd MMMM yyyy',
  EU_DATETIME_FULL_MONTH: 'dd MMMM yyyy HH:mm',
  EU_DATETIME_SECONDS_FULL_MONTH: 'dd MMMM yyyy HH:mm:ss',
  EU_DATE_FULL_MONTH_UNPADDED: 'd MMMM yyyy',
  EU_DATETIME_FULL_MONTH_UNPADDED: 'd MMMM yyyy H:mm',
  EU_DATETIME_SECONDS_FULL_MONTH_UNPADDED: 'd MMMM yyyy H:mm:ss',

  // Comma and space separators — US abbreviated month
  US_DATE_ABBR_MONTH: 'MMM dd, yyyy',
  US_DATETIME_ABBR_MONTH: 'MMM dd, yyyy hh:mm a',
  US_DATETIME_SECONDS_ABBR_MONTH: 'MMM dd, yyyy hh:mm:ss a',
  US_DATE_ABBR_MONTH_UNPADDED: 'MMM d, yyyy',
  US_DATETIME_ABBR_MONTH_UNPADDED: 'MMM d, yyyy h:mm a',
  US_DATETIME_SECONDS_ABBR_MONTH_UNPADDED: 'MMM d, yyyy h:mm:ss a',

  // Comma and space separators — US full month
  US_DATE_FULL_MONTH: 'MMMM dd, yyyy',
  US_DATETIME_FULL_MONTH: 'MMMM dd, yyyy hh:mm a',
  US_DATETIME_SECONDS_FULL_MONTH: 'MMMM dd, yyyy hh:mm:ss a',
  US_DATE_FULL_MONTH_UNPADDED: 'MMMM d, yyyy',
  US_DATETIME_FULL_MONTH_UNPADDED: 'MMMM d, yyyy h:mm a',
  US_DATETIME_SECONDS_FULL_MONTH_UNPADDED: 'MMMM d, yyyy h:mm:ss a',

  // Weekday with comma and space separators — European
  EU_DATE_WEEKDAY_ABBR_MONTH: 'ccc, dd MMM yyyy',
  EU_DATETIME_WEEKDAY_ABBR_MONTH: 'ccc, dd MMM yyyy HH:mm',
  EU_DATETIME_SECONDS_WEEKDAY_ABBR_MONTH: 'ccc, dd MMM yyyy HH:mm:ss',
  EU_DATE_WEEKDAY_FULL_MONTH: 'cccc, dd MMMM yyyy',
  EU_DATETIME_WEEKDAY_FULL_MONTH: 'cccc, dd MMMM yyyy HH:mm',
  EU_DATETIME_SECONDS_WEEKDAY_FULL_MONTH: 'cccc, dd MMMM yyyy HH:mm:ss',

  // Weekday with comma and space separators — US
  US_DATE_WEEKDAY_ABBR_MONTH: 'ccc, MMM dd, yyyy',
  US_DATETIME_WEEKDAY_ABBR_MONTH: 'ccc, MMM dd, yyyy hh:mm a',
  US_DATETIME_SECONDS_WEEKDAY_ABBR_MONTH: 'ccc, MMM dd, yyyy hh:mm:ss a',
  US_DATE_WEEKDAY_FULL_MONTH: 'cccc, MMMM dd, yyyy',
  US_DATETIME_WEEKDAY_FULL_MONTH: 'cccc, MMMM dd, yyyy hh:mm a',
  US_DATETIME_SECONDS_WEEKDAY_FULL_MONTH: 'cccc, MMMM dd, yyyy hh:mm:ss a',
} as const;
/**
 * An array of all common Luxon date formats for easy use in Storybook or selection menus.
 */
export const COMMON_LUXON_DATE_FORMATS: string[] = Object.values(DATE_FORMATS);
