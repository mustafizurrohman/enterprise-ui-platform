import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MrTimeWheelComponent } from "./mr-time-wheel.component";

describe("MrTimeWheelComponent", () => {
  let fixture: ComponentFixture<MrTimeWheelComponent>;
  let component: MrTimeWheelComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MrTimeWheelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MrTimeWheelComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("unit", "hour");
    fixture.componentRef.setInput("value", 10);
    fixture.componentRef.setInput("controlId", "hour-control");
    fixture.componentRef.setInput("labelId", "hour-label");
    fixture.componentRef.setInput("testIdPrefix", "datepicker");
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

    fixture.componentRef.setInput("value", 23);
    fixture.detectChanges();
    (
      fixture.nativeElement.querySelector(
        '[data-testid="datepicker-hour-increment"]',
      ) as HTMLButtonElement
    ).click();
    expect(valueChangeSpy).toHaveBeenLastCalledWith(0);

    fixture.componentRef.setInput("value", 0);
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
  ])("should handle %s keyboard input", (key, expectedValue) => {
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
      ".mr-datepicker-time-preview",
    );

    expect(previews[0].textContent.trim()).toBe("09");
    expect(previews[1].textContent.trim()).toBe("11");
  });
});
