import { forwardRef, type ComponentPropsWithoutRef } from "react";

import { AnimatedShinyText } from "../magicui/animated-shiny-text";

type EyebrowTone = "yellow" | "ink" | "dark";

type EyebrowLabelProps = ComponentPropsWithoutRef<"p"> & {
  tone?: EyebrowTone;
  shimmer?: boolean;
};

const TONE_CLASSES: Record<EyebrowTone, string> = {
  yellow: "text-pops-yellow-500",
  ink:    "text-ink-400",
  dark:   "text-ink-300",
};

const TONE_BASE_COLORS: Record<EyebrowTone, string> = {
  yellow: "#ca8a04",
  ink:    "#9ca3af",
  dark:   "#cbd5e1",
};

export const EyebrowLabel = forwardRef<HTMLParagraphElement, EyebrowLabelProps>(
  function EyebrowLabel({ tone = "yellow", shimmer = false, className, children, ...rest }, ref) {
    const base = `inline-block font-text text-xs font-semibold uppercase tracking-[0.04em] ${TONE_CLASSES[tone]}`;
    const combined = className ? `${base} ${className}` : base;
    return (
      <p ref={ref} className={combined} {...rest}>
        {shimmer ? (
          <AnimatedShinyText baseColor={TONE_BASE_COLORS[tone]}>
            {children}
          </AnimatedShinyText>
        ) : children}
      </p>
    );
  },
);
