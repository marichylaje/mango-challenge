"use client";

import { useRef, useState } from "react";
import type { PointerEventHandler, RefObject } from "react";
import { clientXToValue, moveHandle, valueToRatio } from "../lib/range-math";
import type {
  RangeBounds,
  RangeConstraints,
  RangeHandleId,
  RangeValue,
} from "../types";

export interface UseRangeDragParams {
  readonly handle: RangeHandleId;
  readonly trackRef: RefObject<HTMLElement | null>;
  readonly value: RangeValue;
  readonly bounds: RangeBounds;
  readonly constraints: RangeConstraints;
  readonly disabled: boolean;
  readonly onChange: (next: RangeValue) => void;
  readonly onCommit: (final: RangeValue) => void;
}

export interface UseRangeDragResult {
  readonly isDragging: boolean;
  readonly handlers: {
    readonly onPointerDown: PointerEventHandler<HTMLElement>;
    readonly onPointerMove: PointerEventHandler<HTMLElement>;
    readonly onPointerUp: PointerEventHandler<HTMLElement>;
    readonly onPointerCancel: PointerEventHandler<HTMLElement>;
    readonly onLostPointerCapture: PointerEventHandler<HTMLElement>;
  };
}

/** Pointer Events drag logic for ONE handle. Relies on pointer capture, so no window listeners. */
export function useRangeDrag({
  handle,
  trackRef,
  value,
  bounds,
  constraints,
  disabled,
  onChange,
  onCommit,
}: UseRangeDragParams): UseRangeDragResult {
  const [isDragging, setIsDragging] = useState(false);
  const pointerIdRef = useRef<number | null>(null);
  // Distance in px between the grab point and the handle centre, so the handle never jumps.
  const grabOffsetRef = useRef(0);
  // Last value of this handle emitted during the drag (props may lag behind pointer events).
  const lastOwnValueRef = useRef<number | null>(null);

  const withOwnValue = (own: number | null): RangeValue =>
    own === null ? value : { ...value, [handle]: own };

  const finish = (event: Parameters<PointerEventHandler<HTMLElement>>[0]) => {
    if (pointerIdRef.current === null || event.pointerId !== pointerIdRef.current) {
      return;
    }
    const pointerId = pointerIdRef.current;
    pointerIdRef.current = null;
    if (event.currentTarget.hasPointerCapture(pointerId)) {
      event.currentTarget.releasePointerCapture(pointerId);
    }
    const final = withOwnValue(lastOwnValueRef.current);
    lastOwnValueRef.current = null;
    setIsDragging(false);
    onCommit(final);
  };

  const onPointerDown: PointerEventHandler<HTMLElement> = (event) => {
    if (disabled || pointerIdRef.current !== null) return;
    if (event.pointerType !== "touch" && event.button !== 0) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.focus();

    const rect = trackRef.current?.getBoundingClientRect();
    const centre = rect
      ? rect.left + valueToRatio(value[handle], bounds) * rect.width
      : event.clientX;

    pointerIdRef.current = event.pointerId;
    grabOffsetRef.current = event.clientX - centre;
    lastOwnValueRef.current = value[handle];
    setIsDragging(true);
  };

  const onPointerMove: PointerEventHandler<HTMLElement> = (event) => {
    if (pointerIdRef.current === null || event.pointerId !== pointerIdRef.current) {
      return;
    }
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0) return;

    const candidate = clientXToValue(
      event.clientX - grabOffsetRef.current,
      { left: rect.left, width: rect.width },
      bounds,
      constraints.step,
    );
    const current = withOwnValue(lastOwnValueRef.current);
    const next = moveHandle(handle, candidate, current, bounds, constraints);
    if (next === current) return;

    lastOwnValueRef.current = next[handle];
    onChange(next);
  };

  return {
    isDragging,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: finish,
      onPointerCancel: finish,
      onLostPointerCapture: finish,
    },
  };
}
