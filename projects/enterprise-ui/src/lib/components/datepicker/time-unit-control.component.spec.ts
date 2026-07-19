import { ComponentFixture, TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TimeUnitControlComponent } from "./time-unit-control.component";
import { type TimeUnitControlContext } from "./time-unit-control.types";

describe("TimeUnitControlComponent", () => {
  let fixture: ComponentFixture<TimeUnitControlComponent>;
  let component: TimeUnitControlComponent;

  const createContext = (value: number): TimeUnitControlContext => ({
    unit: "hour",
    value,
    controlId: "hour-control",
    labelId: "hour-label",
    descriptionId: "time-instructions",
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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeUnitControlComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TimeUnitControlComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("context", createContext(10));
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("should render the same accessible spinbutton contract", () => {
    const input = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-hour-input"]',
    ) as HTMLInputElement;

    expect(input.value).toBe("10");
    expect(input.getAttribute("role")).toBe("spinbutton");
    expect(input.getAttribute("aria-valuemin")).toBe("0");
    expect(input.getAttribute("aria-valuemax")).toBe("23");
    expect(input.getAttribute("aria-valuetext")).toBe("10 Uhr");
  });

  it("should use a 1 to 12 range and announce the meridiem in 12-hour mode", () => {
    fixture.componentRef.setInput("context", {
      ...createContext(13),
      hourCycle: "h12",
      meridiem: "PM",
    } satisfies TimeUnitControlContext);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-hour-input"]',
    ) as HTMLInputElement;

    expect(input.value).toBe("01");
    expect(input.getAttribute("aria-valuemin")).toBe("1");
    expect(input.getAttribute("aria-valuemax")).toBe("12");
    expect(input.getAttribute("aria-valuenow")).toBe("1");
    expect(input.getAttribute("aria-valuetext")).toBe("1 PM");
  });

  it("should keep 12-hour stepping synchronized with the underlying 24-hour value", () => {
    const valueChangeSpy = vi.fn();
    component.valueChange.subscribe(valueChangeSpy);

    fixture.componentRef.setInput("context", {
      ...createContext(11),
      hourCycle: "h12",
      meridiem: "AM",
    } satisfies TimeUnitControlContext);
    fixture.detectChanges();
    getIncrementButton().click();
    expect(valueChangeSpy).toHaveBeenLastCalledWith(12);

    fixture.componentRef.setInput("context", {
      ...createContext(23),
      hourCycle: "h12",
      meridiem: "PM",
    } satisfies TimeUnitControlContext);
    fixture.detectChanges();
    getIncrementButton().click();
    expect(valueChangeSpy).toHaveBeenLastCalledWith(0);

    fixture.componentRef.setInput("context", {
      ...createContext(12),
      hourCycle: "h12",
      meridiem: "PM",
    } satisfies TimeUnitControlContext);
    fixture.detectChanges();
    getDecrementButton().click();
    expect(valueChangeSpy).toHaveBeenLastCalledWith(11);
  });

  it("should clamp typed 12-hour values and preserve the selected meridiem", () => {
    const valueChangeSpy = vi.fn();
    component.valueChange.subscribe(valueChangeSpy);

    fixture.componentRef.setInput("context", {
      ...createContext(13),
      hourCycle: "h12",
      meridiem: "PM",
    } satisfies TimeUnitControlContext);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-hour-input"]',
    ) as HTMLInputElement;
    input.value = "0";
    input.dispatchEvent(new Event("input"));
    expect(valueChangeSpy).toHaveBeenLastCalledWith(13);

    input.value = "12";
    input.dispatchEvent(new Event("input"));
    expect(valueChangeSpy).toHaveBeenLastCalledWith(12);
  });

  it("should expose stable IDs and accessible control relationships", () => {
    const control = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-hour-unit-control"]',
    ) as HTMLElement;
    const input = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-hour-input"]',
    ) as HTMLInputElement;
    const value = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-hour-value"]',
    ) as HTMLElement;
    const buttonStack = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-hour-button-stack"]',
    ) as HTMLElement;
    const label = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-hour-label"]',
    ) as HTMLElement;
    const increment = getIncrementButton();
    const decrement = getDecrementButton();

    expect(control.id).toBe("hour-control-unit");
    expect(control.getAttribute("aria-labelledby")).toBe(label.id);
    expect(label.id).toBe("hour-label");
    expect(input.id).toBe("hour-control");
    expect(input.getAttribute("aria-labelledby")).toBe(label.id);
    expect(input.getAttribute("aria-describedby")).toBe("time-instructions");
    expect(value.id).toBe("hour-control-value");
    expect(buttonStack.id).toBe("hour-control-button-stack");
    expect(increment.id).toBe("hour-control-increment");
    expect(increment.getAttribute("aria-controls")).toBe(input.id);
    expect(decrement.id).toBe("hour-control-decrement");
    expect(decrement.getAttribute("aria-controls")).toBe(input.id);
  });

  it("should render the increment button above the decrement button", () => {
    const buttonStack = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-hour-button-stack"]',
    ) as HTMLElement;
    const buttons = Array.from(
      buttonStack.querySelectorAll<HTMLButtonElement>("button"),
    );

    expect(buttons).toHaveLength(2);
    expect(buttons[0]?.dataset["testid"]).toBe("datepicker-hour-increment");
    expect(buttons[1]?.dataset["testid"]).toBe("datepicker-hour-decrement");
  });

  it("should use a native label associated with the spinbutton", () => {
    const input = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-hour-input"]',
    ) as HTMLInputElement;
    const label = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-hour-label"]',
    ) as HTMLLabelElement;

    expect(label.tagName).toBe("LABEL");
    expect(label.htmlFor).toBe(input.id);
    expect(label.textContent?.trim()).toBe("Std");
  });

  it("should emit incremented and decremented values with wrap-around", () => {
    const valueChangeSpy = vi.fn();
    component.valueChange.subscribe(valueChangeSpy);

    fixture.componentRef.setInput("context", createContext(23));
    fixture.detectChanges();
    getIncrementButton().click();
    expect(valueChangeSpy).toHaveBeenLastCalledWith(0);

    fixture.componentRef.setInput("context", createContext(0));
    fixture.detectChanges();
    getDecrementButton().click();
    expect(valueChangeSpy).toHaveBeenLastCalledWith(23);
  });

  it("should repeat increment while pressed and accelerate from 70 ms to 50 ms", () => {
    vi.useFakeTimers();
    const valueChangeSpy = vi.fn();
    component.valueChange.subscribe(valueChangeSpy);
    const incrementButton = getIncrementButton();

    incrementButton.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        button: 0,
        isPrimary: true,
      }),
    );

    expect(valueChangeSpy).toHaveBeenCalledTimes(1);
    expect(valueChangeSpy).toHaveBeenLastCalledWith(11);

    const acceleratingDelays = [
      300, 294, 288, 282, 276, 270, 264, 258, 252, 246, 240,
    ];

    for (const delay of acceleratingDelays) {
      vi.advanceTimersByTime(delay - 1);
      expect(valueChangeSpy).toHaveBeenCalledTimes(
        acceleratingDelays.indexOf(delay) + 1,
      );

      vi.advanceTimersByTime(1);
      expect(valueChangeSpy).toHaveBeenCalledTimes(
        acceleratingDelays.indexOf(delay) + 2,
      );
    }

    vi.advanceTimersByTime(240);
    expect(valueChangeSpy).toHaveBeenCalledTimes(13);
    expect(valueChangeSpy).toHaveBeenLastCalledWith(23);

    incrementButton.dispatchEvent(
      new PointerEvent("pointerup", {
        bubbles: true,
        button: 0,
        isPrimary: true,
      }),
    );
    incrementButton.click();

    vi.advanceTimersByTime(500);
    expect(valueChangeSpy).toHaveBeenCalledTimes(13);
  });

  it("should repeat decrement while pressed and stop on pointer cancellation", () => {
    vi.useFakeTimers();
    const valueChangeSpy = vi.fn();
    component.valueChange.subscribe(valueChangeSpy);
    const decrementButton = getDecrementButton();

    decrementButton.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        button: 0,
        isPrimary: true,
      }),
    );
    expect(valueChangeSpy).toHaveBeenLastCalledWith(9);

    vi.advanceTimersByTime(300);
    expect(valueChangeSpy).toHaveBeenLastCalledWith(8);

    decrementButton.dispatchEvent(
      new PointerEvent("pointercancel", {
        bubbles: true,
        button: 0,
        isPrimary: true,
      }),
    );
    vi.advanceTimersByTime(500);

    expect(valueChangeSpy).toHaveBeenCalledTimes(2);
  });

  it("should ignore non-primary pointer buttons for press and hold", () => {
    vi.useFakeTimers();
    const valueChangeSpy = vi.fn();
    component.valueChange.subscribe(valueChangeSpy);

    getIncrementButton().dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        button: 2,
        isPrimary: true,
      }),
    );
    vi.advanceTimersByTime(500);

    expect(valueChangeSpy).not.toHaveBeenCalled();
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
  ])(
    "should handle %s keyboard input",
    (key: string, expectedValue: number) => {
      const valueChangeSpy = vi.fn();
      component.valueChange.subscribe(valueChangeSpy);
      const input = fixture.nativeElement.querySelector(
        "input",
      ) as HTMLInputElement;

      input.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));

      expect(valueChangeSpy).toHaveBeenLastCalledWith(expectedValue);
    },
  );

  it("should set the increment CSS animation on an increment", () => {
    vi.spyOn(Date, "now").mockReturnValue(1_000);

    getIncrementButton().click();
    fixture.detectChanges();

    expect(getValueContainer().getAttribute("data-animation")).toBe(
      "increment-a",
    );
    expect(
      getValueContainer().classList.contains("datepicker-time-value--rapid"),
    ).toBeFalsy();
  });

  it("should set the decrement CSS animation on a decrement", () => {
    vi.spyOn(Date, "now").mockReturnValue(1_000);

    getDecrementButton().click();
    fixture.detectChanges();

    expect(getValueContainer().getAttribute("data-animation")).toBe(
      "decrement-a",
    );
  });

  it("should alternate CSS animation names so rapid changes restart", () => {
    const nowSpy = vi.spyOn(Date, "now").mockReturnValue(1_000);

    getIncrementButton().click();
    fixture.detectChanges();

    expect(getValueContainer().getAttribute("data-animation")).toBe(
      "increment-a",
    );

    fixture.componentRef.setInput("context", createContext(11));
    fixture.detectChanges();
    nowSpy.mockReturnValue(1_100);
    getIncrementButton().click();
    fixture.detectChanges();

    expect(getValueContainer().getAttribute("data-animation")).toBe(
      "increment-b",
    );
  });

  it("should use the rapid CSS duration class for fast button presses", () => {
    const nowSpy = vi.spyOn(Date, "now").mockReturnValue(1_000);

    getIncrementButton().click();
    fixture.componentRef.setInput("context", createContext(11));
    fixture.detectChanges();

    nowSpy.mockReturnValue(1_100);
    getIncrementButton().click();
    fixture.detectChanges();

    expect(
      getValueContainer().classList.contains("datepicker-time-value--rapid"),
    ).toBeTruthy();
  });

  it("should keep the normal CSS duration for slower button presses", () => {
    const nowSpy = vi.spyOn(Date, "now").mockReturnValue(1_000);

    getIncrementButton().click();
    fixture.componentRef.setInput("context", createContext(11));
    fixture.detectChanges();

    nowSpy.mockReturnValue(1_400);
    getIncrementButton().click();
    fixture.detectChanges();

    expect(
      getValueContainer().classList.contains("datepicker-time-value--rapid"),
    ).toBeFalsy();
  });

  it("should not treat keyboard changes as rapid button presses", () => {
    const nowSpy = vi.spyOn(Date, "now").mockReturnValue(1_000);
    const input = fixture.nativeElement.querySelector(
      "input",
    ) as HTMLInputElement;

    getIncrementButton().click();
    fixture.componentRef.setInput("context", createContext(11));
    fixture.detectChanges();

    nowSpy.mockReturnValue(1_050);
    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }),
    );
    fixture.detectChanges();

    expect(
      getValueContainer().classList.contains("datepicker-time-value--rapid"),
    ).toBeFalsy();
  });

  it("should render centered Material icons with stable test ids", () => {
    const control = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-hour-unit-control"]',
    ) as HTMLElement;
    const incrementIcon = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-hour-increment-icon"]',
    ) as HTMLElement;
    const decrementIcon = fixture.nativeElement.querySelector(
      '[data-testid="datepicker-hour-decrement-icon"]',
    ) as HTMLElement;

    expect(control.getAttribute("role")).toBe("group");
    expect(control.getAttribute("aria-labelledby")).toBe("hour-label");
    expect(incrementIcon.tagName).toBe("MAT-ICON");
    expect(incrementIcon.textContent?.trim()).toBe("add");
    expect(incrementIcon.getAttribute("aria-hidden")).toBe("true");
    expect(decrementIcon.tagName).toBe("MAT-ICON");
    expect(decrementIcon.textContent?.trim()).toBe("remove");
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
