export type TimeUnit = "hour" | "minute" | "second";
export type TimeUnitControlHourCycle = "h12" | "h23";
export type TimeUnitControlMeridiem = "AM" | "PM";

export type TimeUnitControlContext = Readonly<{
  unit: TimeUnit;
  value: number;
  controlId: string;
  labelId: string;
  descriptionId?: string;
  testIdPrefix: string;
  hourCycle?: TimeUnitControlHourCycle;
  meridiem?: TimeUnitControlMeridiem;
}>;
