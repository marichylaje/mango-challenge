import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { RangeBounds, RangeValue } from "../../../types";
import { Range } from "../Range";

const bounds: RangeBounds = { min: 0, max: 100 };
const value: RangeValue = { from: 20, to: 60 };

function setup(props: { bounds?: RangeBounds; value?: RangeValue; disabled?: boolean } = {}) {
  const onChange = vi.fn();
  const onCommit = vi.fn();
  const utils = render(
    <Range
      bounds={props.bounds ?? bounds}
      value={props.value ?? value}
      disabled={props.disabled}
      onChange={onChange}
      onCommit={onCommit}
    />,
  );
  const fromHandle = screen.getByRole("slider", { name: "Minimum value" });
  const toHandle = screen.getByRole("slider", { name: "Maximum value" });
  const fromInput = screen.getByRole("textbox", { name: "Minimum value" });
  const toInput = screen.getByRole("textbox", { name: "Maximum value" });
  const track = fromHandle.parentElement as HTMLElement;
  track.getBoundingClientRect = () => new DOMRect(100, 0, 400, 44);
  return { onChange, onCommit, fromHandle, toHandle, fromInput, toInput, track, ...utils };
}

const focus = (element: HTMLElement) => act(() => element.focus());

describe("Range rendering", () => {
  it("renders two sliders with dynamic aria limits", () => {
    const { fromHandle, toHandle } = setup();
    expect(screen.getAllByRole("slider")).toHaveLength(2);
    expect(fromHandle).toHaveAttribute("aria-valuenow", "20");
    expect(fromHandle).toHaveAttribute("aria-valuemin", "0");
    expect(fromHandle).toHaveAttribute("aria-valuemax", "59");
    expect(fromHandle).toHaveAttribute("aria-valuetext", "20");
    expect(toHandle).toHaveAttribute("aria-valuenow", "60");
    expect(toHandle).toHaveAttribute("aria-valuemin", "21");
    expect(toHandle).toHaveAttribute("aria-valuemax", "100");
  });

  it("is labelled as a group and shows the values in the inputs", () => {
    const { fromInput, toInput } = setup();
    expect(screen.getByRole("group", { name: "Range selection" })).toBeInTheDocument();
    expect(fromInput).toHaveValue("20");
    expect(toInput).toHaveValue("60");
  });

  it("follows the order input, handle, handle, input when tabbing", async () => {
    const user = userEvent.setup();
    const { fromInput, fromHandle, toHandle, toInput } = setup();
    for (const element of [fromInput, fromHandle, toHandle, toInput]) {
      await user.tab();
      expect(element).toHaveFocus();
    }
  });

  it("raises the handle that can still move when the other is at an extreme", () => {
    const { fromHandle, toHandle } = setup({ value: { from: 99, to: 100 } });
    expect(fromHandle).toHaveAttribute("data-active", "true");
    expect(toHandle).toHaveAttribute("data-active", "false");
  });
});

