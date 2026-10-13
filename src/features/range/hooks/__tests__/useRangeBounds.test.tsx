import { waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { rangesFixture } from "@/test/fixtures";
import { jsonResponse, renderHookWithProviders } from "@/test/utils";
import { useRangeBounds } from "../useRangeBounds";

const fetchMock = vi.fn<typeof fetch>();

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

function setup(rangeId: string) {
  vi.stubGlobal("fetch", fetchMock);
  return renderHookWithProviders(() => useRangeBounds(rangeId));
}

describe("useRangeBounds", () => {
  it("goes from pending to success", async () => {
    fetchMock.mockImplementation(async () => jsonResponse(rangesFixture));
    const { result } = setup("1");
    expect(result.current.status).toBe("pending");
    expect(result.current.bounds).toBeUndefined();
    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(result.current.bounds).toEqual({ min: 16, max: 20 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("normalises inverted rows", async () => {
    fetchMock.mockImplementation(async () => jsonResponse(rangesFixture));
    const { result } = setup("2");
    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(result.current.bounds).toEqual({ min: 13, max: 68 });
  });

  it("falls back to the first row for unknown ids", async () => {
    fetchMock.mockImplementation(async () => jsonResponse(rangesFixture));
    const { result } = setup("999");
    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(result.current.bounds).toEqual({ min: 16, max: 20 });
  });

  it("keeps min = 0", async () => {
    fetchMock.mockImplementation(async () => jsonResponse(rangesFixture));
    const { result } = setup("53");
    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(result.current.bounds?.min).toBe(0);
  });

  it("exposes the error and refetches on demand", async () => {
    fetchMock.mockImplementation(async () => jsonResponse({}, 500));
    const { result } = setup("1");
    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error).toBeInstanceOf(Error);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fetchMock.mockImplementation(async () => jsonResponse(rangesFixture));
    result.current.refetch();
    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
