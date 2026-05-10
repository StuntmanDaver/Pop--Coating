import type { CSSProperties, ComponentPropsWithoutRef } from "react";

import { cn } from "../../lib/utils";

type AnimatedShinyTextProps = ComponentPropsWithoutRef<"span"> & {
  /**
   * The base text color shown when the shimmer peak isn't passing through.
   *
   * REQUIRED to be an explicit color (not `currentColor`). The element sets `color: transparent`
   * to enable the bg-clip-text mask, which causes `currentColor` to resolve to transparent
   * inside the gradient — making the text invisible. Pass the tone's resolved color here.
   */
  baseColor: string;
  /**
   * Color of the highlight band as it sweeps across the text.
   * Default `rgba(255,255,255,0.95)` is appropriate for text on dark backgrounds.
   * For dark text on light backgrounds, pass a contrasting color (e.g. brand accent)
   * so the peak stays visible against the page surface.
   */
  shimmerColor?: string;
};

/**
 * A subtle metallic shimmer that sweeps across the wrapped text.
 *
 * Transparency is applied via the `.shiny-text-mask` class (see globals.css), which is
 * gated behind `@supports (background-clip: text)` — if a browser ever fails to apply
 * the gradient, the text falls back to `currentColor` and remains readable.
 *
 * Honors `prefers-reduced-motion: reduce` via the global media query that dampens
 * animations to ~0.01ms — the gradient stays in place but doesn't move.
 */
export function AnimatedShinyText({
  children,
  className,
  baseColor,
  shimmerColor = "rgba(255,255,255,0.95)",
  style,
  ...rest
}: AnimatedShinyTextProps) {
  return (
    <span
      style={
        {
          "--shiny-base": baseColor,
          "--shiny-peak": shimmerColor,
          ...style,
        } as CSSProperties
      }
      className={cn(
        "shiny-text-mask relative inline-block",
        // Narrow highlight band (~6% of gradient) sweeps across solid `--shiny-base` color.
        // We *cannot* use `currentColor` here: `.shiny-text-mask` sets `color: transparent`
        // for the bg-clip-text trick, so `currentColor` would resolve to transparent and
        // the text would be invisible everywhere outside the peak.
        "bg-[image:linear-gradient(110deg,var(--shiny-base)_0%,var(--shiny-base)_47%,var(--shiny-peak)_50%,var(--shiny-base)_53%,var(--shiny-base)_100%)]",
        // bg-size 300% × 100% means the text sees ~1/3 of the gradient at any time —
        // combined with a 6% peak band, only ~18% of the text shows the peak color at the
        // single moment the sweep crosses it.
        "bg-no-repeat [background-size:300%_100%] [background-position:0%_0%]",
        "animate-shiny-text",
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
