import { describe, expect, it } from "vitest";
import type { RangeBounds, RangeConstraints, RangeValue } from "../../types";
import {
  clamp,
  clientXToValue,
  getHandleLimits,
  getKeyboardDelta,
  isDegenerate,
  moveHandle,
  normalizeBounds,
  sanitizeRangeValue,
  snapToStep,
  valueToRatio,
} from "../range-math";

const c: RangeConstraints = { step: 1, minGap: 1 };
const bounds: RangeBounds = { min: 0, max: 100 };

describe("normalizeBounds", () => {
  it("swaps inverted bounds", () => {
    expect(normalizeBounds({ min: 68, max: 13 })).toEqual({ min: 13, max: 68 });
  });
  it("keeps equal bounds", () => {
    expect(normalizeBounds({ min: 14, max: 14 })).toEqual({ min: 14, max: 14 });
  });
  it("keeps zero min", () => {
    expect(normalizeBounds({ min: 0, max: 17 })).toEqual({ min: 0, max: 17 });
  });
});

describe("isDegenerate", () => {
  it("is true when the gap is smaller than minGap", () => {
    expect(isDegenerate({ min: 14, max: 14 }, c)).toBe(true);
  });
  it("is false for a usable range", () => {
    expect(isDegenerate({ min: 16, max: 20 }, c)).toBe(false);
  });
  it("is false when the gap equals minGap", () => {
    expect(isDegenerate({ min: 5, max: 6 }, c)).toBe(false);
  });
});

describe("clamp / snapToStep", () => {
  it("clamps on both sides", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(5, 0, 10)).toBe(5);
  });
  it("snaps to integers relative to the origin", () => {
    expect(snapToStep(16.4, 1, 16)).toBe(16);
    expect(snapToStep(16.6, 1, 16)).toBe(17);
    expect(snapToStep(7, 5, 2)).toBe(7);
    expect(snapToStep(0, 1, 0)).toBe(0);
  });
  it("never returns negative zero", () => {
    expect(Object.is(snapToStep(-0.2, 1, 0), 0)).toBe(true);
  });
});

describe("valueToRatio", () => {
  it("maps to 0..1", () => {
    expect(valueToRatio(0, bounds)).toBe(0);
    expect(valueToRatio(50, bounds)).toBe(0.5);
    expect(valueToRatio(100, bounds)).toBe(1);
  });
  it("clamps out-of-range values", () => {
    expect(valueToRatio(-10, bounds)).toBe(0);
    expect(valueToRatio(110, bounds)).toBe(1);
  });
  it("returns 0 for degenerate bounds", () => {
    expect(valueToRatio(14, { min: 14, max: 14 })).toBe(0);
  });
});

describe("clientXToValue", () => {
  const track = { left: 100, width: 400 };
  it("maps edges", () => {
    expect(clientXToValue(100, track, bounds, 1)).toBe(0);
    expect(clientXToValue(500, track, bounds, 1)).toBe(100);
  });
  it("maps the midpoint", () => {
    expect(clientXToValue(300, track, bounds, 1)).toBe(50);
  });
  it("clamps beyond the edges", () => {
    expect(clientXToValue(-500, track, bounds, 1)).toBe(0);
    expect(clientXToValue(5000, track, bounds, 1)).toBe(100);
  });
  it("returns bounds.min when width is 0", () => {
    expect(clientXToValue(300, { left: 100, width: 0 }, bounds, 1)).toBe(0);
  });
  it("rounds .5 deterministically upwards", () => {
    // 0.5 units => 2px with 400px/100 units
    expect(clientXToValue(102, track, bounds, 1)).toBe(1);
    expect(clientXToValue(101.9, track, bounds, 1)).toBe(0);
  });
  it("works with non-zero origin bounds", () => {
    expect(clientXToValue(300, track, { min: 16, max: 20 }, 1)).toBe(18);
  });
});

describe("getHandleLimits", () => {
  const value: RangeValue = { from: 10, to: 20 };
  it("limits from by to - minGap", () => {
    expect(getHandleLimits("from", value, bounds, c)).toEqual({ lo: 0, hi: 19 });
  });
  it("limits to by from + minGap", () => {
    expect(getHandleLimits("to", value, bounds, c)).toEqual({ lo: 11, hi: 100 });
  });
});

