import type { CSSProperties } from "react";

import { cn } from "../../lib/utils";

type BorderBeamProps = {
  className?: string;
  /** Beam length in pixels (visual width of the trailing gradient). */
  size?: number;
  /**
   * Corner radius of the beam's *travel path*, in pixels.
   * Set this to (roughly) match the parent's `border-radius` so the beam follows the visible border.
   * Magic UI's original component reused `size` for this — that breaks on cards shorter than `2 × size`.
   */
  pathRadius?: number;
  /** Animation duration in seconds. */
  duration?: number;
  /** Beam thickness in pixels. */
  borderWidth?: number;
  /** 0–100 — initial offset along the path (lets you stagger multiple beams). */
  anchor?: number;
  /** Gradient start color. */
  colorFrom?: string;
  /** Gradient end color. */
  colorTo?: string;
  /** Negative seconds shift the start of the loop (lets multiple beams desynchronize). */
  delay?: number;
};

export function BorderBeam({
  className,
  size = 100,
  pathRadius = 8,
  duration = 8,
  borderWidth = 1.5,
  anchor = 90,
  colorFrom = "#FECD08",
  colorTo  = "#FFE067",
  delay = 0,
}: BorderBeamProps) {
  return (
    <div
      style={
        {
          "--size": size,
          "--path-radius": pathRadius,
          "--duration": duration,
          "--anchor": anchor,
          "--border-width": borderWidth,
          "--color-from": colorFrom,
          "--color-to": colorTo,
          "--delay": `-${delay}s`,
        } as CSSProperties
      }
      className={cn(
        // Container traces the parent's border via a transparent border + masking.
        "pointer-events-none absolute inset-0 rounded-[inherit]",
        "[border:calc(var(--border-width)*1px)_solid_transparent]",

        // Mask so only the border (not the inside) is visible.
        "![mask-clip:padding-box,border-box] ![mask-composite:intersect]",
        "[mask:linear-gradient(transparent,transparent),linear-gradient(white,white)]",

        // The beam itself: a rectangular gradient that travels around the parent's border via offset-path.
        "after:absolute after:aspect-square after:w-[calc(var(--size)*1px)]",
        "after:animate-border-beam after:[animation-delay:var(--delay)]",
        "after:[background:linear-gradient(to_left,var(--color-from),var(--color-to),transparent)]",
        "after:[offset-anchor:calc(var(--anchor)*1%)_50%]",
        // Use a small fixed corner radius for the path so it follows a rectangle, not a stadium.
        "after:[offset-path:rect(0_auto_auto_0_round_calc(var(--path-radius)*1px))]",
        className,
      )}
    />
  );
}
