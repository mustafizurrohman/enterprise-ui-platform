export type LuxonFormatCapabilities = Readonly<{
  hasTime: boolean;
  hasSeconds: boolean;
  uses12HourClock: boolean;
  showMeridiem: boolean;
}>;
