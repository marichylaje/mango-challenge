import { fireEvent, render, screen } from "@testing-library/react";
import { useRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type {
  RangeBounds,
  RangeConstraints,
  RangeHandleId,
  RangeValue,
} from "../../types";
import { useRangeDrag } from "../useRangeDrag";

const bounds: RangeBounds = { min: 0, max: 100 };
const constraints: RangeConstraints = { step: 1, minGap: 1 };

interface HarnessProps {
  handle: RangeHandleId;
  initial: RangeValue;
  disabled?: boolean;
  onChange: (next: RangeValue) => void;
  onCommit: (final: RangeValue) => void;
}

function Harness({ handle, initial, disabled = false, onChange, onCommit }: HarnessProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(initial);
  const { isDragging, handlers } = useRangeDrag({
    handle,
    trackRef,
    value,
    bounds,
    constraints,
    disabled,
    onChange: (next) => {
      setValue(next);
      onChange(next);
    },
    onCommit,
  });
  return (
    <div ref={trackRef} data-testid="track">
      <div data-testid="handle" data-dragging={isDragging} tabIndex={0} {...handlers} />
    </div>
  );
}

function setup(props: Partial<HarnessProps> & { width?: number } = {}) {
  const onChange = vi.fn();
  const onCommit = vi.fn();
  render(
    <Harness
      handle="from"
      initial={{ from: 20, to: 80 }}
      onChange={onChange}
      onCommit={onCommit}
      {...props}
    />,
  );
  const track = screen.getByTestId("track");
  track.getBoundingClientRect = () => new DOMRect(100, 0, props.width ?? 400, 10);
  const handle = screen.getByTestId("handle");
  const setPointerCapture = vi.spyOn(handle, "setPointerCapture");
  return { onChange, onCommit, handle, setPointerCapture };
}

// from=20 on a 400px track starting at x=100 => centre at x=180.
const FROM_CENTRE = 180;
const TO_CENTRE = 420;

describe("useRangeDrag", () => {
  it("drags and commits once on pointerup", () => {
    const { handle, onChange, onCommit } = setup({ initial: { from: 0, to: 80 } });
    fireEvent.pointerDown(handle, { pointerId: 1, clientX: 100 });
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: 300 });
    expect(onChange).toHaveBeenLastCalledWith({ from: 50, to: 80 });
    fireEvent.pointerUp(handle, { pointerId: 1, clientX: 300 });
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith({ from: 50, to: 80 });
  });

  it("never lets from cross to", () => {
    const { handle, onChange } = setup();
    fireEvent.pointerDown(handle, { pointerId: 1, clientX: FROM_CENTRE });
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: 1000 });
    expect(onChange).toHaveBeenLastCalledWith({ from: 79, to: 80 });
  });

  it("never lets to cross from", () => {
    const { handle, onChange } = setup({ handle: "to" });
    fireEvent.pointerDown(handle, { pointerId: 1, clientX: TO_CENTRE });
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: -1000 });
    expect(onChange).toHaveBeenLastCalledWith({ from: 20, to: 21 });
  });

  it("clamps at the left edge", () => {
    const { handle, onChange } = setup();
    fireEvent.pointerDown(handle, { pointerId: 1, clientX: FROM_CENTRE });
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: -500 });
    expect(onChange).toHaveBeenLastCalledWith({ from: 0, to: 80 });
  });

  it("keeps the grab offset so the handle does not jump", () => {
    const { handle, onChange } = setup();
    fireEvent.pointerDown(handle, { pointerId: 1, clientX: FROM_CENTRE + 5 });
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: FROM_CENTRE + 5 });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: FROM_CENTRE + 5 + 40 });
    expect(onChange).toHaveBeenLastCalledWith({ from: 30, to: 80 });
  });

  it("ignores moves from another pointer", () => {
    const { handle, onChange } = setup();
    fireEvent.pointerDown(handle, { pointerId: 1, clientX: FROM_CENTRE });
    fireEvent.pointerMove(handle, { pointerId: 2, clientX: 300 });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("ignores a second pointer down on the same handle", () => {
    const { handle, setPointerCapture } = setup();
    fireEvent.pointerDown(handle, { pointerId: 1, clientX: FROM_CENTRE });
    fireEvent.pointerDown(handle, { pointerId: 2, clientX: FROM_CENTRE });
    expect(setPointerCapture).toHaveBeenCalledTimes(1);
  });

  it("does nothing when disabled", () => {
    const { handle, setPointerCapture, onChange, onCommit } = setup({ disabled: true });
    fireEvent.pointerDown(handle, { pointerId: 1, clientX: FROM_CENTRE });
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: 300 });
    fireEvent.pointerUp(handle, { pointerId: 1 });
    expect(setPointerCapture).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("ignores non-primary mouse buttons", () => {
    const { handle, setPointerCapture } = setup();
    fireEvent.pointerDown(handle, { pointerId: 1, button: 2, clientX: FROM_CENTRE });
    expect(setPointerCapture).not.toHaveBeenCalled();
  });

  it("commits once on cancel and not again on pointerup", () => {
    const { handle, onCommit } = setup();
    fireEvent.pointerDown(handle, { pointerId: 1, clientX: FROM_CENTRE });
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: 300 });
    fireEvent.pointerCancel(handle, { pointerId: 1 });
    fireEvent.pointerUp(handle, { pointerId: 1 });
    fireEvent.lostPointerCapture(handle, { pointerId: 1 });
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith({ from: 50, to: 80 });
  });

  it("toggles isDragging", () => {
    const { handle } = setup();
    expect(handle).toHaveAttribute("data-dragging", "false");
    fireEvent.pointerDown(handle, { pointerId: 1, clientX: FROM_CENTRE });
    expect(handle).toHaveAttribute("data-dragging", "true");
    fireEvent.pointerUp(handle, { pointerId: 1 });
    expect(handle).toHaveAttribute("data-dragging", "false");
  });

  it("focuses the handle on pointerdown", () => {
    const { handle } = setup();
    fireEvent.pointerDown(handle, { pointerId: 1, clientX: FROM_CENTRE });
    expect(handle).toHaveFocus();
  });

  it("does not change anything when the track has no width", () => {
    const { handle, onChange } = setup({ width: 0 });
    fireEvent.pointerDown(handle, { pointerId: 1, clientX: 100 });
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: 300 });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("commits the latest value after moving back and forth", () => {
    const { handle, onCommit } = setup();
    fireEvent.pointerDown(handle, { pointerId: 1, clientX: FROM_CENTRE });
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: 300 });
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: FROM_CENTRE });
    fireEvent.pointerUp(handle, { pointerId: 1 });
    expect(onCommit).toHaveBeenCalledWith({ from: 20, to: 80 });
  });
});
