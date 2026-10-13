"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { DEFAULT_RANGE_ID, URL_PARAMS } from "../../constants";
import { useRangeBounds } from "../../hooks/useRangeBounds";
import { useRangeUrlState } from "../../hooks/useRangeUrlState";
import { resolveConstraints } from "../../lib/range-math";
import type { RangeBounds, RangeValue } from "../../types";
import { Range } from "../Range/Range";
import { RangeError } from "../RangeError/RangeError";
import { RangeSkeleton } from "../RangeSkeleton/RangeSkeleton";

const CONSTRAINTS = resolveConstraints();

const isSameValue = (a: RangeValue, b: RangeValue) =>
  a.from === b.from && a.to === b.to;

/** Wires API + URL + draft state into `<Range />`. Must render inside `<Suspense>`. */
export function RangeContainer() {
  const searchParams = useSearchParams();
  const rangeId = searchParams.get(URL_PARAMS.rangeId) ?? DEFAULT_RANGE_ID;
  const { bounds, status, error, refetch } = useRangeBounds(rangeId);

  if (status === "pending") return <RangeSkeleton />;
  if (status === "error" || !bounds) {
    return (
      <RangeError
        message={error?.message ?? "Unable to load the range."}
        onRetry={refetch}
      />
    );
  }
  return <RangeConnected bounds={bounds} />;
}

function RangeConnected({ bounds }: { readonly bounds: RangeBounds }) {
  const { committedValue, commit } = useRangeUrlState(bounds, CONSTRAINTS);
  const [draft, setDraft] = useState<RangeValue | null>(null);
  const [seenCommitted, setSeenCommitted] = useState(committedValue);

  // Any URL change (our own commit landing, or back/forward) supersedes the draft.
  if (!isSameValue(seenCommitted, committedValue)) {
    setSeenCommitted(committedValue);
    setDraft(null);
  }

  const handleCommit = (final: RangeValue) => {
    // Keep showing the final value until the URL catches up (avoids a flash of the old one).
    setDraft(final);
    commit(final);
  };

  return (
    <Range
      bounds={bounds}
      value={draft ?? committedValue}
      constraints={CONSTRAINTS}
      onChange={setDraft}
      onCommit={handleCommit}
    />
  );
}
