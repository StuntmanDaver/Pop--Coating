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
      {/* Directional overlay: heavy bottom-left (where content lives), light top-right */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-br from-ink-900/85 via-ink-900/55 to-ink-900/20"
      />
      <div className="relative z-10 mx-auto flex min-h-[520px] w-full max-w-[1280px] flex-col justify-center px-6 py-16 md:min-h-[620px] md:py-28">
        <EyebrowLabel className="mb-6">{eyebrow}</EyebrowLabel>
        <h1
          id={headingId}
          className="font-display text-[46px] leading-[1.0] tracking-tight text-paper md:text-[66px] lg:text-[78px]"
        >
          {heading}
        </h1>
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
