import { GOOGLE_RATING, TESTIMONIALS } from "../../content/testimonials";
import { Container } from "../layout/container";
import { BlurFade } from "../magicui/blur-fade";
import { EyebrowLabel } from "./eyebrow";

export function Testimonials() {
  return (
    <section
      aria-labelledby="testimonials-heading"
      className="border-t border-ink-700 bg-ink-900 py-12 sm:py-16 md:py-24"
    >
      <Container>
        <BlurFade>
          <EyebrowLabel tone="dark" shimmer className="mb-3 sm:mb-4">
            WHAT CUSTOMERS SAY
          </EyebrowLabel>
          <h2
            id="testimonials-heading"
            className="mb-2 max-w-3xl font-display text-[26px] leading-tight tracking-tight text-ink-100 sm:text-[30px] md:text-[42px]"
          >
            {GOOGLE_RATING.stars} stars across {GOOGLE_RATING.reviews} reviews
          </h2>
          <p className="mb-8 max-w-2xl font-text text-base leading-relaxed text-ink-300 sm:mb-12">
            Real words from people who&apos;ve trusted us with their parts —
            from one-off panels to large commercial fleets.
          </p>
        </BlurFade>

        <ul className="grid grid-cols-1 gap-px bg-ink-700 sm:grid-cols-2 lg:grid-cols-4">
          {TESTIMONIALS.map((t, i) => (
            <li
              key={t.name}
              className="flex h-full flex-col justify-between gap-6 bg-ink-800 p-6 sm:p-8"
            >
              <BlurFade delay={0.08 * i} yOffset={4}>
                <blockquote className="font-display text-[18px] leading-snug tracking-tight text-ink-100 sm:text-[20px]">
                  <span aria-hidden="true" className="mr-1 text-pops-yellow-500">
                    &ldquo;
                  </span>
                  {t.quote}
                  <span aria-hidden="true" className="ml-1 text-pops-yellow-500">
                    &rdquo;
                  </span>
                </blockquote>
                <footer className="mt-6 border-t border-ink-700 pt-4">
                  <p className="font-text text-sm font-semibold text-ink-100">
                    {t.name}
                  </p>
                  <p className="mt-1 font-text text-xs leading-snug text-ink-300">
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
