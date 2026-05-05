import { forwardRef, type ComponentPropsWithoutRef } from "react";

type SectionTone = "dark" | "light" | "canvas";

type SectionProps = ComponentPropsWithoutRef<"section"> & {
  tone?: SectionTone;
};

const TONE_CLASSES: Record<SectionTone, string> = {
  dark:   "bg-ink-800 text-ink-100",
  light:  "bg-paper text-ink-800",
  canvas: "bg-canvas text-ink-800",
};

export const Section = forwardRef<HTMLElement, SectionProps>(function Section(
  { tone = "dark", className, children, ...rest },
  ref,
) {
  const base = `${TONE_CLASSES[tone]} py-12 sm:py-16 md:py-24`;
  return (
    <section ref={ref} className={className ? `${base} ${className}` : base} {...rest}>
      {children}
    </section>
  );
});
