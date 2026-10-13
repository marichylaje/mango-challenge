export interface RangeDto {
  readonly id: string;
  readonly min: number;
  readonly max: number;
}

export interface RangeBounds {
  readonly min: number;
  readonly max: number;
}

export interface RangeValue {
  readonly from: number;
  readonly to: number;
}

export type RangeHandleId = "from" | "to";

export interface RangeConstraints {
  readonly step: number;
  readonly minGap: number;
}

export interface HandleLimits {
  readonly lo: number;
  readonly hi: number;
}

/** Pixel geometry of the track, from `getBoundingClientRect`. */
export interface TrackGeometry {
  readonly left: number;
  readonly width: number;
}
