import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { rangesFixture } from "@/test/fixtures";
import { jsonResponse, mockNextNavigation, renderWithProviders } from "@/test/utils";
import { RangeContainer } from "../RangeContainer";

vi.mock("next/navigation", async () => {
  const { navigationMockModule } = await import("@/test/navigation-mock");
  return navigationMockModule;
});

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockImplementation(async () => jsonResponse(rangesFixture));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

async function setup(query: string) {
  const nav = mockNextNavigation(query);
  renderWithProviders(<RangeContainer />);
  const [fromHandle, toHandle] = await screen.findAllByRole("slider");
  const fromInput = screen.getByRole("textbox", { name: "Minimum value" });
  const toInput = screen.getByRole("textbox", { name: "Maximum value" });
  const track = fromHandle.parentElement;
  if (track) track.getBoundingClientRect = () => new DOMRect(100, 0, 400, 44);
  return { nav, fromHandle, toHandle, fromInput, toInput };
}

describe("RangeContainer", () => {
  it("shows the skeleton, then the sliders, with a single fetch", async () => {
    mockNextNavigation("");
    renderWithProviders(<RangeContainer />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading range…");
    expect(await screen.findAllByRole("slider")).toHaveLength(2);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("renders values from the URL", async () => {
    const { fromHandle, toHandle, fromInput, toInput } = await setup(
      "rangeId=100&from=30&to=70",
    );
    expect(fromHandle).toHaveAttribute("aria-valuenow", "30");
    expect(toHandle).toHaveAttribute("aria-valuenow", "70");
    expect(fromInput).toHaveValue("30");
    expect(toInput).toHaveValue("70");
  });

  it("updates live during a drag and writes the URL once on pointerup", async () => {
    const { nav, fromHandle, fromInput } = await setup("rangeId=100");
    fireEvent.pointerDown(fromHandle, { pointerId: 1, clientX: 100 });
    fireEvent.pointerMove(fromHandle, { pointerId: 1, clientX: 200 });
    fireEvent.pointerMove(fromHandle, { pointerId: 1, clientX: 300 });
    expect(fromInput).toHaveValue("50");
    expect(nav.replace).not.toHaveBeenCalled();
    fireEvent.pointerUp(fromHandle, { pointerId: 1, clientX: 300 });
    expect(nav.replace).toHaveBeenCalledTimes(1);
    expect(nav.replace).toHaveBeenCalledWith(
      "/exercise1?rangeId=100&from=50&to=100",
      { scroll: false },
    );
    expect(fromInput).toHaveValue("50");
  });

  it("commits typed values on Enter", async () => {
    const user = userEvent.setup();
    const { nav, fromInput } = await setup("rangeId=100");
    await user.clear(fromInput);
    await user.type(fromInput, "45{Enter}");
    expect(nav.replace).toHaveBeenCalledTimes(1);
    expect(nav.replace).toHaveBeenCalledWith(
      "/exercise1?rangeId=100&from=45&to=100",
      { scroll: false },
    );
    expect(fromInput).toHaveValue("45");
  });

  it("commits every keyboard step", async () => {
    const user = userEvent.setup();
    const { nav, fromHandle } = await setup("rangeId=100");
    act(() => fromHandle.focus());
    await user.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}");
    expect(nav.replace).toHaveBeenCalledTimes(3);
    expect(nav.replace).toHaveBeenLastCalledWith(
      "/exercise1?rangeId=100&from=3&to=100",
      { scroll: false },
    );
    expect(fromHandle).toHaveAttribute("aria-valuenow", "3");
  });

  it("normalises inverted API rows (rangeId=2)", async () => {
    const { fromHandle, toHandle } = await setup("rangeId=2");
    expect(fromHandle).toHaveAttribute("aria-valuemin", "13");
    expect(toHandle).toHaveAttribute("aria-valuemax", "68");
  });

  it("disables the range for degenerate rows (rangeId=59)", async () => {
    const { fromHandle, toHandle, fromInput, toInput } = await setup("rangeId=59");
    expect(fromHandle).toHaveAttribute("aria-disabled", "true");
    expect(toHandle).toHaveAttribute("aria-disabled", "true");
    expect(fromInput).toBeDisabled();
    expect(toInput).toBeDisabled();
  });

  it("falls back to the first row for unknown ids", async () => {
    const { fromHandle, toHandle } = await setup("rangeId=999");
    expect(fromHandle).toHaveAttribute("aria-valuemin", "16");
    expect(toHandle).toHaveAttribute("aria-valuemax", "20");
  });

  it("shows an error and recovers on retry", async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementationOnce(async () => {
      throw new TypeError("Failed to fetch");
    });
    mockNextNavigation("");
    renderWithProviders(<RangeContainer />);
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findAllByRole("slider")).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("follows external URL changes (back/forward)", async () => {
    const { nav, fromHandle, toHandle } = await setup("rangeId=100&from=30&to=70");
    nav.setQuery("rangeId=100&from=10&to=20");
    await waitFor(() => expect(fromHandle).toHaveAttribute("aria-valuenow", "10"));
    expect(toHandle).toHaveAttribute("aria-valuenow", "20");
  });
});
