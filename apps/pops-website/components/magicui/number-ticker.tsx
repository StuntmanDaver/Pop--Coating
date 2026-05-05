"use client";

import {
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";
import {
  useEffect,
  useMemo,
  useRef,
  type ComponentPropsWithoutRef,
} from "react";

import { cn } from "../../lib/utils";

type NumberTickerProps = ComponentPropsWithoutRef<"span"> & {
  value: number;
  startValue?: number;
  delay?: number;
  decimalPlaces?: number;
  /** Render with thousands separators (e.g. "1,972"). Disable for years. */
  useGrouping?: boolean;
};

/**
 * Animated counter that springs from `startValue` → `value` when scrolled into view.
 *
 * Important properties for SSR / SEO / accessibility:
 *  - The static HTML always renders the FINAL value (good for crawlers and JS-disabled users).
 *  - `prefers-reduced-motion: reduce` is honored — the animation is skipped entirely.
 *  - The spring listener is only attached after the element enters the viewport, so users
 *    above the fold see the SSR value until the very moment the count begins.
 */
export function NumberTicker({
  value,
  startValue = 0,
  delay = 0,
  decimalPlaces = 0,
  useGrouping = true,
  className,
  ...rest
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(startValue);
  const springValue = useSpring(motionValue, { damping: 60, stiffness: 100 });
  const isInView = useInView(ref, { once: true, margin: "0px" });
  const prefersReducedMotion = useReducedMotion();

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
        useGrouping,
      }),
    [decimalPlaces, useGrouping],
  );

  useEffect(() => {
    // Subscribe & trigger animation only when:
    //   1. The element has entered the viewport (avoid running off-screen).
    //   2. The user hasn't requested reduced motion.
    // SSR'd text content (value) stays untouched in every other case.
    if (!isInView || prefersReducedMotion) return;

    const unsubscribe = springValue.on("change", (latest) => {
      if (!ref.current) return;
      ref.current.textContent = formatter.format(
        Number(latest.toFixed(decimalPlaces)),
      );
    });

    const timeoutId = window.setTimeout(() => {
      motionValue.set(value);
    }, Math.max(0, delay) * 1000);

    return () => {
      window.clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [
    isInView,
    prefersReducedMotion,
    motionValue,
    springValue,
    value,
    delay,
    formatter,
    decimalPlaces,
  ]);

  return (
    <span
      ref={ref}
      className={cn("inline-block tabular-nums tracking-tight", className)}
      {...rest}
    >
      {formatter.format(value)}
    </span>
  );
}
