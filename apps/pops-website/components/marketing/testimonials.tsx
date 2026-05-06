import { GOOGLE_RATING, TESTIMONIALS } from "../../content/testimonials";
import { Container } from "../layout/container";
import { BlurFade } from "../magicui/blur-fade";
import { EyebrowLabel } from "./eyebrow";

export function Testimonials() {
  return (
    <section
      aria-labelledby="testimonials-heading"
      className="pops-section-gold-wash border-t border-pops-yellow-500/25 py-16 sm:py-20 md:py-28"
    >
      <Container className="relative z-10">
        <BlurFade>
          <EyebrowLabel tone="dark" shimmer className="mb-3 sm:mb-4">
            WHAT CUSTOMERS SAY
          </EyebrowLabel>
          <div className="mb-6 h-px w-16 bg-gradient-to-r from-pops-yellow-500 to-transparent sm:mb-6 md:w-24" />
          <h2
            id="testimonials-heading"
            className="mb-2 max-w-3xl font-display text-[26px] leading-tight tracking-tight text-white sm:text-[30px] md:text-[42px]"
          >
            <span className="text-pops-yellow-500">{GOOGLE_RATING.stars}</span>{" "}
            <span className="text-pops-yellow-400/90">stars</span>
            <span className="text-white">
              {" "}
              across{" "}
              <span className="text-pops-yellow-500">{GOOGLE_RATING.reviews}</span>{" "}
              reviews
            </span>
          </h2>
          <p className="mb-8 max-w-2xl border-l-2 border-pops-yellow-500/40 pl-4 font-text text-base leading-relaxed text-ink-200 sm:mb-12 sm:pl-5">
            Real words from people who&apos;ve trusted us with their parts —
            from one-off panels to large commercial fleets.
          </p>
        </BlurFade>

        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {TESTIMONIALS.map((t, i) => (
            <li
              key={t.name}
              className="pops-card-surface relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-sm border border-pops-yellow-500/15 p-6 shadow-[0_0_32px_-16px_rgba(254,205,8,0.18)] sm:p-8"
            >
              <div
                aria-hidden="true"
                className="absolute left-0 top-0 h-0.5 w-10 bg-gradient-to-r from-pops-yellow-500 to-transparent sm:w-14"
              />
              <BlurFade delay={0.08 * i} yOffset={4}>
                <blockquote className="relative pt-1 font-display text-[18px] leading-snug tracking-tight text-white sm:text-[20px]">
                  <span aria-hidden="true" className="mr-1 text-pops-yellow-500">
                    &ldquo;
                  </span>
                  {t.quote}
                  <span aria-hidden="true" className="ml-1 text-pops-yellow-500">
                    &rdquo;
                  </span>
                </blockquote>
                <footer className="mt-6 border-t border-pops-yellow-500/35 pt-4">
                  <p className="font-text text-sm font-semibold text-white">
                    {t.name}
                  </p>
                  <p className="mt-1 font-text text-xs leading-snug text-ink-200">
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
