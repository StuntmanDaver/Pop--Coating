import Image from "next/image";
import Link from "next/link";
import { useId } from "react";

import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { EyebrowLabel } from "./eyebrow";
import { HeroIntro } from "./hero-intro";

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
  /**
   * When set with `secondaryCta`, keeps both actions in a vertical stack (including on large screens)
   * and styles the second button like the first — e.g. Call + Request a quote on Contact.
   */
  stackPrimaryActions?: boolean;
  /** When true, headline and CTAs ease in on first paint (home page). */
  animateCopyOnLoad?: boolean;
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
  stackPrimaryActions = false,
  animateCopyOnLoad = false,
  backgroundImage,
  backgroundAlt = "",
  className,
}: HeroProps) {
  const headingId = useId();

  const copy = (
    <>
      <div className="mb-6 h-px w-16 bg-gradient-to-r from-pops-yellow-500 to-transparent md:mb-8 md:w-24" />
      <EyebrowLabel className="mb-4 tracking-[0.14em] md:mb-5">{eyebrow}</EyebrowLabel>
      <h1
        id={headingId}
        className="font-display text-[2.5rem] leading-[0.98] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-[4.25rem] xl:text-[4.75rem]"
      >
        {heading}
      </h1>
      {lede ? (
        <p className="mt-6 max-w-2xl font-text text-base leading-relaxed text-ink-100 md:mt-8 md:text-lg md:leading-relaxed">
          {lede}
        </p>
      ) : null}
      <div
        className={cn(
          "mt-10 flex flex-col gap-4 sm:mt-12",
          stackPrimaryActions && secondaryCta
            ? "items-stretch sm:max-w-md sm:items-stretch"
            : "sm:flex-row sm:flex-wrap sm:items-center",
        )}
      >
        <Button asChild variant="primary" size="default" className="min-h-12 px-8 text-base">
          <Link href={primaryCta.href}>{primaryCta.label}</Link>
        </Button>
        {secondaryCta ? (
          <Button
            asChild
            variant={stackPrimaryActions ? "primary" : "secondary"}
            size="default"
            className={cn(
              "min-h-12 px-8 text-base",
              !stackPrimaryActions && "border-pops-yellow-500/50",
            )}
          >
            <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
          </Button>
        ) : null}
      </div>
    </>
  );

  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        "relative isolate w-full overflow-hidden bg-black",
        "min-h-[85vh] md:min-h-[min(92vh,960px)]",
        className,
      )}
    >
      {/* Photography — full frame visible (object-contain); letterboxing shows as black hero bg */}
      <div className="absolute inset-0">
        <div className="absolute inset-0">
          <Image
            src={backgroundImage}
            alt={backgroundAlt}
            fill
            priority
            sizes="100vw"
            className="object-contain object-center"
          />
        </div>
      </div>

      {/* Dramatic stack: crush midtones, gold rim light, vignette */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-black via-black/75 to-black"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-tr from-black via-transparent to-black/40"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_100%_60%_at_50%_0%,rgba(254,205,8,0.14),transparent_55%)] pops-hero-gold-halo"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_80%_100%,rgba(254,205,8,0.08),transparent_50%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 ring-1 ring-inset ring-pops-yellow-500/10"
      />

      <div className="relative z-10 mx-auto flex min-h-[85vh] w-full max-w-[1280px] flex-col justify-start px-6 pb-16 pt-20 md:min-h-[min(92vh,960px)] md:pb-20 md:pt-24 lg:px-8 lg:pt-28">
        {animateCopyOnLoad ? <HeroIntro>{copy}</HeroIntro> : <div className="max-w-4xl">{copy}</div>}
      </div>

      {/* Bottom transition into next section */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 right-0 z-[5] h-24 bg-gradient-to-t from-black to-transparent"
      />
    </section>
  );
}
