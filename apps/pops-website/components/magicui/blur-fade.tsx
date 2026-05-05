"use client";

import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
  type UseInViewOptions,
  type Variants,
} from "motion/react";
import { useRef, type ReactNode } from "react";

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
  inView?: boolean;
  inViewMargin?: UseInViewOptions["margin"];
  blur?: string;
};

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
  const ref = useRef(null);
  const inViewResult = useInView(ref, { once: true, margin: inViewMargin });
  const isInView = !inView || inViewResult;
  const prefersReducedMotion = useReducedMotion();

  const defaultVariants: Variants = {
    hidden: { y: yOffset, opacity: 0, filter: `blur(${blur})` },
    visible: { y: -yOffset, opacity: 1, filter: "blur(0px)" },
  };
  // When the user has prefers-reduced-motion: reduce, snap straight to the
  // visible state (no blur, no translate, no fade) and keep both variants
  // identical so the motion.div has nothing to interpolate. Same JSX shape,
  // so SSR/hydration stay consistent.
  const staticVariants: Variants = {
    hidden: { y: 0, opacity: 1, filter: "blur(0px)" },
    visible: { y: 0, opacity: 1, filter: "blur(0px)" },
  };
  const combinedVariants = prefersReducedMotion
    ? staticVariants
    : (variant ?? defaultVariants);

  return (
    <AnimatePresence>
      <motion.div
        ref={ref}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        exit="hidden"
        variants={combinedVariants}
        transition={{
          delay: 0.04 + delay,
          duration,
          ease: "easeOut",
        }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
