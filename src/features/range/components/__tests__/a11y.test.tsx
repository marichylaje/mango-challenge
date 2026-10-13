import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getA11yViolations } from "@/test/axe";
import { Range } from "../Range/Range";
import { RangeError } from "../RangeError/RangeError";
import { RangeSkeleton } from "../RangeSkeleton/RangeSkeleton";

describe("accessibility (axe)", () => {
  it("Range has no violations", async () => {
    const { container } = render(
      <Range
        bounds={{ min: 0, max: 100 }}
        value={{ from: 20, to: 60 }}
        onChange={vi.fn()}
        onCommit={vi.fn()}
      />,
    );
    expect(await getA11yViolations(container)).toEqual([]);
  });

  it("disabled Range has no violations", async () => {
    const { container } = render(
      <Range
        bounds={{ min: 14, max: 14 }}
        value={{ from: 14, to: 14 }}
        onChange={vi.fn()}
        onCommit={vi.fn()}
      />,
    );
    expect(await getA11yViolations(container)).toEqual([]);
  });

  it("RangeSkeleton has no violations", async () => {
    const { container } = render(<RangeSkeleton />);
    expect(await getA11yViolations(container)).toEqual([]);
  });

  it("RangeError has no violations", async () => {
    const { container } = render(<RangeError message="Boom" onRetry={vi.fn()} />);
    expect(await getA11yViolations(container)).toEqual([]);
  });
});
