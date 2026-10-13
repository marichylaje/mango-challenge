import type { RangeDto } from "@/features/range/types";

export const rangesFixture: readonly RangeDto[] = [
  { id: "1", min: 16, max: 20 },
  { id: "2", min: 68, max: 13 },
  { id: "53", min: 0, max: 17 },
  { id: "59", min: 14, max: 14 },
  { id: "100", min: 0, max: 100 },
];

export const invalidRowsFixture: readonly unknown[] = [
  { id: 3, min: "a", max: 5 },
  null,
  { id: "9" },
];
