"use client";

import type { KeyboardEventHandler } from "react";
import type { UseRangeDragResult } from "../../hooks/useRangeDrag";
import type { RangeHandleId } from "../../types";
import type { CssVars } from "../cssVars";
import styles from "./RangeHandle.module.css";

interface RangeHandleProps {
  readonly handle: RangeHandleId;
  readonly ratio: number;
  readonly value: number;
  readonly ariaMin: number;
  readonly ariaMax: number;
  readonly label: string;
  readonly valueText: string;
  readonly isDragging: boolean;
  readonly disabled: boolean;
  readonly pointerHandlers: UseRangeDragResult["handlers"];
  readonly onKeyDown: KeyboardEventHandler<HTMLDivElement>;
  readonly isActive: boolean;
}

export function RangeHandle({
  handle,
  ratio,
  value,
  ariaMin,
  ariaMax,
  label,
  valueText,
  isDragging,
  disabled,
  pointerHandlers,
  onKeyDown,
  isActive,
}: RangeHandleProps) {
  const style: CssVars = { "--ratio": ratio };

  return (
    <div
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-orientation="horizontal"
      aria-valuemin={ariaMin}
      aria-valuemax={ariaMax}
      aria-valuenow={value}
      aria-valuetext={valueText}
      aria-label={label}
      aria-disabled={disabled}
      data-handle={handle}
      data-dragging={isDragging}
      data-active={isActive}
      className={styles.handle}
      style={style}
      onKeyDown={onKeyDown}
      {...pointerHandlers}
    />
  );
}
