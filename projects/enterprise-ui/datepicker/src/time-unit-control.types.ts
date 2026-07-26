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

export type TimeUnitConfiguration = {
  label: string;
  singularLabel: string;
  valueTextSuffix: string;
  minimum: number;
  maximum: number;
};

export type TimeUnitControlAnimationDirection = "increment" | "decrement";
export type TimeUnitControlAnimationPhase = "a" | "b";

export type TimeUnitControlAnimationState = Readonly<{
  direction: TimeUnitControlAnimationDirection;
  phase: TimeUnitControlAnimationPhase;
  rapid: boolean;
}>;
