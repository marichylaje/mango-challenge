import type { RangeDto } from "../types";

export const RANGES_ENDPOINT =
  "https://6ace7995f338359cf1c38987.mockapi.io/api/v1/ranges";

export class RangesApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "RangesApiError";
  }
}

export function isRangeDto(input: unknown): input is RangeDto {
  if (typeof input !== "object" || input === null) return false;
  if (!("id" in input && "min" in input && "max" in input)) return false;
  const { id, min, max } = input;
  return (
    typeof id === "string" &&
    typeof min === "number" &&
    Number.isFinite(min) &&
    typeof max === "number" &&
    Number.isFinite(max)
  );
}

export async function fetchRanges(
  signal?: AbortSignal,
): Promise<readonly RangeDto[]> {
  const response = await fetch(RANGES_ENDPOINT, { signal });
  if (!response.ok) {
    throw new RangesApiError(
      `Failed to load ranges (HTTP ${response.status})`,
      response.status,
    );
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new RangesApiError("Ranges response is not valid JSON");
  }

  if (!Array.isArray(body)) {
    throw new RangesApiError("Ranges response is not a list");
  }
  const ranges = body.filter(isRangeDto);
  if (ranges.length === 0) {
    throw new RangesApiError("Ranges response has no valid items");
  }
  return ranges;
}
