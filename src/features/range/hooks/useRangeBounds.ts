import { useQuery } from "@tanstack/react-query";
import { fetchRanges } from "../api/ranges.api";
import { rangesKeys } from "../api/ranges.keys";
import { normalizeBounds } from "../lib/range-math";
import type { RangeBounds, RangeDto } from "../types";

export interface UseRangeBoundsResult {
  readonly bounds: RangeBounds | undefined;
  readonly status: "pending" | "error" | "success";
  readonly error: Error | null;
  readonly refetch: () => void;
}

const STALE_TIME_MS = 5 * 60_000;

function selectBounds(ranges: readonly RangeDto[], rangeId: string): RangeBounds {
  const active = ranges.find((range) => range.id === rangeId) ?? ranges[0];
  return normalizeBounds(active);
}

export function useRangeBounds(rangeId: string): UseRangeBoundsResult {
  const query = useQuery({
    queryKey: rangesKeys.list(),
    queryFn: ({ signal }) => fetchRanges(signal),
    staleTime: STALE_TIME_MS,
    select: (ranges) => selectBounds(ranges, rangeId),
  });

  return {
    bounds: query.data,
    status: query.status,
    error: query.error,
    refetch: () => {
      void query.refetch();
    },
  };
}
