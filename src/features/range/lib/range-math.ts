import { LARGE_STEP_MULTIPLIER } from "../constants";
import type {
  HandleLimits,
  RangeBounds,
  RangeConstraints,
  RangeDto,
  RangeHandleId,
  RangeValue,
  TrackGeometry,
} from "../types";

export function normalizeBounds(
  dto: Pick<RangeDto, "min" | "max">,
): RangeBounds {
  return {
    min: Math.min(dto.min, dto.max),
    max: Math.max(dto.min, dto.max),
  };
}

export function isDegenerate(
  bounds: RangeBounds,
  c: RangeConstraints,
): boolean {
  return bounds.max - bounds.min < c.minGap;
}

export function clamp(value: number, lo: number, hi: number): number {
  return Math.min(Math.max(value, lo), hi);
}

export function snapToStep(
  value: number,
  step: number,
  origin: number,
): number {
  return Math.round((value - origin) / step) * step + origin;
}

export function valueToRatio(value: number, bounds: RangeBounds): number {
  const span = bounds.max - bounds.min;
  if (span <= 0) return 0;
  return clamp((value - bounds.min) / span, 0, 1);
}

export function clientXToValue(
  clientX: number,
  track: TrackGeometry,
  bounds: RangeBounds,
  step: number,
): number {
  if (track.width <= 0) return bounds.min;
  const ratio = clamp((clientX - track.left) / track.width, 0, 1);
  const raw = bounds.min + ratio * (bounds.max - bounds.min);
  return clamp(snapToStep(raw, step, bounds.min), bounds.min, bounds.max);
}

export function getHandleLimits(
  handle: RangeHandleId,
  value: RangeValue,
  bounds: RangeBounds,
  c: RangeConstraints,
): HandleLimits {
  return handle === "from"
    ? { lo: bounds.min, hi: value.to - c.minGap }
    : { lo: value.from + c.minGap, hi: bounds.max };
}

export function moveHandle(
  handle: RangeHandleId,
  candidate: number,
  value: RangeValue,
  bounds: RangeBounds,
  c: RangeConstraints,
): RangeValue {
  const { lo, hi } = getHandleLimits(handle, value, bounds, c);
  if (lo > hi) return value;
  const next = clamp(candidate, lo, hi);
  if (next === value[handle]) return value;
  return handle === "from" ? { from: next, to: value.to } : { from: value.from, to: next };
}

export function sanitizeRangeValue(
  value: RangeValue,
  bounds: RangeBounds,
  c: RangeConstraints,
): RangeValue {
  if (isDegenerate(bounds, c)) return { from: bounds.min, to: bounds.max };

  const rawFrom = Number.isFinite(value.from) ? value.from : bounds.min;
  const rawTo = Number.isFinite(value.to) ? value.to : bounds.max;
  const lowest = Math.min(rawFrom, rawTo);
  const highest = Math.max(rawFrom, rawTo);

  const snap = (v: number) =>
    clamp(snapToStep(v, c.step, bounds.min), bounds.min, bounds.max);
  const from = clamp(snap(lowest), bounds.min, bounds.max - c.minGap);
  const to = clamp(snap(highest), from + c.minGap, bounds.max);
  return { from, to };
}

export function getKeyboardDelta(
  key: string,
  c: RangeConstraints,
): number | "home" | "end" | null {
  switch (key) {
    case "ArrowRight":
    case "ArrowUp":
      return c.step;
    case "ArrowLeft":
    case "ArrowDown":
      return -c.step;
    case "PageUp":
      return c.step * LARGE_STEP_MULTIPLIER;
    case "PageDown":
      return -c.step * LARGE_STEP_MULTIPLIER;
    case "Home":
      return "home";
    case "End":
      return "end";
    default:
      return null;
  }
}
