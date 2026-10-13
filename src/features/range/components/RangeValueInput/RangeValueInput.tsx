"use client";

import { useEditableNumber } from "../../hooks/useEditableNumber";
import styles from "./RangeValueInput.module.css";

interface RangeValueInputProps {
  readonly id: string;
  readonly label: string;
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly disabled: boolean;
  readonly onCommit: (next: number) => void;
}

export function RangeValueInput({
  id,
  label,
  value,
  min,
  max,
  disabled,
  onCommit,
}: RangeValueInputProps) {
  const { inputProps } = useEditableNumber({ value, min, max, onCommit });

  return (
    <div className={styles.field}>
      <label htmlFor={id} className="srOnly">
        {label}
      </label>
      <input
        id={id}
        className={styles.input}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        disabled={disabled}
        {...inputProps}
      />
    </div>
  );
}
