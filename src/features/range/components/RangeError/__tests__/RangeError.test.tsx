import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RangeError } from "../RangeError";

describe("RangeError", () => {
  it("renders an alert with the message", () => {
    render(<RangeError message="Boom" onRetry={vi.fn()} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Boom");
  });

  it("retries on click", async () => {
    const onRetry = vi.fn();
    render(<RangeError message="Boom" onRetry={onRetry} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it.each(["{Enter}", " "])("retries with keyboard key %j", async (key) => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<RangeError message="Boom" onRetry={onRetry} />);
    await user.tab();
    expect(screen.getByRole("button", { name: "Retry" })).toHaveFocus();
    await user.keyboard(key);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
