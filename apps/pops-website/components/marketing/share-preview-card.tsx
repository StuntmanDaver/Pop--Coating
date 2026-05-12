"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Interactive reference for the OG share aesthetic — animates in the browser only;
 * link previews still use generated `/opengraph-image`.
 */
export function SharePreviewCard() {
  const reduce = useReducedMotion();

  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={reduce ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.85, ease: EASE }}
      className="relative mx-auto w-full max-w-[720px] overflow-hidden rounded-[28px] border border-pops-yellow-500/25 bg-[linear-gradient(165deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.02)_22%,transparent_55%),linear-gradient(180deg,rgba(17,17,17,0.92),rgba(6,6,6,0.96))] shadow-[0_32px_120px_rgba(0,0,0,0.65),0_0_100px_rgba(254,205,8,0.09),inset_0_1px_0_rgba(255,255,255,0.05)]"
    >
      {/* Ambient layers */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_95%_70%_at_50%_-8%,rgba(254,205,8,0.18),transparent_58%),radial-gradient(ellipse_55%_45%_at_100%_100%,rgba(254,205,8,0.08),transparent_52%)]"
      />
      {/* Glow sweep — CSS only, GPU-friendly */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-1/2 top-0 h-full w-1/2 skew-x-[-12deg] bg-gradient-to-r from-transparent via-pops-yellow-500/12 to-transparent pops-share-glow-sweep opacity-40"
      />

      <motion.div
        whileHover={reduce ? undefined : { y: -6, scale: 1.008 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        className="relative"
      >
        <Link
          href="https://popsindustrial.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-col gap-8 p-8 sm:flex-row sm:items-center sm:gap-10 sm:p-10 md:p-12"
        >
          <div className="relative mx-auto flex h-36 w-full max-w-[260px] shrink-0 items-center justify-center sm:mx-0 sm:h-44 sm:w-[300px]">
            <Image
              src="/images/pops-logo-primary.png"
              alt="Pop's Industrial Coatings logo"
              width={260}
              height={188}
              className="h-auto max-h-[188px] w-full object-contain drop-shadow-[0_12px_28px_rgba(0,0,0,0.5)]"
              priority
            />
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="font-display text-[clamp(1.5rem,4vw+0.6rem,2.125rem)] leading-[1.06] tracking-tight text-white">
              Pop&apos;s Industrial Coatings
            </p>
            <p className="mt-4 font-text text-[clamp(1rem,2.4vw+0.35rem,1.125rem)] leading-relaxed text-ink-200">
              Premium powder coating, wet paint &amp; abrasive blasting for mission-critical parts —
              family-owned in Lakeland, Florida since 1972.
            </p>

            <div className="mt-8 flex flex-col gap-4 border-t border-pops-yellow-500/15 pt-7 sm:flex-row sm:items-center sm:justify-between">
              <span className="font-text text-sm font-semibold tracking-wide text-pops-yellow-500">
                popsindustrial.com
              </span>
              <span className="inline-flex items-center justify-center gap-2 font-text text-sm font-semibold text-pops-yellow-400 transition-colors group-hover:text-pops-yellow-300 sm:justify-end">
                Request a quote
                <span aria-hidden className="text-lg transition-transform duration-500 ease-in-out group-hover:translate-x-1">
                  →
                </span>
              </span>
            </div>
          </div>
        </Link>
      </motion.div>
    </motion.article>
  );
}
