"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DEFAULT_RANGE_ID, URL_PARAMS } from "../constants";
import { readRangeValue, writeRangeValue } from "../lib/range-url";
import type { RangeBounds, RangeConstraints, RangeValue } from "../types";

export interface UseRangeUrlStateResult {
  readonly rangeId: string;
  readonly committedValue: RangeValue;
  readonly commit: (next: RangeValue) => void;
}

/**
 * Maps the URL search params to the committed `RangeValue`.
 * Uses `useSearchParams()`, so it must render inside a `<Suspense>` boundary.
 */
export function useRangeUrlState(
  bounds: RangeBounds,
  constraints: RangeConstraints,
): UseRangeUrlStateResult {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const rangeId = searchParams.get(URL_PARAMS.rangeId) ?? DEFAULT_RANGE_ID;
  const committedValue = readRangeValue(searchParams, bounds, constraints);

  const commit = (next: RangeValue) => {
    if (next.from === committedValue.from && next.to === committedValue.to) {
      return;
    }
    const params = writeRangeValue(
      new URLSearchParams(searchParams.toString()),
      next,
      bounds,
    );
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return { rangeId, committedValue, commit };
}
