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

describe('RepeatClickDirective', () => {
  let fixture: ComponentFixture<TestComponent>;
  let component: TestComponent;
  let button: HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestComponent],
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

  it('should repeat while pressed with acceleration', () => {
    vi.useFakeTimers();
    button.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        button: 0,
        isPrimary: true,
      }),
    );
    expect(component.onTrigger).toHaveBeenCalledTimes(1);

    const acceleratingDelays = [
      300, 294, 288, 282, 276, 270, 264, 258, 252, 246, 240,
    ];

    for (const delay of acceleratingDelays) {
      vi.advanceTimersByTime(delay);
      expect(component.onTrigger).toHaveBeenCalledTimes(
        acceleratingDelays.indexOf(delay) + 2,
      );
    }
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
    
    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    button.dispatchEvent(clickEvent);
    
    expect(component.onTrigger).toHaveBeenCalledTimes(1); // Only from pointerdown
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
