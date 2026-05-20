"use client";

import { motion, useReducedMotion } from "motion/react";

import { BlurFade } from "../magicui/blur-fade";
import { Container } from "../layout/container";
import { EyebrowLabel } from "./eyebrow";

type Industry = {
  name: string;
  detail: string;
};

// Anchored in real Pops context: hero lede (aerospace/defense/heavy equipment),
// FDOT certification, customer photos (toll road structures, trailers, steel
// support beams), and Florida operating climate.
const INDUSTRIES: Industry[] = [
  { name: "Water Tanks", detail: "Mission-critical specs" },
  { name: "Heavy Equipment", detail: "Frames, attachments, beds" },
  { name: "Transportation & Trailers", detail: "Trucks, trailers, fleets" },
  { name: "Infrastructure & DOT", detail: "FDOT-approved coatings" },
  { name: "Marine & Outdoor", detail: "Florida-grade durability" },
  { name: "Support Beams", detail: "Traffic lights, bridges, stadiums" },
];

const SPRING = { type: "spring", stiffness: 180, damping: 24, mass: 0.85 } as const;

export function IndustriesGrid() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      aria-labelledby="industries-heading"
      className="pops-section-gold-wash border-t border-pops-yellow-500/25 py-16 sm:py-20 md:py-28"
    >
      <Container className="relative z-10">
        <BlurFade inView={false}>
          <EyebrowLabel tone="dark" shimmer className="mb-3 sm:mb-4">
            INDUSTRIES WE SERVE
          </EyebrowLabel>
          <div className="mb-6 h-px w-16 bg-gradient-to-r from-pops-yellow-500 to-transparent sm:mb-8 md:w-24" />
          <h2
            id="industries-heading"
            className="mb-8 max-w-3xl font-display text-[26px] leading-tight tracking-tight text-white sm:mb-12 sm:text-[30px] md:text-[42px]"
          >
            Built for the work
            <br className="hidden md:block" /> Florida industry depends on
          </h2>
        </BlurFade>

        <motion.ul
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6"
          initial={reduceMotion ? false : "hidden"}
          whileInView={reduceMotion ? undefined : "visible"}
          viewport={{ once: true, margin: "0px 0px -12% 0px" }}
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.09,
                delayChildren: 0.12,
              },
            },
          }}
        >
          {INDUSTRIES.map((industry) => (
            <motion.li
                key={industry.name}
                className="pops-card-surface relative flex h-full flex-col justify-between gap-3 overflow-hidden rounded-sm p-5 sm:p-6"
                variants={{
                  hidden: { opacity: 0, y: 18 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.72, ease: "easeInOut" }}
                whileHover={reduceMotion ? undefined : { y: -3, transition: SPRING }}
              >
                <div
                  aria-hidden="true"
                  className="absolute left-0 top-0 h-0.5 w-10 bg-gradient-to-r from-pops-yellow-500 to-transparent sm:w-14"
                />
                <h3 className="relative pt-1 font-display text-[18px] leading-tight tracking-tight text-white sm:text-[20px]">
                  {industry.name}
                </h3>
                <p className="relative font-text text-xs leading-snug text-ink-200 sm:text-sm">
                  {industry.detail}
                </p>
              </motion.li>
            ))}
        </motion.ul>
      </Container>
    </section>
  );
}
