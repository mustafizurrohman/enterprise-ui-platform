import {
  Directive,
  ElementRef,
  HostListener,
  OnDestroy,
  output,
} from '@angular/core';

const PRESS_HOLD_INITIAL_DELAY_MS = 300;
const PRESS_HOLD_MINIMUM_DELAY_MS = PRESS_HOLD_INITIAL_DELAY_MS * 0.8;
const PRESS_HOLD_ACCELERATION_STEP_MS = PRESS_HOLD_INITIAL_DELAY_MS * 0.02;

@Directive({
  selector: '[enterpriseRepeatClick]',
  standalone: true,
})
export class RepeatClickDirective implements OnDestroy {
  readonly enterpriseRepeatClick = output<void>();

  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private clickSuppressionTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private delay = PRESS_HOLD_INITIAL_DELAY_MS;
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

    this.suppressNextClick = true;
    this.active = true;
    this.delay = PRESS_HOLD_INITIAL_DELAY_MS;

    this.enterpriseRepeatClick.emit();
    this.scheduleNext();

    const button = this.elementRef.nativeElement;
    if (typeof button.setPointerCapture === 'function' && Number.isInteger(event.pointerId)) {
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
      this.enterpriseRepeatClick.emit();
    }
  }

  private scheduleNext(): void {
    this.timeoutId = setTimeout(() => {
      this.timeoutId = null;

      if (!this.active) {
        return;
      }

      this.enterpriseRepeatClick.emit();

      this.delay = Math.max(
        PRESS_HOLD_MINIMUM_DELAY_MS,
        this.delay - PRESS_HOLD_ACCELERATION_STEP_MS,
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
