export type DatepickerHeaderContext = Readonly<{
  dialogId: string;
  testIdPrefix: string;
  calendarGridId: string;
  monthHeadingId: string;
  formattedMonth: string;
  selectedMonth: string;
  shortMonths: readonly string[];
  todayMonth: number;
  todayYear: number;
  viewYear: number;
}>;
