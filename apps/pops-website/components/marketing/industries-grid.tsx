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
  { name: "Aerospace & Defense", detail: "Mission-critical specs" },
  { name: "Heavy Equipment", detail: "Frames, attachments, beds" },
  { name: "Transportation & Trailers", detail: "Trucks, trailers, fleets" },
  { name: "Infrastructure & DOT", detail: "FDOT-approved coatings" },
  { name: "Marine & Outdoor", detail: "Florida-grade durability" },
  { name: "Manufacturing & Fabrication", detail: "OEM and job-shop work" },
];

export function IndustriesGrid() {
  return (
    <section
      aria-labelledby="industries-heading"
      className="border-t border-ink-200 bg-canvas py-12 sm:py-16 md:py-24"
    >
      <Container>
        <BlurFade>
          <EyebrowLabel tone="dark" shimmer className="mb-3 sm:mb-4">
            INDUSTRIES WE SERVE
          </EyebrowLabel>
          <h2
            id="industries-heading"
            className="mb-8 max-w-3xl font-display text-[26px] leading-tight tracking-tight text-ink-900 sm:mb-12 sm:text-[30px] md:text-[42px]"
          >
            Built for the work
            <br className="hidden md:block" /> Florida industry depends on
          </h2>
        </BlurFade>

        <BlurFade delay={0.12}>
          <ul className="grid grid-cols-2 gap-px bg-ink-200 sm:grid-cols-3 lg:grid-cols-6">
            {INDUSTRIES.map((industry) => (
              <li
                key={industry.name}
                className="flex h-full flex-col justify-between gap-3 bg-canvas p-5 sm:p-6"
              >
                <h3 className="font-display text-[18px] leading-tight tracking-tight text-ink-900 sm:text-[20px]">
                  {industry.name}
                </h3>
                <p className="font-text text-xs leading-snug text-ink-500 sm:text-sm">
                  {industry.detail}
                </p>
              </li>
            ))}
          </ul>
        </BlurFade>
      </Container>
    </section>
  );
}
