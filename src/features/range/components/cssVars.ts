import type { CSSProperties } from "react";

/** `style` prop type that also accepts CSS custom properties. */
export type CssVars = CSSProperties & Record<`--${string}`, string | number>;
