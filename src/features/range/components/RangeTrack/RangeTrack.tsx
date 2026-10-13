import type { ReactNode, RefObject } from "react";
import type { CssVars } from "../cssVars";
import styles from "./RangeTrack.module.css";

interface RangeTrackProps {
  readonly fromRatio: number;
  readonly toRatio: number;
  readonly trackRef: RefObject<HTMLDivElement | null>;
  readonly children: ReactNode;
}

export function RangeTrack({
  fromRatio,
  toRatio,
  trackRef,
  children,
}: RangeTrackProps) {
  const style: CssVars = {
    "--from-ratio": fromRatio,
    "--to-ratio": toRatio,
  };

  return (
    <div ref={trackRef} className={styles.track} style={style}>
      <div className={styles.rail} />
      <div className={styles.active} />
      {children}
    </div>
  );
}
