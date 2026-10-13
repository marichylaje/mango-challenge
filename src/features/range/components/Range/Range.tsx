"use client";

import { useId, useRef, useState } from "react";
import { useRangeHandleControl } from "../../hooks/useRangeHandleControl";
import {
  getTopHandle,
  isDegenerate,
  resolveConstraints,
  valueToRatio,
} from "../../lib/range-math";
import type {
  RangeBounds,
  RangeConstraints,
  RangeHandleId,
  RangeValue,
} from "../../types";
import { RangeHandle } from "../RangeHandle/RangeHandle";
import { RangeTrack } from "../RangeTrack/RangeTrack";
import { RangeValueInput } from "../RangeValueInput/RangeValueInput";
import styles from "./Range.module.css";

interface RangeProps {
  readonly bounds: RangeBounds;
  readonly value: RangeValue;
  readonly constraints?: Partial<RangeConstraints>;
  readonly disabled?: boolean;
  readonly onChange: (next: RangeValue) => void;
  readonly onCommit: (next: RangeValue) => void;
  readonly idPrefix?: string;
}

const HANDLE_LABELS: Record<RangeHandleId, string> = {
  from: "Minimum value",
  to: "Maximum value",
};

export function Range({
  bounds,
  value,
  constraints,
  disabled = false,
  onChange,
  onCommit,
  idPrefix,
}: RangeProps) {
  const resolved = resolveConstraints(constraints);
  const generatedId = useId();
  const prefix = idPrefix ?? generatedId;
  const trackRef = useRef<HTMLDivElement>(null);
  const [lastActive, setLastActive] = useState<RangeHandleId>("to");
  const isDisabled = disabled || isDegenerate(bounds, resolved);

  const shared = {
    trackRef,
    value,
    bounds,
    constraints: resolved,
    disabled: isDisabled,
    onChange,
    onCommit,
    onInteract: setLastActive,
  };
  const controls = {
    from: useRangeHandleControl({ handle: "from", ...shared }),
    to: useRangeHandleControl({ handle: "to", ...shared }),
  };
  const topHandle = getTopHandle(lastActive, value, bounds);
  const isDragging = controls.from.isDragging || controls.to.isDragging;

  const renderInput = (handle: RangeHandleId) => (
    <RangeValueInput
      id={`${prefix}-${handle}`}
      label={HANDLE_LABELS[handle]}
      value={value[handle]}
      min={controls[handle].limits.lo}
      max={controls[handle].limits.hi}
      disabled={isDisabled}
      onCommit={controls[handle].commitValue}
    />
  );

  const renderHandle = (handle: RangeHandleId) => (
    <RangeHandle
      handle={handle}
      ratio={valueToRatio(value[handle], bounds)}
      value={value[handle]}
      ariaMin={controls[handle].limits.lo}
      ariaMax={controls[handle].limits.hi}
      label={HANDLE_LABELS[handle]}
      valueText={String(value[handle])}
      isDragging={controls[handle].isDragging}
      disabled={isDisabled}
      pointerHandlers={controls[handle].pointerHandlers}
      onKeyDown={controls[handle].onKeyDown}
      isActive={topHandle === handle}
    />
  );

  return (
    <div
      role="group"
      aria-label="Range selection"
      className={styles.root}
      data-dragging={isDragging}
      data-disabled={isDisabled}
    >
      {renderInput("from")}
      <RangeTrack
        fromRatio={valueToRatio(value.from, bounds)}
        toRatio={valueToRatio(value.to, bounds)}
        trackRef={trackRef}
      >
        {renderHandle("from")}
        {renderHandle("to")}
      </RangeTrack>
      {renderInput("to")}
    </div>
  );
}
