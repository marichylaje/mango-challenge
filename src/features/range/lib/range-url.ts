import { URL_PARAMS } from "../constants";
import type { RangeBounds, RangeConstraints, RangeValue } from "../types";
import { clamp, sanitizeRangeValue } from "./range-math";

/** Minimal shape shared by `URLSearchParams` and Next's `ReadonlyURLSearchParams`. */
export interface ParamReader {
  get(name: string): string | null;
}

const INTEGER_PATTERN = /^-?\d+$/;

export function parseIntegerParam(raw: string | null): number | null {
  if (raw === null || !INTEGER_PATTERN.test(raw)) return null;
  const parsed = Number(raw);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export function readRangeValue(
  params: ParamReader,
  bounds: RangeBounds,
  c: RangeConstraints,
): RangeValue {
  const from = parseIntegerParam(params.get(URL_PARAMS.from)) ?? bounds.min;
  const to = parseIntegerParam(params.get(URL_PARAMS.to)) ?? bounds.max;
  return sanitizeRangeValue({ from, to }, bounds, c);
}

export function writeRangeValue(
  params: URLSearchParams,
  value: RangeValue,
  bounds: RangeBounds,
): URLSearchParams {
  const next = new URLSearchParams(params);
  next.set(URL_PARAMS.from, String(clamp(value.from, bounds.min, bounds.max)));
  next.set(URL_PARAMS.to, String(clamp(value.to, bounds.min, bounds.max)));
  return next;
}
