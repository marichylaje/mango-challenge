"use client";

import { useState } from "react";
import type { ChangeEvent, FocusEvent, KeyboardEvent } from "react";
import { clamp } from "../lib/range-math";
import { parseIntegerParam } from "../lib/range-url";

interface UseEditableNumberArgs {
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly onCommit: (next: number) => void;
}

interface EditableNumberInputProps {
  readonly value: string;
  readonly onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  readonly onFocus: (event: FocusEvent<HTMLInputElement>) => void;
  readonly onBlur: () => void;
  readonly onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  readonly "aria-invalid": true | undefined;
}

/** Draft-string editing for a numeric input; commits on Enter/blur, reverts on Escape. */
export function useEditableNumber({
  value,
  min,
  max,
  onCommit,
}: UseEditableNumberArgs): { inputProps: EditableNumberInputProps } {
  // `null` means "not editing": the committed value is displayed.
  const [draft, setDraft] = useState<string | null>(null);

  const isInvalid =
    draft !== null && draft.trim() !== "" && parseIntegerParam(draft.trim()) === null;

  const commitDraft = () => {
    const parsed = draft === null ? null : parseIntegerParam(draft.trim());
    setDraft(null);
    if (parsed === null) return;
    const next = clamp(parsed, min, max);
    if (next !== value) onCommit(next);
  };

  return {
    inputProps: {
      value: draft ?? String(value),
      onChange: (event) => setDraft(event.target.value),
      onFocus: (event) => event.currentTarget.select(),
      onBlur: commitDraft,
      onKeyDown: (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          commitDraft();
        } else if (event.key === "Escape") {
          event.preventDefault();
          setDraft(null);
        }
      },
      "aria-invalid": isInvalid ? true : undefined,
    },
  };
}
