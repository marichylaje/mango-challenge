import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { mockNextNavigation } from "@/test/utils";
import type { RangeBounds, RangeConstraints } from "../../types";
import { useRangeUrlState } from "../useRangeUrlState";

vi.mock("next/navigation", async () => {
  const { navigationMockModule } = await import("@/test/navigation-mock");
  return navigationMockModule;
});

const bounds: RangeBounds = { min: 0, max: 100 };
const constraints: RangeConstraints = { step: 1, minGap: 1 };

function setup(query: string) {
  const nav = mockNextNavigation(query);
  const hook = renderHook(() => useRangeUrlState(bounds, constraints));
  return { nav, ...hook };
}

describe("useRangeUrlState", () => {
  it("reads from/to from the URL", () => {
    const { result } = setup("from=30&to=60");
    expect(result.current.committedValue).toEqual({ from: 30, to: 60 });
    expect(result.current.rangeId).toBe("1");
  });

  it("defaults to the full range without touching the URL", () => {
    const { result, nav } = setup("");
    expect(result.current.committedValue).toEqual({ from: 0, to: 100 });
    expect(nav.replace).not.toHaveBeenCalled();
  });

  it("sanitises invalid params without rewriting the URL", () => {
    const { result, nav } = setup("from=200&to=-5");
    expect(result.current.committedValue).toEqual({ from: 0, to: 100 });
    expect(nav.replace).not.toHaveBeenCalled();
  });

  it("exposes rangeId from the URL", () => {
    const { result } = setup("rangeId=3");
    expect(result.current.rangeId).toBe("3");
  });

  it("commit replaces the URL preserving rangeId", () => {
    const { result, nav } = setup("rangeId=3");
    act(() => result.current.commit({ from: 10, to: 20 }));
    expect(nav.replace).toHaveBeenCalledTimes(1);
    expect(nav.replace).toHaveBeenCalledWith(
      "/exercise1?rangeId=3&from=10&to=20",
      { scroll: false },
    );
    expect(result.current.committedValue).toEqual({ from: 10, to: 20 });
  });

  it("commit builds /exercise1?from=10&to=20 without extra params", () => {
    const { result, nav } = setup("");
    act(() => result.current.commit({ from: 10, to: 20 }));
    expect(nav.replace).toHaveBeenCalledWith("/exercise1?from=10&to=20", {
      scroll: false,
    });
  });

  it("commit is a no-op for the identical value", () => {
    const { result, nav } = setup("from=10&to=20");
    act(() => result.current.commit({ from: 10, to: 20 }));
    expect(nav.replace).not.toHaveBeenCalled();
  });

  it("follows external URL changes (back/forward)", () => {
    const { result, nav } = setup("from=10&to=20");
    nav.setQuery("from=40&to=50");
    expect(result.current.committedValue).toEqual({ from: 40, to: 50 });
  });
});
