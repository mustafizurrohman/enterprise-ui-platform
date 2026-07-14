import { ComponentFixture, TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  TimeWheelComponent,
  type TimeWheelContext,
} from "./time-wheel.component";

describe("TimeWheelComponent", () => {
  let fixture: ComponentFixture<TimeWheelComponent>;
  let component: TimeWheelComponent;

  const createContext = (value: number): TimeWheelContext => ({
    unit: "hour",
    value,
    controlId: "hour-control",
    labelId: "hour-label",
    testIdPrefix: "datepicker",
  });

  const getValueContainer = (): HTMLElement =>
    fixture.nativeElement.querySelector(
      '[data-testid="datepicker-hour-value"]',
    ) as HTMLElement;

  const getIncrementButton = (): HTMLButtonElement =>
    fixture.nativeElement.querySelector(
      '[data-testid="datepicker-hour-increment"]',
    ) as HTMLButtonElement;

  const getDecrementButton = (): HTMLButtonElement =>
    fixture.nativeElement.querySelector(
      '[data-testid="datepicker-hour-decrement"]',
    ) as HTMLButtonElement;

  const dispatchPointerEvent = (
    element: HTMLElement,
    type: "pointerdown" | "pointerup" | "pointercancel" | "pointerleave",
    pointerId = 1,
    button = 0,
    isPrimary = true,
  ): void => {
    const event = new Event(type, {
      bubbles: true,
      cancelable: true,
    });

    Object.defineProperties(event, {
      button: { value: button },
      isPrimary: { value: isPrimary },
      pointerId: { value: pointerId },
    });

    element.dispatchEvent(event);
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeWheelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TimeWheelComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("context", createContext(10));
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("should render the accessible spinbutton contract", () => {
    const input = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-hour-input"]',
    ) as HTMLInputElement;

    expect(input.value).toBe("10");
    expect(input.getAttribute("role")).toBe("spinbutton");
    expect(input.getAttribute("aria-valuemin")).toBe("0");
    expect(input.getAttribute("aria-valuemax")).toBe("23");
    expect(input.getAttribute("aria-valuetext")).toBe("10 Uhr");
  });

  it("should emit one change for a keyboard or assistive click", () => {
    const valueChangeSpy = vi.fn();
    component.valueChange.subscribe(valueChangeSpy);

    getIncrementButton().click();

    expect(valueChangeSpy).toHaveBeenCalledOnce();
    expect(valueChangeSpy).toHaveBeenLastCalledWith(11);
  });

  it("should change immediately and then every 70 ms while increment is pressed", () => {
    vi.useFakeTimers();
    const valueChangeSpy = vi.fn();
    component.valueChange.subscribe(valueChangeSpy);

    dispatchPointerEvent(getIncrementButton(), "pointerdown");

    expect(valueChangeSpy.mock.calls.map(([value]) => value)).toEqual([11]);

    vi.advanceTimersByTime(69);
    expect(valueChangeSpy).toHaveBeenCalledOnce();

    vi.advanceTimersByTime(1);
    expect(valueChangeSpy.mock.calls.map(([value]) => value)).toEqual([
      11, 12,
    ]);

    vi.advanceTimersByTime(140);
    expect(valueChangeSpy.mock.calls.map(([value]) => value)).toEqual([
      11, 12, 13, 14,
    ]);
  });

  it("should decrement every 70 ms with wrap-around while pressed", () => {
    vi.useFakeTimers();
    const valueChangeSpy = vi.fn();
    component.valueChange.subscribe(valueChangeSpy);
    fixture.componentRef.setInput("context", createContext(0));
    fixture.detectChanges();

    dispatchPointerEvent(getDecrementButton(), "pointerdown");
    vi.advanceTimersByTime(140);

    expect(valueChangeSpy.mock.calls.map(([value]) => value)).toEqual([
      23, 22, 21,
    ]);
  });

  it("should stop changing immediately when the pointer is released", () => {
    vi.useFakeTimers();
    const valueChangeSpy = vi.fn();
    component.valueChange.subscribe(valueChangeSpy);

    dispatchPointerEvent(getIncrementButton(), "pointerdown");
    vi.advanceTimersByTime(70);
    dispatchPointerEvent(getIncrementButton(), "pointerup");
    vi.advanceTimersByTime(280);

    expect(valueChangeSpy.mock.calls.map(([value]) => value)).toEqual([
      11, 12,
    ]);
  });

  it("should stop changing when the pointer is cancelled", () => {
    vi.useFakeTimers();
    const valueChangeSpy = vi.fn();
    component.valueChange.subscribe(valueChangeSpy);

    dispatchPointerEvent(getIncrementButton(), "pointerdown");
    dispatchPointerEvent(getIncrementButton(), "pointercancel");
    vi.advanceTimersByTime(210);

    expect(valueChangeSpy).toHaveBeenCalledOnce();
  });

  it("should stop changing when the window loses focus", () => {
    vi.useFakeTimers();
    const valueChangeSpy = vi.fn();
    component.valueChange.subscribe(valueChangeSpy);

    dispatchPointerEvent(getIncrementButton(), "pointerdown");
    window.dispatchEvent(new Event("blur"));
    vi.advanceTimersByTime(210);

    expect(valueChangeSpy).toHaveBeenCalledOnce();
  });

  it("should ignore the pointer-generated click after pointerdown", () => {
    vi.useFakeTimers();
    const valueChangeSpy = vi.fn();
    component.valueChange.subscribe(valueChangeSpy);
    const button = getIncrementButton();

    dispatchPointerEvent(button, "pointerdown");
    dispatchPointerEvent(button, "pointerup");
    button.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true, detail: 1 }),
    );

    expect(valueChangeSpy).toHaveBeenCalledOnce();
    expect(valueChangeSpy).toHaveBeenLastCalledWith(11);
  });

  it("should ignore non-primary and non-left-button pointer presses", () => {
    vi.useFakeTimers();
    const valueChangeSpy = vi.fn();
    component.valueChange.subscribe(valueChangeSpy);

    dispatchPointerEvent(getIncrementButton(), "pointerdown", 1, 1);
    dispatchPointerEvent(getIncrementButton(), "pointerdown", 2, 0, false);
    vi.advanceTimersByTime(210);

    expect(valueChangeSpy).not.toHaveBeenCalled();
  });

  it("should apply the pressed class only to the active button", () => {
    vi.useFakeTimers();

    dispatchPointerEvent(getIncrementButton(), "pointerdown");
    fixture.detectChanges();

    expect(
      getIncrementButton().classList.contains(
        "datepicker-time-button--pressed",
      ),
    ).toBeTruthy();
    expect(
      getDecrementButton().classList.contains(
        "datepicker-time-button--pressed",
      ),
    ).toBeFalsy();

    dispatchPointerEvent(getIncrementButton(), "pointerup");
    fixture.detectChanges();

    expect(
      getIncrementButton().classList.contains(
        "datepicker-time-button--pressed",
      ),
    ).toBeFalsy();
  });

  it("should alternate CSS animation names on each repeated change", () => {
    vi.useFakeTimers();

    dispatchPointerEvent(getIncrementButton(), "pointerdown");
    fixture.detectChanges();
    expect(getValueContainer().getAttribute("data-animation")).toBe(
      "increment-a",
    );

    vi.advanceTimersByTime(70);
    fixture.detectChanges();
    expect(getValueContainer().getAttribute("data-animation")).toBe(
      "increment-b",
    );
  });

  it("should sanitize typed input and clamp it to the unit maximum", () => {
    const valueChangeSpy = vi.fn();
    component.valueChange.subscribe(valueChangeSpy);
    const input = fixture.nativeElement.querySelector(
      "input",
    ) as HTMLInputElement;

    input.value = "a99";
    input.dispatchEvent(new Event("input"));

    expect(input.value).toBe("99");
    expect(valueChangeSpy).toHaveBeenLastCalledWith(23);
  });

  it.each([
    ["ArrowUp", 11],
    ["ArrowDown", 9],
    ["PageUp", 20],
    ["PageDown", 0],
    ["Home", 0],
    ["End", 23],
  ])("should handle %s keyboard input", (key: string, expectedValue: number) => {
    const valueChangeSpy = vi.fn();
    component.valueChange.subscribe(valueChangeSpy);
    const input = fixture.nativeElement.querySelector(
      "input",
    ) as HTMLInputElement;

    input.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));

    expect(valueChangeSpy).toHaveBeenLastCalledWith(expectedValue);
  });

  it("should render previous and next preview values", () => {
    const previews = fixture.nativeElement.querySelectorAll(
      ".datepicker-time-preview",
    );

    expect(previews[0]?.textContent?.trim()).toBe("11");
    expect(previews[1]?.textContent?.trim()).toBe("09");
  });

  it("should render centered Material icons with stable test ids", () => {
    const wheel = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-hour-wheel"]',
    ) as HTMLElement;
    const incrementIcon = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-hour-increment-icon"]',
    ) as HTMLElement;
    const decrementIcon = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-hour-decrement-icon"]',
    ) as HTMLElement;

    expect(wheel.getAttribute("role")).toBe("group");
    expect(wheel.getAttribute("aria-labelledby")).toBe("hour-label");
    expect(incrementIcon.tagName).toBe("MAT-ICON");
    expect(incrementIcon.textContent?.trim()).toBe("keyboard_arrow_up");
    expect(incrementIcon.getAttribute("aria-hidden")).toBe("true");
    expect(decrementIcon.tagName).toBe("MAT-ICON");
    expect(decrementIcon.textContent?.trim()).toBe("keyboard_arrow_down");
    expect(decrementIcon.getAttribute("aria-hidden")).toBe("true");
  });

  it("should expose numeric input constraints and keyboard shortcuts", () => {
    const input = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-hour-input"]',
    ) as HTMLInputElement;

    expect(input.inputMode).toBe("numeric");
    expect(input.maxLength).toBe(2);
    expect(input.pattern).toBe("[0-9]*");
    expect(input.spellcheck).toBeFalsy();
    expect(input.getAttribute("aria-keyshortcuts")).toBe(
      "ArrowUp ArrowDown PageUp PageDown Home End",
    );
  });
});
