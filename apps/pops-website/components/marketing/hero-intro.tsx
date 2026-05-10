"use client";

import type { ReactNode } from "react";

import { BlurFade } from "../magicui/blur-fade";

type HeroIntroProps = {
  children: ReactNode;
};

/** Fade/slide hero copy on first paint (no scroll) — used on the home page. */
export function HeroIntro({ children }: HeroIntroProps) {
  return (
    <BlurFade inView={false} duration={0.55} yOffset={10} delay={0.02} blur="5px" className="w-full max-w-4xl">
      {children}
    </BlurFade>
  );
}
