import { readFileSync } from "node:fs";
import path from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RangeSkeleton } from "../RangeSkeleton";

const readCss = (relative: string) =>
  readFileSync(path.join(import.meta.dirname, relative), "utf8");

describe("RangeSkeleton", () => {
  it("announces loading once and hides the decorative blocks", () => {
    const { container } = render(<RangeSkeleton />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading range…");
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it("shares the container height token with Range and RangeError", () => {
    const declaration = /min-height:\s*var\(--range-container-height\)/;
    expect(readCss("../RangeSkeleton.module.css")).toMatch(declaration);
    expect(readCss("../../Range/Range.module.css")).toMatch(declaration);
    expect(readCss("../../RangeError/RangeError.module.css")).toMatch(declaration);
  });
});
