import { forwardRef, type ComponentPropsWithoutRef } from "react";

type EyebrowTone = "yellow" | "ink" | "dark";

type EyebrowLabelProps = ComponentPropsWithoutRef<"p"> & {
  tone?: EyebrowTone;
};

const TONE_CLASSES: Record<EyebrowTone, string> = {
  yellow: "text-pops-yellow-500",
  ink:    "text-ink-400",
  dark:   "text-ink-600",
};

export const EyebrowLabel = forwardRef<HTMLParagraphElement, EyebrowLabelProps>(
  function EyebrowLabel({ tone = "yellow", className, children, ...rest }, ref) {
    const base = `inline-block font-text text-xs font-semibold uppercase tracking-[0.04em] ${TONE_CLASSES[tone]}`;
    return (
      <p ref={ref} className={className ? `${base} ${className}` : base} {...rest}>
        {children}
      </p>
    );
  },
);
