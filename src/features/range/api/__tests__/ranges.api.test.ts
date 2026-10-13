import { afterEach, describe, expect, it, vi } from "vitest";
import { invalidRowsFixture, rangesFixture } from "@/test/fixtures";
import { jsonResponse } from "@/test/utils";
import {
  RANGES_ENDPOINT,
  RangesApiError,
  fetchRanges,
  isRangeDto,
} from "../ranges.api";

const fetchMock = vi.fn<typeof fetch>();

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

function stubFetch(response: Response) {
  fetchMock.mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
}

describe("isRangeDto", () => {
  it("accepts a valid row", () => {
    expect(isRangeDto({ id: "1", min: 0, max: 5 })).toBe(true);
  });
  it.each([
    null,
    undefined,
    "x",
    { id: 1, min: 0, max: 5 },
    { id: "1", min: "a", max: 5 },
    { id: "1", min: 0, max: Infinity },
    { id: "1", min: NaN, max: 1 },
    { id: "9" },
  ])("rejects %j", (input) => {
    expect(isRangeDto(input)).toBe(false);
  });
});

describe("fetchRanges", () => {
  it("resolves typed data for a valid body", async () => {
    stubFetch(jsonResponse(rangesFixture));
    await expect(fetchRanges()).resolves.toEqual(rangesFixture);
    expect(fetchMock).toHaveBeenCalledWith(RANGES_ENDPOINT, { signal: undefined });
  });

  it("rejects with RangesApiError carrying the status on HTTP 500", async () => {
    stubFetch(jsonResponse({}, 500));
    const error = await fetchRanges().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(RangesApiError);
    expect(error).toMatchObject({ status: 500 });
  });

  it("rejects when the body is not an array", async () => {
    stubFetch(jsonResponse({}));
    await expect(fetchRanges()).rejects.toBeInstanceOf(RangesApiError);
  });

  it("rejects when the body is not JSON", async () => {
    stubFetch(new Response("<html>", { status: 200 }));
    await expect(fetchRanges()).rejects.toBeInstanceOf(RangesApiError);
  });

  it("rejects an empty array", async () => {
    stubFetch(jsonResponse([]));
    await expect(fetchRanges()).rejects.toBeInstanceOf(RangesApiError);
  });

  it("rejects when no element is valid", async () => {
    stubFetch(jsonResponse(invalidRowsFixture));
    await expect(fetchRanges()).rejects.toBeInstanceOf(RangesApiError);
  });

  it("filters invalid rows and keeps valid ones", async () => {
    stubFetch(jsonResponse([...invalidRowsFixture, { id: "7", min: 1, max: 2 }]));
    await expect(fetchRanges()).resolves.toEqual([{ id: "7", min: 1, max: 2 }]);
  });
});
