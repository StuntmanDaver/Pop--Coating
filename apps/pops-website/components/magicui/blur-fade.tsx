"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

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

/**
 * Fade + blur reveal when the block scrolls into view (or on mount when `inView={false}`).
 *
 * Uses CSS transitions + a native IntersectionObserver instead of Motion variants.
 * Motion + variants was leaving blocks stuck at opacity 0 (React 19 / Next 16).
 * Blur is not applied: `filter: blur()` + opacity transitions have caused stuck repaints
 * in WebKit. Use `inView={false}` to skip scroll gating entirely.
 */
export function BlurFade({
  children,
  className,
  duration = 0.4,
  delay = 0,
  yOffset = 6,
  inView = true,
  inViewMargin = "0px 0px 200px 0px",
  blur: _blur = "6px",
}: BlurFadeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(() => !inView);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useLayoutEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");

    const syncReduced = () => {
      const reduced = mq.matches;
      setPrefersReducedMotion(reduced);
      if (reduced) setRevealed(true);
    };

    syncReduced();
    mq.addEventListener("change", syncReduced);

    if (!inView) {
      setRevealed(true);
      return () => mq.removeEventListener("change", syncReduced);
    }

    if (mq.matches) {
      setRevealed(true);
      return () => mq.removeEventListener("change", syncReduced);
    }

    const node = ref.current;
    if (!node) {
      setRevealed(true);
      return () => mq.removeEventListener("change", syncReduced);
    }

    const precheckIntersectsViewport = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      return r.bottom > -80 && r.top < vh + 80 && r.right > -80 && r.left < vw + 80;
    };

    let revealTimeout: number | undefined;

    const reveal = () => {
      setRevealed(true);
    };

    if (typeof IntersectionObserver === "undefined") {
      revealTimeout = window.setTimeout(reveal, 0);
      return () => {
        mq.removeEventListener("change", syncReduced);
        if (revealTimeout !== undefined) window.clearTimeout(revealTimeout);
      };
    }

    if (precheckIntersectsViewport(node)) {
      revealTimeout = window.setTimeout(reveal, 0);
      return () => {
        mq.removeEventListener("change", syncReduced);
        if (revealTimeout !== undefined) window.clearTimeout(revealTimeout);
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          reveal();
          observer.disconnect();
        }
      },
      { rootMargin: inViewMargin },
    );
    observer.observe(node);

    const failSafe = window.setTimeout(() => {
      reveal();
      observer.disconnect();
    }, 2000);

    return () => {
      mq.removeEventListener("change", syncReduced);
      window.clearTimeout(failSafe);
      observer.disconnect();
      if (revealTimeout !== undefined) window.clearTimeout(revealTimeout);
    };
  }, [inView, inViewMargin]);

  const skipStyles = prefersReducedMotion || !inView;

  return (
    <div
      ref={ref}
      className={cn(className)}
      style={
        skipStyles
          ? undefined
          : {
              opacity: revealed ? 1 : 0,
              transform: revealed ? "translateY(0)" : `translateY(${yOffset}px)`,
              transitionProperty: "opacity, transform",
              transitionDuration: `${duration}s`,
              transitionTimingFunction: "ease-out",
              transitionDelay: `${delay}s`,
            }
      }
    >
      {children}
    </div>
  );
}
