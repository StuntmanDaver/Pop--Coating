"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useRef, useSyncExternalStore } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { EyebrowLabel } from "./eyebrow";
import { HeroIntro } from "./hero-intro";

type HeroCta = {
  label: string;
  href: string;
};

/** Parallax scale only at md+ — avoids edge bleed and extra compositing work on phones. */
function useMdUpParallaxScale(): number {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") return () => {};
      const mq = window.matchMedia("(min-width: 768px)");
      mq.addEventListener("change", onStoreChange);
      return () => mq.removeEventListener("change", onStoreChange);
    },
    () => (typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches ? 1.04 : 1),
    () => 1,
  );
}

type HeroProps = {
  eyebrow: string;
  heading: string;
  lede?: string;
  primaryCta: HeroCta;
  secondaryCta?: HeroCta;
  /** Optional third action (e.g. Apply now on Contact), stacked under `secondaryCta` when `stackPrimaryActions`. */
  tertiaryCta?: HeroCta;
  /**
   * When set with `secondaryCta`, keeps both actions in a vertical stack (including on large screens)
   * and styles the second button like the first — e.g. Call + Request a quote on Contact.
   */
  stackPrimaryActions?: boolean;
  /** When true, headline and CTAs ease in on first paint (home page). */
  animateCopyOnLoad?: boolean;
  /** Premium fullscreen homepage treatment with motion and cinematic lighting. */
  cinematic?: boolean;
  backgroundImage: string;
  backgroundAlt?: string;
  className?: string;
  /** Merged onto the `<h1>` — use for e.g. `whitespace-nowrap` + fluid `text-[clamp(...)]` on the home hero. */
  headingClassName?: string;
  /** Merged onto the lede `<p>` when `lede` is set. */
  ledeClassName?: string;
};

export function Hero({
  eyebrow,
  heading,
  lede,
  primaryCta,
  secondaryCta,
  tertiaryCta,
  stackPrimaryActions = false,
  animateCopyOnLoad = false,
  cinematic = false,
  backgroundImage,
  backgroundAlt = "",
  className,
  headingClassName,
  ledeClassName,
}: HeroProps) {
  const headingId = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const parallaxScale = useMdUpParallaxScale();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "6%"]);

  const ctaClassName = cn(
    "w-full justify-center text-base transition-all duration-500 ease-in-out sm:w-auto sm:justify-center",
    cinematic && "shadow-[0_18px_46px_-26px_rgba(254,205,8,0.8)] hover:-translate-y-0.5",
  );

  const copy = (
    <>
      <div
        className={cn(
          "mb-6 h-px w-16 bg-gradient-to-r from-pops-yellow-500 to-transparent md:mb-8 md:w-24",
          cinematic && "mb-5 w-20 md:mb-7 md:w-32",
        )}
      />
      <EyebrowLabel className={cn("mb-4 tracking-[0.14em] md:mb-5", cinematic && "text-pops-yellow-400")}>
        {eyebrow}
      </EyebrowLabel>
      <h1
        id={headingId}
        className={cn(
          "font-display leading-[0.98] tracking-tight text-white",
          headingClassName ??
            "text-[2.5rem] sm:text-5xl md:text-6xl lg:text-[4.25rem] xl:text-[4.75rem]",
        )}
      >
        {heading}
      </h1>
      {lede ? (
        <p
          className={cn(
            "mt-6 font-text text-ink-100",
            ledeClassName ??
              "max-w-2xl text-base leading-relaxed md:mt-8 md:text-lg md:leading-relaxed",
          )}
        >
          {lede}
        </p>
      ) : null}
      <div
        className={cn(
          "mt-10 flex flex-col gap-3 sm:mt-12 sm:gap-4",
          cinematic && "sm:flex-row sm:items-center",
          stackPrimaryActions && (secondaryCta ?? tertiaryCta)
            ? "items-stretch sm:max-w-md sm:items-stretch"
            : "sm:flex-row sm:flex-wrap sm:items-center",
        )}
      >
        <Button asChild variant="primary" size="default" className={ctaClassName}>
          <Link href={primaryCta.href}>{primaryCta.label}</Link>
        </Button>
        {secondaryCta ? (
          <Button
            asChild
            variant={stackPrimaryActions ? "primary" : "secondary"}
            size="default"
            className={cn(
              ctaClassName,
              !stackPrimaryActions && "border-pops-yellow-500/50",
            )}
          >
            <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
          </Button>
        ) : null}
        {tertiaryCta ? (
          <Button
            asChild
            variant={stackPrimaryActions ? "primary" : "secondary"}
            size="default"
            className={cn(
              ctaClassName,
              !stackPrimaryActions && "border-pops-yellow-500/50",
            )}
          >
            <Link href={tertiaryCta.href}>{tertiaryCta.label}</Link>
          </Button>
        ) : null}
      </div>
    </>
  );

  return (
    <section
      ref={sectionRef}
      aria-labelledby={headingId}
      className={cn(
        "relative isolate w-full overflow-hidden",
        cinematic ? "min-h-[100svh]" : "min-h-[85vh] md:min-h-[min(92vh,960px)]",
        className,
      )}
    >
      {/* Photography fills the full hero frame so mobile never shows letterboxing. */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute inset-0"
          style={cinematic && !reduceMotion ? { y: backgroundY, scale: parallaxScale } : undefined}
        >
          <Image
            src={backgroundImage}
            alt={backgroundAlt}
            fill
            priority
            sizes="100vw"
            className="h-full w-full object-cover object-center"
          />
        </motion.div>
      </div>

      {/* Dramatic stack: crush midtones, gold rim light, vignette */}
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 bg-gradient-to-b from-black via-black/75 to-black",
          cinematic && "from-black/95 via-black/72 to-black/92",
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 bg-gradient-to-tr from-black via-transparent to-black/40",
          cinematic && "from-black/92 via-black/30 to-black/65",
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 bg-[radial-gradient(ellipse_100%_60%_at_50%_0%,rgba(254,205,8,0.14),transparent_55%)]",
          cinematic && "bg-[radial-gradient(ellipse_90%_52%_at_50%_12%,rgba(254,205,8,0.16),transparent_58%)]",
        )}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_80%_100%,rgba(254,205,8,0.08),transparent_50%)]"
      />
      <div
        className={cn(
          "relative z-10 mx-auto flex w-full max-w-[1280px] pops-px-page flex-col",
          cinematic
            ? "min-h-[100svh] justify-center pb-[max(3rem,env(safe-area-inset-bottom,0px))] pt-[max(6.75rem,calc(4.75rem+env(safe-area-inset-top,0px)))] sm:pb-16 sm:pt-32 md:pb-20 md:pt-32"
            : "min-h-[85vh] justify-start pb-16 pt-[max(5rem,calc(3.75rem+env(safe-area-inset-top,0px)))] md:min-h-[min(92vh,960px)] md:pb-20 md:pt-24 lg:pt-28",
        )}
      >
        {cinematic ? (
          <motion.div
            className="max-w-5xl"
            initial={reduceMotion ? false : { opacity: 0, y: 22, filter: "blur(8px)" }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={reduceMotion ? undefined : { duration: 0.9, ease: "easeInOut" }}
          >
            {copy}
          </motion.div>
        ) : animateCopyOnLoad ? (
          <HeroIntro>{copy}</HeroIntro>
        ) : (
          <div className="max-w-4xl">{copy}</div>
        )}
      </div>

      {/* Bottom transition into next section */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 right-0 z-[5] h-24 bg-gradient-to-t from-black to-transparent"
      />
    </section>
  );
}
