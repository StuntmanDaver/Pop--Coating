import Link from "next/link";

import { Container } from "../layout/container";
import { BlurFade } from "../magicui/blur-fade";
import { Button } from "../ui/button";
import { EyebrowLabel } from "./eyebrow";

type Spec = {
  label: string;
  /** Headline value. Only rendered when SPECS_READY is true. */
  value: string;
  detail: string;
};

// Flip to `true` once the client provides real numbers below.
// While false, the section renders a CTA card instead of the four-cell grid
// — visitors never see "TODO" placeholders in production.
const SPECS_READY = false;

// TODO(client): Replace placeholder values with real capacity specs from Pops,
// then set SPECS_READY = true above. Sources to gather:
//   - Largest cure oven: usable interior dimensions (W × H × D) in feet.
//   - Max part weight: rated load on the line / largest fixture.
//   - Blast booth: usable footprint (W × D) and door clearance (H).
//   - Throughput: typical parts per shift OR linear feet per shift.
const SPECS: Spec[] = [
  {
    label: "Largest Cure Oven",
    value: "TODO × TODO × TODO ft",
    detail: "Interior W × H × D",
  },
  {
    label: "Max Part Weight",
    value: "TODO lbs",
    detail: "Rated load on the line",
  },
  {
    label: "Blast Booth",
    value: "TODO × TODO ft",
    detail: "Usable footprint, walk-in",
  },
  {
    label: "Throughput",
    value: "TODO / shift",
    detail: "Typical run capacity",
  },
];

const CELL_BORDERS = [
  "border-r border-b border-ink-700 md:border-b-0",
  "border-b border-ink-700 md:border-r md:border-b-0",
  "border-r border-ink-700",
  "",
];

export function CapacitySpecs() {
  return (
    <section
      aria-labelledby="capacity-heading"
      className="border-t border-ink-700 bg-ink-900 py-12 sm:py-16 md:py-20"
    >
      <Container>
        <BlurFade>
          <EyebrowLabel tone="dark" shimmer className="mb-3 sm:mb-4">
            CAPACITY AT A GLANCE
          </EyebrowLabel>
          <h2
            id="capacity-heading"
            className="mb-2 max-w-3xl font-display text-[26px] leading-tight tracking-tight text-ink-100 sm:text-[30px] md:text-[42px]"
          >
            Built for big work
          </h2>
          <p className="mb-8 max-w-2xl font-text text-base leading-relaxed text-ink-300 sm:mb-10">
            {SPECS_READY
              ? "If your part fits, we can finish it. Hard numbers below — get anything outside this range on the phone with us anyway."
              : "Aerospace components to oversized fab work. Send us dimensions, weight, and material, and we'll confirm fit and quote within 24 hours."}
          </p>
        </BlurFade>

        <BlurFade delay={0.12}>
          {SPECS_READY ? (
            <dl className="grid grid-cols-2 border border-ink-700 md:grid-cols-4">
              {SPECS.map((spec, i) => (
                <div
                  key={spec.label}
                  className={`px-4 py-6 text-center sm:px-6 sm:py-8 ${CELL_BORDERS[i]}`}
                >
                  <dt className="font-text text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-300">
                    {spec.label}
                  </dt>
                  <dd className="mt-2 font-display text-xl leading-tight tracking-tight text-ink-100 sm:text-2xl md:text-[28px]">
                    {spec.value}
                    <span className="mt-1 block font-text text-[11px] font-normal leading-snug tracking-normal text-ink-300 sm:text-xs">
                      {spec.detail}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <div className="flex flex-col items-start gap-4 rounded-sm border border-ink-700 bg-ink-800 p-6 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-8">
              <p className="font-text text-base leading-relaxed text-ink-200 sm:text-lg">
                Cure oven, max part weight, blast booth, throughput — sized to
                your job, every time. Tell us what you have and we&apos;ll
                confirm a fit.
              </p>
              <Button asChild variant="primary" className="shrink-0">
                <Link href="/request-a-quote">Send your part details</Link>
              </Button>
            </div>
          )}
        </BlurFade>
      </Container>
    </section>
  );
}
