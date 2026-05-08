import { forwardRef, type ComponentPropsWithoutRef } from "react";

type SectionTone = "dark" | "light" | "canvas";

type SectionProps = ComponentPropsWithoutRef<"section"> & {
  tone?: SectionTone;
};

const TONE_CLASSES: Record<SectionTone, string> = {
  dark:   "pops-section-gold-wash text-ink-100",
  light:  "pops-section-gold-wash text-ink-100",
  canvas: "pops-section-gold-wash text-ink-100",
};

export const Section = forwardRef<HTMLElement, SectionProps>(function Section(
  { tone = "dark", className, children, ...rest },
  ref,
) {
  const base = `${TONE_CLASSES[tone]} py-16 md:py-24`;
  return (
    <section ref={ref} className={className ? `${base} ${className}` : base} {...rest}>
      <div className="relative z-10">{children}</div>
    </section>
  );
});
