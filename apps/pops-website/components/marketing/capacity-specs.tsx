import { BlurFade } from "../magicui/blur-fade";
import { Container } from "../layout/container";
import { EyebrowLabel } from "./eyebrow";

type Spec = {
  label: string;
  /** Headline value. TODO placeholders to be replaced with real numbers. */
  value: string;
  detail: string;
};

// TODO(client): Replace placeholder values with real capacity specs from Pops.
// Suggested sources:
//   - Largest cure oven: usable interior dimensions (W × H × D) in feet.
//   - Max part weight: rated load on the line / largest fixture.
//   - Blast booth: usable footprint (W × D) and door clearance (H).
//   - Throughput: typical parts per shift OR linear feet per shift.
// Once filled, remove this comment block.
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
  "border-r border-b border-ink-200 md:border-b-0",
  "border-b border-ink-200 md:border-r md:border-b-0",
  "border-r border-ink-200",
  "",
];

export function CapacitySpecs() {
  return (
    <section
      aria-labelledby="capacity-heading"
      className="border-t border-ink-200 bg-canvas py-12 sm:py-16 md:py-20"
    >
      <Container>
        <BlurFade>
          <EyebrowLabel tone="dark" shimmer className="mb-3 sm:mb-4">
            CAPACITY AT A GLANCE
          </EyebrowLabel>
          <h2
            id="capacity-heading"
            className="mb-2 max-w-3xl font-display text-[26px] leading-tight tracking-tight text-ink-900 sm:text-[30px] md:text-[42px]"
          >
            Built for big work
          </h2>
          <p className="mb-8 max-w-2xl font-text text-base leading-relaxed text-ink-600 sm:mb-10">
            If your part fits, we can finish it. Hard numbers below — get
            anything outside this range on the phone with us anyway.
          </p>
        </BlurFade>

        <BlurFade delay={0.12}>
          <dl className="grid grid-cols-2 border border-ink-200 md:grid-cols-4">
            {SPECS.map((spec, i) => (
              <div
                key={spec.label}
                className={`px-4 py-6 text-center sm:px-6 sm:py-8 ${CELL_BORDERS[i]}`}
              >
                <dt className="font-text text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-400">
                  {spec.label}
                </dt>
                <dd className="mt-2 font-display text-xl leading-tight tracking-tight text-ink-900 sm:text-2xl md:text-[28px]">
                  {spec.value}
                </dd>
                <p className="mt-1 font-text text-[11px] leading-snug text-ink-400 sm:text-xs">
                  {spec.detail}
                </p>
              </div>
            ))}
          </dl>
        </BlurFade>
      </Container>
    </section>
  );
}
