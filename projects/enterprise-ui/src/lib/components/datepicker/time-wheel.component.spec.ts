import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeWheelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TimeWheelComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("context", createContext(10));
    fixture.detectChanges();
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

  it("should emit incremented and decremented values with wrap-around", () => {
    const valueChangeSpy = vi.fn();
    component.valueChange.subscribe(valueChangeSpy);

    fixture.componentRef.setInput("context", createContext(23));
    fixture.detectChanges();
    (
      fixture.nativeElement.querySelector(
        '[data-testid="datepicker-hour-increment"]',
      ) as HTMLButtonElement
    ).click();
    expect(valueChangeSpy).toHaveBeenLastCalledWith(0);

    fixture.componentRef.setInput("context", createContext(0));
    fixture.detectChanges();
    (
      fixture.nativeElement.querySelector(
        '[data-testid="datepicker-hour-decrement"]',
      ) as HTMLButtonElement
    ).click();
    expect(valueChangeSpy).toHaveBeenLastCalledWith(23);
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
