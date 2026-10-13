import { describe, expect, it } from "vitest";
import type { RangeBounds, RangeConstraints } from "../../types";
import {
  parseIntegerParam,
  readRangeValue,
  writeRangeValue,
} from "../range-url";

const c: RangeConstraints = { step: 1, minGap: 1 };
const bounds: RangeBounds = { min: 0, max: 100 };
const read = (query: string, b: RangeBounds = bounds) =>
  readRangeValue(new URLSearchParams(query), b, c);

describe("parseIntegerParam", () => {
  it("parses strict integers", () => {
    expect(parseIntegerParam("12")).toBe(12);
    expect(parseIntegerParam("-5")).toBe(-5);
    expect(parseIntegerParam("0")).toBe(0);
  });
  it.each(["", "1.5", "1e3", " 3", "3 ", "abc", "+4", "--1"])(
    "rejects %j",
    (raw) => {
      expect(parseIntegerParam(raw)).toBeNull();
    },
  );
  it("rejects null and unsafe integers", () => {
    expect(parseIntegerParam(null)).toBeNull();
    expect(parseIntegerParam("99999999999999999999")).toBeNull();
  });
});

describe("readRangeValue", () => {
  it("reads valid params", () => {
    expect(read("from=30&to=60")).toEqual({ from: 30, to: 60 });
  });
  it("defaults to the full range when params are missing", () => {
    expect(read("")).toEqual({ from: 0, to: 100 });
  });
  it("falls back for invalid params", () => {
    expect(read("from=abc")).toEqual({ from: 0, to: 100 });
    expect(read("from=")).toEqual({ from: 0, to: 100 });
    expect(read("from=1.5")).toEqual({ from: 0, to: 100 });
  });
  it("treats 0 as a real value", () => {
    expect(read("from=0&to=0")).toEqual({ from: 0, to: 1 });
  });
  it("sanitises out-of-bounds and inverted values", () => {
    expect(read("from=200&to=-5")).toEqual({ from: 0, to: 100 });
    expect(read("from=80&to=20")).toEqual({ from: 20, to: 80 });
  });
  it("works for bounds not starting at 0", () => {
    expect(read("from=1&to=2", { min: 13, max: 68 })).toEqual({
      from: 13,
      to: 14,
    });
  });
});

describe("writeRangeValue", () => {
  it("sets from/to and preserves other params", () => {
    const input = new URLSearchParams("rangeId=3&foo=bar");
    const out = writeRangeValue(input, { from: 10, to: 20 }, bounds);
    expect(out.toString()).toBe("rangeId=3&foo=bar&from=10&to=20");
  });
  it("does not mutate the input", () => {
    const input = new URLSearchParams("from=1&to=2");
    const out = writeRangeValue(input, { from: 10, to: 20 }, bounds);
    expect(out).not.toBe(input);
    expect(input.toString()).toBe("from=1&to=2");
  });
  it("overwrites existing values", () => {
    const out = writeRangeValue(
      new URLSearchParams("from=1&to=2"),
      { from: 10, to: 20 },
      bounds,
    );
    expect(out.get("from")).toBe("10");
    expect(out.get("to")).toBe("20");
  });
  it("always writes both params, even at the extremes", () => {
    const out = writeRangeValue(new URLSearchParams(), { from: 0, to: 100 }, bounds);
    expect(out.toString()).toBe("from=0&to=100");
  });
});
