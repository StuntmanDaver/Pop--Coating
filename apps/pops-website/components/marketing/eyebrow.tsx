import { forwardRef, type ComponentPropsWithoutRef } from "react";

import { AnimatedShinyText } from "../magicui/animated-shiny-text";

type EyebrowTone = "yellow" | "ink" | "dark";

type EyebrowLabelProps = ComponentPropsWithoutRef<"p"> & {
  tone?: EyebrowTone;
  /**
   * Enable a subtle metallic shimmer sweep across the label.
   * Use sparingly — best on hero / landing-page section headers, not every eyebrow.
   * No-ops under `prefers-reduced-motion: reduce`.
   */
  shimmer?: boolean;
};

const TONE_CLASSES: Record<EyebrowTone, string> = {
  yellow: "text-pops-yellow-500",
  ink:    "text-ink-400",
  dark:   "text-ink-600",
};

/**
 * Resolved hex values for each tone — must be passed explicitly into AnimatedShinyText
 * because `currentColor` resolves to transparent inside the bg-clip-text mask. Keep these
 * in sync with the corresponding Tailwind theme tokens in `app/globals.css`.
 */
const TONE_BASE: Record<EyebrowTone, string> = {
  yellow: "#FECD08", // --color-pops-yellow-500
  ink:    "#8990A0", // --color-ink-400
  dark:   "#3F4654", // --color-ink-600
};

/**
 * Shimmer peak color per tone.
 * - `yellow` / `ink` are used on dark surfaces — white peak reads as a bright gleam.
 * - `dark` is used on the near-white canvas — white would be invisible, so use the brand
 *    yellow which contrasts against both the dark text and the canvas surface.
 */
const TONE_SHIMMER: Record<EyebrowTone, string> = {
  yellow: "rgba(255,255,255,0.95)",
  ink:    "rgba(255,255,255,0.95)",
  dark:   "rgba(254,205,8,0.95)",
};

export const EyebrowLabel = forwardRef<HTMLParagraphElement, EyebrowLabelProps>(
  function EyebrowLabel({ tone = "yellow", shimmer = false, className, children, ...rest }, ref) {
    const base = `inline-block font-text text-xs font-semibold uppercase tracking-[0.04em] ${TONE_CLASSES[tone]}`;
    return (
      <p ref={ref} className={className ? `${base} ${className}` : base} {...rest}>
        {shimmer ? (
          <AnimatedShinyText
            baseColor={TONE_BASE[tone]}
            shimmerColor={TONE_SHIMMER[tone]}
          >
            {children}
          </AnimatedShinyText>
        ) : (
          children
        )}
      </p>
    );
  },
);
