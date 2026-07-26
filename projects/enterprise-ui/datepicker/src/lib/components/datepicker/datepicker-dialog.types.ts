import { DateTime } from "luxon";
import {
  type DatepickerWeek,
  type DatepickerWeekday,
} from "./datepicker-grid.types";
import { type TimeUnit } from "./time-unit-control.types";

export type DatepickerTimeChange = {
  unit: TimeUnit;
  value: number;
};

export type DatepickerMeridiem = "AM" | "PM";

export type DatepickerDialogContext = Readonly<{
  dialogId: string;
  dialogTitleId: string;
  dialogDescriptionId: string;
  monthHeadingId: string;
  hourSelectId: string;
  minuteSelectId: string;
  secondSelectId: string;
  hourLabelId: string;
  minuteLabelId: string;
  secondLabelId: string;
  meridiemGroupId: string;
  meridiemLabelId: string;
  meridiemAmId: string;
  meridiemPmId: string;
  dialogTitle: string;
  formattedMonth: string;
  months: readonly string[];
  daysOfWeek: readonly DatepickerWeekday[];
  weeks: readonly DatepickerWeek[];
  selectedDate: DateTime | null;
  activeDate: DateTime;
  today: DateTime;
  viewDate: DateTime;
  testIdPrefix: string;
  dateOnly: boolean;
  showSeconds: boolean;
  uses12HourClock: boolean;
  showMeridiem: boolean;
  locale: string;
  dateAnnouncement: string;
  timeAnnouncement: string;
  navigationAnnouncement: string;
  showQuickTimeControls: boolean;
}>;
