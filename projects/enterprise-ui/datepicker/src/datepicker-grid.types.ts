import { DateTime } from "luxon";

export type DatepickerWeekday = {
  short: string;
  long: string;
  weekday: number;
};

export type DatepickerWeek = {
  weekNumber: number;
  days: (DateTime | null)[];
};

export type DatepickerGridKeydown = {
  event: KeyboardEvent;
  date: DateTime;
};

export type DatepickerGridContext = Readonly<{
  gridId: string;
  daysOfWeek: readonly DatepickerWeekday[];
  weeks: readonly DatepickerWeek[];
  selectedDate: DateTime | null;
  activeDate: DateTime;
  today: DateTime;
  viewDate: DateTime;
  monthHeadingId: string;
  testIdPrefix: string;
  locale: string;
}>;
