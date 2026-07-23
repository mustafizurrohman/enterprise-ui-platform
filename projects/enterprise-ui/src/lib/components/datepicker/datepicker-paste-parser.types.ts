export type DatepickerPasteInputState = Readonly<{
  value: string;
  selectionStart: number | null;
  selectionEnd: number | null;
}>;

export type NormalizedSelection = Readonly<{
  start: number;
  end: number;
}>;