describe("moveHandle", () => {
  const value: RangeValue = { from: 10, to: 20 };
  it("never lets from cross to", () => {
    expect(moveHandle("from", 99, value, bounds, c)).toEqual({ from: 19, to: 20 });
  });
  it("never lets to cross from", () => {
    expect(moveHandle("to", 5, value, bounds, c)).toEqual({ from: 10, to: 11 });
  });
  it("clamps to bounds", () => {
    expect(moveHandle("from", -50, value, bounds, c)).toEqual({ from: 0, to: 20 });
    expect(moveHandle("to", 500, value, bounds, c)).toEqual({ from: 10, to: 100 });
  });
  it("returns the same reference when nothing changes", () => {
    expect(moveHandle("from", 10, value, bounds, c)).toBe(value);
    expect(moveHandle("to", 5000, { from: 10, to: 100 }, bounds, c)).toEqual({
      from: 10,
      to: 100,
    });
  });
  it("returns the same reference when clamped to the current value", () => {
    const atLimit: RangeValue = { from: 19, to: 20 };
    expect(moveHandle("from", 50, atLimit, bounds, c)).toBe(atLimit);
  });
  it("returns the same reference when limits are inverted", () => {
    const collapsed: RangeValue = { from: 0, to: 0 };
    expect(moveHandle("from", 5, collapsed, bounds, c)).toBe(collapsed);
  });
});

describe("sanitizeRangeValue", () => {
  it("swaps inverted values", () => {
    expect(sanitizeRangeValue({ from: 90, to: 10 }, bounds, c)).toEqual({
      from: 10,
      to: 90,
    });
  });
  it("clamps out-of-bounds values", () => {
    expect(sanitizeRangeValue({ from: -20, to: 500 }, bounds, c)).toEqual({
      from: 0,
      to: 100,
    });
  });
  it("enforces minGap when equal", () => {
    expect(sanitizeRangeValue({ from: 50, to: 50 }, bounds, c)).toEqual({
      from: 50,
      to: 51,
    });
    expect(sanitizeRangeValue({ from: 200, to: 300 }, bounds, c)).toEqual({
      from: 99,
      to: 100,
    });
  });
  it("snaps to step", () => {
    expect(sanitizeRangeValue({ from: 10.4, to: 20.6 }, bounds, c)).toEqual({
      from: 10,
      to: 21,
    });
  });
  it("returns the full range for degenerate bounds", () => {
    expect(
      sanitizeRangeValue({ from: 1, to: 2 }, { min: 14, max: 14 }, c),
    ).toEqual({ from: 14, to: 14 });
  });
  it("supports negative bounds", () => {
    expect(
      sanitizeRangeValue({ from: -50, to: -10 }, { min: -20, max: 20 }, c),
    ).toEqual({ from: -20, to: -10 });
  });
  it("falls back to bounds for non-finite values", () => {
    expect(sanitizeRangeValue({ from: NaN, to: NaN }, bounds, c)).toEqual({
      from: 0,
      to: 100,
    });
  });
});

describe("getKeyboardDelta", () => {
  it("maps arrows", () => {
    expect(getKeyboardDelta("ArrowRight", c)).toBe(1);
    expect(getKeyboardDelta("ArrowUp", c)).toBe(1);
    expect(getKeyboardDelta("ArrowLeft", c)).toBe(-1);
    expect(getKeyboardDelta("ArrowDown", c)).toBe(-1);
  });
  it("maps pages", () => {
    expect(getKeyboardDelta("PageUp", c)).toBe(10);
    expect(getKeyboardDelta("PageDown", c)).toBe(-10);
    expect(getKeyboardDelta("PageUp", { step: 5, minGap: 5 })).toBe(50);
  });
  it("maps Home/End", () => {
    expect(getKeyboardDelta("Home", c)).toBe("home");
    expect(getKeyboardDelta("End", c)).toBe("end");
  });
  it("returns null for other keys", () => {
    expect(getKeyboardDelta("Tab", c)).toBeNull();
    expect(getKeyboardDelta("a", c)).toBeNull();
  });
});
