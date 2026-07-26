import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RepeatClickDirective } from './repeat-click.directive';

@Component({
  template: `<button (repeatClick)="onTrigger()">Click me</button>`,
  standalone: true,
  imports: [RepeatClickDirective],
})
class TestComponent {
  onTrigger = vi.fn();
}

@Component({
  template: `
    <button
      [pressHoldInitialDelayMs]="500"
      (repeatClick)="onTrigger()"
    >
      Click me
    </button>
  `,
  standalone: true,
  imports: [RepeatClickDirective],
})
class CustomDelayTestComponent {
  onTrigger = vi.fn();
}

describe('RepeatClickDirective', () => {
  let fixture: ComponentFixture<TestComponent>;
  let component: TestComponent;
  let button: HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestComponent, CustomDelayTestComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    button = fixture.nativeElement.querySelector('button');
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should emit on pointerdown', () => {
    button.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        button: 0,
        isPrimary: true,
      }),
    );
    expect(component.onTrigger).toHaveBeenCalledTimes(1);
  });

  it('should emit immediately, wait 300 ms, and then progressively accelerate', () => {
    vi.useFakeTimers();
    button.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        button: 0,
        isPrimary: true,
      }),
    );

    // The initial pointer-down emission has no delay.
    expect(component.onTrigger).toHaveBeenCalledTimes(1);

    // The first repeated emission occurs only after the full initial delay.
    vi.advanceTimersByTime(299);
    expect(component.onTrigger).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1);
    expect(component.onTrigger).toHaveBeenCalledTimes(2);

    const acceleratingDelays = [
      294, 288, 282, 276, 270, 264, 258, 252, 246, 240,
    ];

    for (const [index, delay] of acceleratingDelays.entries()) {
      vi.advanceTimersByTime(delay);
      expect(component.onTrigger).toHaveBeenCalledTimes(index + 3);
    }
  });

  it('should use the configured initial delay', () => {
    vi.useFakeTimers();
    const customFixture = TestBed.createComponent(CustomDelayTestComponent);
    const customComponent = customFixture.componentInstance;
    const customButton: HTMLButtonElement =
      customFixture.nativeElement.querySelector('button');
    customFixture.detectChanges();

    customButton.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        button: 0,
        isPrimary: true,
      }),
    );
    expect(customComponent.onTrigger).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(499);
    expect(customComponent.onTrigger).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1);
    expect(customComponent.onTrigger).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(490);
    expect(customComponent.onTrigger).toHaveBeenCalledTimes(3);

    customFixture.destroy();
  });

  it('should stop repeating on pointerup', () => {
    vi.useFakeTimers();
    button.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        button: 0,
        isPrimary: true,
      }),
    );
    expect(component.onTrigger).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(300);
    expect(component.onTrigger).toHaveBeenCalledTimes(2);

    button.dispatchEvent(
      new PointerEvent('pointerup', {
        bubbles: true,
        button: 0,
        isPrimary: true,
      }),
    );

    vi.advanceTimersByTime(300);
    expect(component.onTrigger).toHaveBeenCalledTimes(2);
  });

  it('should suppress the click event after pointerdown', () => {
    vi.useFakeTimers();
    button.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        button: 0,
        isPrimary: true,
      }),
    );
    button.dispatchEvent(
      new PointerEvent('pointerup', {
        bubbles: true,
        button: 0,
        isPrimary: true,
      }),
    );

    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });
    button.dispatchEvent(clickEvent);

    expect(component.onTrigger).toHaveBeenCalledTimes(1);
    expect(clickEvent.defaultPrevented).toBe(true);
  });

  it('should emit on click if not preceded by pointerdown (e.g. keyboard)', () => {
    button.click();
    expect(component.onTrigger).toHaveBeenCalledTimes(1);
  });

  it('should ignore non-primary pointer buttons', () => {
    vi.useFakeTimers();
    button.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        button: 2,
        isPrimary: true,
      }),
    );
    vi.advanceTimersByTime(500);
    expect(component.onTrigger).not.toHaveBeenCalled();
  });
});
