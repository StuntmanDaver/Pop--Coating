"use client";

import { useMotionValue, useSpring } from "motion/react";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
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
 *  - Viewport detection uses a native IntersectionObserver (not Motion `useInView`),
 *    which can fail to resolve in Motion v12 + React 19.
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
  const [isInView, setIsInView] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useLayoutEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");

    const syncReduced = () => {
      const reduced = mq.matches;
      setPrefersReducedMotion(reduced);
      if (reduced) setIsInView(true);
    };

    syncReduced();
    mq.addEventListener("change", syncReduced);

    const node = ref.current;
    if (!node) {
      return () => mq.removeEventListener("change", syncReduced);
    }

    if (mq.matches) {
      return () => mq.removeEventListener("change", syncReduced);
    }

    let revealTimeout: number | undefined;

    const revealSoon = () => {
      revealTimeout = window.setTimeout(() => setIsInView(true), 0);
    };

    if (typeof IntersectionObserver === "undefined") {
      revealSoon();
      return () => {
        mq.removeEventListener("change", syncReduced);
        if (revealTimeout !== undefined) window.clearTimeout(revealTimeout);
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px", threshold: 0.05 },
    );
    observer.observe(node);

    const failSafe = window.setTimeout(() => {
      setIsInView(true);
      observer.disconnect();
    }, 800);

    return () => {
      mq.removeEventListener("change", syncReduced);
      window.clearTimeout(failSafe);
      observer.disconnect();
      if (revealTimeout !== undefined) window.clearTimeout(revealTimeout);
    };
  }, []);

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

    const unsubscribe = springValue.on("change", (latest: number) => {
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
