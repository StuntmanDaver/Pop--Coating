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
}: HeroProps) {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        "relative isolate w-full overflow-hidden bg-ink-900",
        "min-h-[520px] md:min-h-[620px]",
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
      {/* Layered cinematic overlays for stronger premium contrast */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-br from-black/90 via-ink-900/70 to-ink-900/30"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,rgba(254,205,8,0.16),transparent_34%)]"
      />
      <div className="relative z-10 mx-auto flex min-h-[520px] w-full max-w-[1280px] flex-col justify-center px-6 py-16 md:min-h-[620px] md:py-28">
        <EyebrowLabel className="mb-6">{eyebrow}</EyebrowLabel>
        <h1
          id={headingId}
          className="font-display text-[46px] leading-[1.0] tracking-tight text-paper md:text-[66px] lg:text-[78px]"
        >
          {heading}
        </h1>
        <p className="mt-3 max-w-2xl font-text text-sm font-semibold uppercase tracking-[0.12em] text-pops-yellow-300">
          Serving the Industry Since 1972
        </p>
        {lede ? (
          <p className="mt-6 max-w-2xl font-text text-lg leading-relaxed text-ink-200 md:text-xl">
            {lede}
          </p>
        ) : null}
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <Button asChild variant="primary">
            <Link href={primaryCta.href}>{primaryCta.label}</Link>
          </Button>
          {secondaryCta ? (
            <Button asChild variant="secondary">
              <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
