import { BlurFade } from "../magicui/blur-fade";
import { Container } from "../layout/container";
import { EyebrowLabel } from "./eyebrow";

type Testimonial = {
  /** Pull-quote shown in display type. Trimmed where the original was long. */
  quote: string;
  /** Reviewer's name. */
  name: string;
  /** Honest descriptor — never invent a title or company. */
  context: string;
  /** Approximate review date for trust signaling. */
  when: string;
};

// Sourced from Pops's verified Google reviews (4.7 / 68 reviews as of 2026-05).
// Quotes lightly trimmed for length; meaning preserved verbatim.
const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "The best large scale paint and powder coater around. Exceptional customer service and communication.",
    name: "David Wallace",
    context: "Verified Google Review · Local Guide",
    when: "2026",
  },
  {
    quote:
      "I have done business with most of the paint shops in this area. Attention to detail best describes this company. You really get what you pay for.",
    name: "Captain Ralph",
    context: "Verified Google Review · Local Guide",
    when: "2017",
  },
  {
    quote:
      "First class friendly. They told me that since the panel was aluminum, glass bead blasting would be best. The panel came out great.",
    name: "Tunis Cooper",
    context: "Verified Google Review · Local Guide",
    when: "2025",
  },
  {
    quote:
      "Great people to work with. Quality job. I would recommend for any large commercial work.",
    name: "Lucas Pemberton",
    context: "Verified Google Review · Local Guide",
    when: "2025",
  },
];

export function Testimonials() {
  return (
    <section
      aria-labelledby="testimonials-heading"
      className="border-t border-ink-200 bg-canvas py-12 sm:py-16 md:py-24"
    >
      <Container>
        <BlurFade>
          <EyebrowLabel tone="dark" shimmer className="mb-3 sm:mb-4">
            WHAT CUSTOMERS SAY
          </EyebrowLabel>
          <h2
            id="testimonials-heading"
            className="mb-2 max-w-3xl font-display text-[26px] leading-tight tracking-tight text-ink-900 sm:text-[30px] md:text-[42px]"
          >
            4.7 stars across 68 reviews
          </h2>
          <p className="mb-8 max-w-2xl font-text text-base leading-relaxed text-ink-600 sm:mb-12">
            Real words from people who&apos;ve trusted us with their parts —
            from one-off panels to large commercial fleets.
          </p>
        </BlurFade>

        <ul className="grid grid-cols-1 gap-px bg-ink-200 sm:grid-cols-2 lg:grid-cols-4">
          {TESTIMONIALS.map((t, i) => (
            <li
              key={t.name}
              className="flex h-full flex-col justify-between gap-6 bg-canvas p-6 sm:p-8"
            >
              <BlurFade delay={0.08 * i} yOffset={4}>
                <blockquote className="font-display text-[18px] leading-snug tracking-tight text-ink-900 sm:text-[20px]">
                  <span aria-hidden="true" className="mr-1 text-pops-yellow-500">
                    &ldquo;
                  </span>
                  {t.quote}
                  <span aria-hidden="true" className="ml-1 text-pops-yellow-500">
                    &rdquo;
                  </span>
                </blockquote>
                <footer className="mt-6 border-t border-ink-200 pt-4">
                  <p className="font-text text-sm font-semibold text-ink-900">
                    {t.name}
                  </p>
                  <p className="mt-1 font-text text-xs leading-snug text-ink-500">
                    {t.context} · {t.when}
                  </p>
                </footer>
              </BlurFade>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
