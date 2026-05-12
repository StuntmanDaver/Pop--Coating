"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "../../lib/utils";

type BlurFadeProps = {
  children: ReactNode;
  className?: string;
  variant?: {
    hidden: { y: number };
    visible: { y: number };
  };
  duration?: number;
  delay?: number;
  yOffset?: number;
  /** When false, animate on mount instead of waiting for scroll. */
  inView?: boolean;
  /** rootMargin passed to the IntersectionObserver. */
  inViewMargin?: string;
  blur?: string;
};

const PREMIUM_EASE = [0.22, 1, 0.36, 1] as const;

/** Premium fade-up reveal using Motion with reduced-motion safeguards. */
export function BlurFade({
  children,
  className,
  duration = 0.62,
  delay = 0,
  yOffset = 14,
  inView = true,
  inViewMargin = "0px 0px -12% 0px",
  blur = "4px",
}: BlurFadeProps) {
  const prefersReducedMotion = useReducedMotion();
  const hidden = prefersReducedMotion
    ? { opacity: 1, y: 0, filter: "blur(0px)" }
    : { opacity: 0, y: yOffset, filter: `blur(${blur})` };
  const visible = { opacity: 1, y: 0, filter: "blur(0px)" };

  return (
    <motion.div
      className={cn(className)}
      initial={inView ? hidden : false}
      animate={inView ? undefined : visible}
      whileInView={inView ? visible : undefined}
      viewport={inView ? { once: true, margin: inViewMargin } : undefined}
      transition={{ duration, delay, ease: PREMIUM_EASE }}
    >
      {children}
    </motion.div>
  );
}
