"use client";

import type { KeyboardEvent, PointerEvent, RefObject } from "react";
import { getHandleLimits, getKeyboardDelta, moveHandle } from "../lib/range-math";
import type {
  HandleLimits,
  RangeBounds,
  RangeConstraints,
  RangeHandleId,
  RangeValue,
} from "../types";
import { useRangeDrag, type UseRangeDragResult } from "./useRangeDrag";

interface UseRangeHandleControlParams {
  readonly handle: RangeHandleId;
  readonly trackRef: RefObject<HTMLElement | null>;
  readonly value: RangeValue;
  readonly bounds: RangeBounds;
  readonly constraints: RangeConstraints;
  readonly disabled: boolean;
  readonly onChange: (next: RangeValue) => void;
  readonly onCommit: (final: RangeValue) => void;
  readonly onInteract: (handle: RangeHandleId) => void;
}

interface UseRangeHandleControlResult {
  readonly isDragging: boolean;
  readonly limits: HandleLimits;
  readonly pointerHandlers: UseRangeDragResult["handlers"];
  readonly onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  /** Moves the handle and reports both a preview and a final value. */
  readonly commitValue: (candidate: number) => void;
}

/** Everything one handle needs: pointer drag, keyboard and direct value entry. */
export function useRangeHandleControl({
  handle,
  trackRef,
  value,
  bounds,
  constraints,
  disabled,
  onChange,
  onCommit,
  onInteract,
}: UseRangeHandleControlParams): UseRangeHandleControlResult {
  const limits = getHandleLimits(handle, value, bounds, constraints);

  const drag = useRangeDrag({
    handle,
    trackRef,
    value,
    bounds,
    constraints,
    disabled,
    onChange: (next) => {
      onInteract(handle);
      onChange(next);
    },
    onCommit,
  });

  const commitValue = (candidate: number) => {
    const next = moveHandle(handle, candidate, value, bounds, constraints);
    if (next === value) return;
    onInteract(handle);
    onChange(next);
    onCommit(next);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (disabled || event.altKey || event.ctrlKey || event.metaKey) return;
    const delta = getKeyboardDelta(event.key, constraints);
    if (delta === null) return;
    event.preventDefault();
    if (delta === "home") commitValue(limits.lo);
    else if (delta === "end") commitValue(limits.hi);
    else commitValue(value[handle] + delta);
  };

  return {
    isDragging: drag.isDragging,
    limits,
    pointerHandlers: {
      ...drag.handlers,
      onPointerDown: (event: PointerEvent<HTMLElement>) => {
        onInteract(handle);
        drag.handlers.onPointerDown(event);
      },
    },
    onKeyDown,
    commitValue,
  };
}
