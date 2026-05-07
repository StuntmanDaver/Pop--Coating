"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

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

/**
 * Fade + blur reveal triggered when the element scrolls into view.
 *
 * We use a native IntersectionObserver instead of motion's `useInView`
 * or `whileInView` because both have a regression in motion v12 +
 * Next.js 16 (Turbopack) + React 19 where the in-view callback never
 * resolves and elements stay stuck at opacity 0.
 *
 * Mitigations: `useLayoutEffect` precheck (already in viewport → show now),
 * plus a ~2.8s fail-safe so content never stays hidden if IO misbehaves.
 */
export function BlurFade({
  children,
  className,
  variant,
  duration = 0.4,
  delay = 0,
  yOffset = 6,
  inView = true,
  inViewMargin = "-50px",
  blur = "6px",
}: BlurFadeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(!inView);
  const prefersReducedMotion = useReducedMotion();

  /** If any part of the node overlaps the viewport (generous margin), treat as visible immediately. */
  const precheckIntersectsViewport = (node: HTMLElement) => {
    const r = node.getBoundingClientRect();
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    return r.bottom > -80 && r.top < vh + 80 && r.right > -80 && r.left < vw + 80;
  };

  useLayoutEffect(() => {
    if (!inView) return;
    const node = ref.current;
    if (!node) return;
    if (typeof window === "undefined") return;

    if (typeof IntersectionObserver === "undefined") {
      setIsInView(true);
      return;
    }

    if (precheckIntersectsViewport(node)) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: inViewMargin },
    );
    observer.observe(node);

    const failSafe = window.setTimeout(() => {
      setIsInView(true);
      observer.disconnect();
    }, 2800);

    return () => {
      window.clearTimeout(failSafe);
      observer.disconnect();
    };
  }, [inView, inViewMargin]);

  const defaultVariants: Variants = {
    hidden: { y: yOffset, opacity: 0, filter: `blur(${blur})` },
    visible: { y: -yOffset, opacity: 1, filter: "blur(0px)" },
  };

  const staticVariants: Variants = {
    hidden: { y: 0, opacity: 1, filter: "blur(0px)" },
    visible: { y: 0, opacity: 1, filter: "blur(0px)" },
  };

  const combinedVariants = prefersReducedMotion
    ? staticVariants
    : (variant ?? defaultVariants);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={combinedVariants}
      transition={{ delay: 0.04 + delay, duration, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
