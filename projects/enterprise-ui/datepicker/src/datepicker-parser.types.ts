/**
 * Represents the current state of an HTML input element.
 */
export type DatepickerInputState = Readonly<{
  /** The current string value of the input. */
  value: string;
  /** The start index of the current selection. */
  selectionStart: number | null;
  /** The end index of the current selection. */
  selectionEnd: number | null;
}>;

/**
 * Represents a normalized selection range, ensuring start is always <= end.
 */
export type NormalizedSelection = Readonly<{
  /** The normalized start index. */
  start: number;
  /** The normalized end index. */
  end: number;
}>;
