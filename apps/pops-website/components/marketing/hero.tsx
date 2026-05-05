import Image from "next/image";
import Link from "next/link";
import { useId } from "react";

import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { EyebrowLabel } from "./eyebrow";

type HeroCta = {
  label: string;
  href: string;
};

type HeroProps = {
  eyebrow: string;
  heading: string;
  lede?: string;
  primaryCta: HeroCta;
  secondaryCta?: HeroCta;
  backgroundImage: string;
  backgroundAlt?: string;
  className?: string;
  /** Enable a subtle metallic shimmer on the eyebrow. */
  shimmerEyebrow?: boolean;
};

export function Hero({
  eyebrow,
  heading,
  lede,
  primaryCta,
  secondaryCta,
  backgroundImage,
  backgroundAlt = "",
  className,
  shimmerEyebrow = false,
}: HeroProps) {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        "relative isolate w-full overflow-hidden bg-ink-900",
        "min-h-[460px] sm:min-h-[520px] md:min-h-[620px]",
        className,
      )}
    >
      <Image
        src={backgroundImage}
        alt={backgroundAlt}
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      {/* Directional overlay: heavy bottom-left (where content lives), light top-right */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-br from-ink-900/85 via-ink-900/55 to-ink-900/20"
      />
      <div className="relative z-10 mx-auto flex min-h-[460px] w-full max-w-[1280px] flex-col justify-center px-4 py-14 sm:min-h-[520px] sm:px-6 sm:py-16 md:min-h-[620px] md:py-28 lg:px-8">
        <EyebrowLabel className="mb-4 sm:mb-6" shimmer={shimmerEyebrow}>{eyebrow}</EyebrowLabel>
        <h1
          id={headingId}
          className="font-display text-[34px] leading-[1.05] tracking-tight text-paper sm:text-[46px] sm:leading-[1.0] md:text-[66px] lg:text-[78px]"
        >
          {heading}
        </h1>
        {lede ? (
          <p className="mt-5 max-w-2xl font-text text-base leading-relaxed text-ink-200 sm:mt-6 sm:text-lg md:text-xl">
            {lede}
          </p>
        ) : null}
        <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:items-center sm:gap-4">
          <Button asChild variant="primary" className="w-full sm:w-auto">
            <Link href={primaryCta.href}>{primaryCta.label}</Link>
          </Button>
          {secondaryCta ? (
            <Button asChild variant="secondary" className="w-full sm:w-auto">
              <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
