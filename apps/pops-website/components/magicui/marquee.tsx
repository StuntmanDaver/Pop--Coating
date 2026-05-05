import type { ComponentPropsWithoutRef } from "react";

import { cn } from "../../lib/utils";

type MarqueeProps = ComponentPropsWithoutRef<"div"> & {
  /** Reverse the animation direction. */
  reverse?: boolean;
  /** Pause the animation on hover. */
  pauseOnHover?: boolean;
  /** Repeat the children N times for a seamless loop. Only the first set is exposed to assistive tech. */
  repeat?: number;
};

/**
 * Horizontal looping marquee.
 *
 * Accessibility: only the first iteration of `children` is announced to screen readers.
 * Subsequent visual repeats are marked `aria-hidden="true"` to avoid the same alt text /
 * link text being read multiple times.
 */
export function Marquee({
  className,
  reverse = false,
  pauseOnHover = false,
  children,
  repeat = 4,
  ...rest
}: MarqueeProps) {
  return (
    <div
      {...rest}
      className={cn(
        "group flex overflow-hidden p-2 [--duration:40s] [--gap:1rem] [gap:var(--gap)]",
        className,
      )}
    >
      {Array.from({ length: repeat }).map((_, i) => (
        <div
          key={i}
          aria-hidden={i === 0 ? undefined : true}
          className={cn(
            "flex shrink-0 justify-around [gap:var(--gap)]",
            reverse ? "animate-marquee-reverse" : "animate-marquee",
            pauseOnHover && "group-hover:[animation-play-state:paused]",
          )}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