describe("Range keyboard", () => {
  it("moves by one step with arrows", async () => {
    const user = userEvent.setup();
    const { fromHandle, onChange, onCommit } = setup();
    focus(fromHandle);
    await user.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenCalledWith({ from: 21, to: 60 });
    expect(onCommit).toHaveBeenCalledWith({ from: 21, to: 60 });
    await user.keyboard("{ArrowLeft}");
    expect(onCommit).toHaveBeenLastCalledWith({ from: 19, to: 60 });
  });

  it("moves by ten with Page keys", async () => {
    const user = userEvent.setup();
    const { fromHandle, onCommit } = setup();
    focus(fromHandle);
    await user.keyboard("{PageUp}");
    expect(onCommit).toHaveBeenLastCalledWith({ from: 30, to: 60 });
    await user.keyboard("{PageDown}");
    expect(onCommit).toHaveBeenLastCalledWith({ from: 10, to: 60 });
  });

  it("jumps to the limits with Home and End", async () => {
    const user = userEvent.setup();
    const { fromHandle, onCommit } = setup();
    focus(fromHandle);
    await user.keyboard("{Home}");
    expect(onCommit).toHaveBeenLastCalledWith({ from: 0, to: 60 });
    await user.keyboard("{End}");
    expect(onCommit).toHaveBeenLastCalledWith({ from: 59, to: 60 });
  });

  it("does nothing when already at the limit", async () => {
    const user = userEvent.setup();
    const { toHandle, onChange, onCommit } = setup({ value: { from: 20, to: 100 } });
    focus(toHandle);
    await user.keyboard("{ArrowRight}");
    expect(onChange).not.toHaveBeenCalled();
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("does not prevent Tab nor modified shortcuts", () => {
    const { fromHandle, onCommit } = setup();
    expect(fireEvent.keyDown(fromHandle, { key: "Tab" })).toBe(true);
    expect(fireEvent.keyDown(fromHandle, { key: "ArrowLeft", altKey: true })).toBe(true);
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("prevents default for handled keys", () => {
    const { fromHandle } = setup();
    expect(fireEvent.keyDown(fromHandle, { key: "ArrowRight" })).toBe(false);
  });
});

describe("Range pointer", () => {
  it("never lets the max handle cross the min handle", () => {
    const { toHandle, onChange, onCommit } = setup();
    fireEvent.pointerDown(toHandle, { pointerId: 1, clientX: 340 });
    fireEvent.pointerMove(toHandle, { pointerId: 1, clientX: 0 });
    expect(onChange).toHaveBeenLastCalledWith({ from: 20, to: 21 });
    fireEvent.pointerUp(toHandle, { pointerId: 1, clientX: 0 });
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith({ from: 20, to: 21 });
  });

  it("flags dragging on the handle and the root", () => {
    const { fromHandle } = setup();
    const root = screen.getByRole("group");
    fireEvent.pointerDown(fromHandle, { pointerId: 1, clientX: 180 });
    expect(fromHandle).toHaveAttribute("data-dragging", "true");
    expect(root).toHaveAttribute("data-dragging", "true");
    fireEvent.pointerUp(fromHandle, { pointerId: 1 });
    expect(fromHandle).toHaveAttribute("data-dragging", "false");
    expect(root).toHaveAttribute("data-dragging", "false");
  });
});

describe("Range inputs", () => {
  it("clamps typed values to the absolute limit", async () => {
    const user = userEvent.setup();
    const { toInput, onCommit } = setup();
    await user.clear(toInput);
    await user.type(toInput, "150{Enter}");
    expect(onCommit).toHaveBeenCalledWith({ from: 20, to: 100 });
  });

  it("clamps the min input against the max handle", async () => {
    const user = userEvent.setup();
    const { fromInput, onCommit } = setup();
    await user.clear(fromInput);
    await user.type(fromInput, "70{Enter}");
    expect(onCommit).toHaveBeenCalledWith({ from: 59, to: 60 });
  });

  it("clamps negative numbers to the minimum", async () => {
    const user = userEvent.setup();
    const { fromInput, onCommit } = setup();
    await user.clear(fromInput);
    await user.type(fromInput, "-5{Enter}");
    expect(onCommit).toHaveBeenCalledWith({ from: 0, to: 60 });
  });

  it("reverts invalid text on blur without committing", async () => {
    const user = userEvent.setup();
    const { toInput, onCommit } = setup();
    await user.clear(toInput);
    await user.type(toInput, "abc");
    expect(toInput).toHaveAttribute("aria-invalid", "true");
    await user.tab();
    expect(toInput).toHaveValue("60");
    expect(toInput).not.toHaveAttribute("aria-invalid");
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("reverts empty text on blur", async () => {
    const user = userEvent.setup();
    const { toInput, onCommit } = setup();
    await user.clear(toInput);
    await user.tab();
    expect(toInput).toHaveValue("60");
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("commits on blur", async () => {
    const user = userEvent.setup();
    const { toInput, onCommit } = setup();
    await user.clear(toInput);
    await user.type(toInput, "80");
    await user.tab();
    expect(onCommit).toHaveBeenCalledWith({ from: 20, to: 80 });
  });

  it("reverts on Escape and keeps focus", async () => {
    const user = userEvent.setup();
    const { toInput, onCommit } = setup();
    await user.clear(toInput);
    await user.type(toInput, "80{Escape}");
    expect(toInput).toHaveValue("60");
    expect(toInput).toHaveFocus();
    expect(onCommit).not.toHaveBeenCalled();
  });
});

describe("Range disabled state", () => {
  it("disables everything for degenerate bounds", () => {
    const setPointerCapture = vi.fn();
    const { fromHandle, toHandle, fromInput, toInput, onChange, onCommit } = setup({
      bounds: { min: 14, max: 14 },
      value: { from: 14, to: 14 },
    });
    fromHandle.setPointerCapture = setPointerCapture;
    for (const slider of [fromHandle, toHandle]) {
      expect(slider).toHaveAttribute("aria-disabled", "true");
      expect(slider).toHaveAttribute("tabindex", "-1");
    }
    expect(fromInput).toBeDisabled();
    expect(toInput).toBeDisabled();
    fireEvent.pointerDown(fromHandle, { pointerId: 1, clientX: 100 });
    fireEvent.pointerMove(fromHandle, { pointerId: 1, clientX: 300 });
    fireEvent.keyDown(fromHandle, { key: "ArrowRight" });
    expect(setPointerCapture).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("honours the disabled prop", () => {
    const { fromHandle, fromInput } = setup({ disabled: true });
    expect(fromHandle).toHaveAttribute("aria-disabled", "true");
    expect(fromInput).toBeDisabled();
  });
});
