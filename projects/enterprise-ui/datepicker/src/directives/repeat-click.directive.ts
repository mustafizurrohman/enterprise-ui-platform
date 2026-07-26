import {
  Directive,
  ElementRef,
  HostListener,
  input,
  numberAttribute,
  OnDestroy,
  output,
} from '@angular/core';

const DEFAULT_PRESS_HOLD_INITIAL_DELAY_MS = 300;
const PRESS_HOLD_MINIMUM_DELAY_FACTOR = 0.8;
const PRESS_HOLD_ACCELERATION_STEP_FACTOR = 0.02;

/**
 * Emits immediately when the primary pointer is pressed. While the pointer
 * remains pressed, the next emission occurs after the configured initial delay
 * (300 ms by default), followed by progressively faster repeated emissions.
 *
 * The repeat interval accelerates by 2% of the configured initial delay after
 * each repeated emission, down to a minimum interval of 80% of that delay.
 * Keyboard-triggered click events emit once without starting repetition.
 *
 * @example Default initial delay of 300 ms
 * ```html
 * <button type="button" (repeatClick)="increment()">
 *   Increment
 * </button>
 * ```
 *
 * @example Custom initial delay of 500 ms
 * ```html
 * <button
 *   type="button"
 *   [pressHoldInitialDelayMs]="500"
 *   (repeatClick)="increment()"
 * >
 *   Increment
 * </button>
 * ```
 */
@Directive({
  selector: '[repeatClick]',
  standalone: true,
})
export class RepeatClickDirective implements OnDestroy {
  /**
   * Emits once on pointer down, repeatedly while held, or once for a regular
   * click such as a keyboard activation.
   */
  readonly repeatClick = output<void>();

  /**
   * Delay in milliseconds between the immediate pointer-down emission and
   * the first repeated emission.
   *
   * The value defaults to `300`. Both property binding and a static numeric
   * attribute are supported because the input uses `numberAttribute`.
   *
   * @example
   * ```html
   * <button
 *   type="button"
 *   pressHoldInitialDelayMs="500"
 *   (repeatClick)="increment()"
 * >
   *   Increment
   * </button>
   * ```
   */
  readonly pressHoldInitialDelayMs = input(
    DEFAULT_PRESS_HOLD_INITIAL_DELAY_MS,
    { transform: numberAttribute },
  );

  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private clickSuppressionTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private delay = DEFAULT_PRESS_HOLD_INITIAL_DELAY_MS;
  private minimumDelay =
    DEFAULT_PRESS_HOLD_INITIAL_DELAY_MS * PRESS_HOLD_MINIMUM_DELAY_FACTOR;
  private accelerationStep =
    DEFAULT_PRESS_HOLD_INITIAL_DELAY_MS *
    PRESS_HOLD_ACCELERATION_STEP_FACTOR;
  private active = false;
  private suppressNextClick = false;

  constructor(private readonly elementRef: ElementRef<HTMLElement>) {}

  ngOnDestroy(): void {
    this.stopRepeat();
    this.clearClickSuppressionTimeout();
  }

  @HostListener('pointerdown', ['$event'])
  protected onPointerDown(event: PointerEvent): void {
    if (event.button !== 0 || !event.isPrimary) {
      return;
    }

    this.stopRepeat();
    this.clearClickSuppressionTimeout();

    const initialDelay = this.pressHoldInitialDelayMs();

    this.suppressNextClick = true;
    this.active = true;
    this.delay = initialDelay;
    this.minimumDelay = initialDelay * PRESS_HOLD_MINIMUM_DELAY_FACTOR;
    this.accelerationStep =
      initialDelay * PRESS_HOLD_ACCELERATION_STEP_FACTOR;

    this.repeatClick.emit();
    this.scheduleNext();

    const button = this.elementRef.nativeElement;
    if (
      typeof button.setPointerCapture === 'function' &&
      Number.isInteger(event.pointerId)
    ) {
      try {
        button.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture is optional
      }
    }
  }

  @HostListener('pointerup')
  @HostListener('pointercancel')
  @HostListener('pointerleave')
  @HostListener('lostpointercapture')
  protected onPointerUp(): void {
    this.stopRepeat();

    if (this.suppressNextClick) {
      this.scheduleClickSuppressionReset();
    }
  }

  @HostListener('click', ['$event'])
  protected onClick(event: Event): void {
    if (this.suppressNextClick) {
      event.preventDefault();
      event.stopImmediatePropagation();
      this.suppressNextClick = false;
      this.clearClickSuppressionTimeout();
    } else {
      this.repeatClick.emit();
    }
  }

  private scheduleNext(): void {
    this.timeoutId = setTimeout(() => {
      this.timeoutId = null;

      if (!this.active) {
        return;
      }

      this.repeatClick.emit();

      this.delay = Math.max(
        this.minimumDelay,
        this.delay - this.accelerationStep,
      );
      this.scheduleNext();
    }, this.delay);
  }

  private stopRepeat(): void {
    this.active = false;
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  private scheduleClickSuppressionReset(): void {
    this.clearClickSuppressionTimeout();
    this.clickSuppressionTimeoutId = setTimeout(() => {
      this.suppressNextClick = false;
      this.clickSuppressionTimeoutId = null;
    }, 0);
  }

  private clearClickSuppressionTimeout(): void {
    if (this.clickSuppressionTimeoutId !== null) {
      clearTimeout(this.clickSuppressionTimeoutId);
      this.clickSuppressionTimeoutId = null;
    }
  }
}
