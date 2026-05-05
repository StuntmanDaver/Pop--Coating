import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Container } from "../components/layout/container";
import { Footer } from "../components/layout/footer";
import { Header } from "../components/layout/header";
import { BlurFade } from "../components/magicui/blur-fade";
import { BorderBeam } from "../components/magicui/border-beam";
import { NumberTicker } from "../components/magicui/number-ticker";
import { CapacitySpecs } from "../components/marketing/capacity-specs";
import { CertificationMarquee } from "../components/marketing/certification-marquee";
import { EyebrowLabel } from "../components/marketing/eyebrow";
import { Hero } from "../components/marketing/hero";
import { IndustriesGrid } from "../components/marketing/industries-grid";
import { ServiceRow } from "../components/marketing/service-row";
import { JsonLd } from "../components/seo/json-ld";
import { Button } from "../components/ui/button";
import { getOrgJsonLd } from "../lib/jsonld";

export const metadata: Metadata = {
  title: {
    absolute: "Pop's Industrial Coatings: Industrial Paint & Powder Coating",
  },
  description:
    "Serving the greater Lakeland & Polk County FL area for Industrial Painting, Sandblasting, & Powder Coating for over 50 years - We know Industrial Painting!",
};

const SERVICES = [
  {
    number: "01",
    name: "Wet Paint Coatings",
    lede: "Precision & expertise for industrial wet paint applications.",
    image: "/images/industrial-painting-lakeland-fl-1024x683-1.jpg",
    href: "/industrial-coatings-services/wet-paint-coatings",
    alt: "Industrial wet paint coating work at Pop's Industrial Coatings, Lakeland FL",
  },
  {
    number: "02",
    name: "Complex Coating",
    lede: "Meticulous baking for superior longevity.",
    image: "/images/industrial-complex-coatings-1.jpg",
    href: "/industrial-coatings-services/complex-coating",
    alt: "Complex industrial coating and baking services at Pop's Industrial Coatings",
  },
  {
    number: "03",
    name: "Abrasive Media Blasting",
    lede: "To rigorous industry standards.",
    image: "/images/abrasive-media-blasting.jpg",
    href: "/industrial-coatings-services/abrasive-media-blasting",
    alt: "Abrasive media blasting at Pop's Industrial Coatings in Lakeland, FL",
  },
  {
    number: "04",
    name: "Powder Coating",
    lede: "Elevate durability and appearance.",
    image: "/images/industrial-powder-coating-lakeland-fl-IMG_3687.jpg",
    href: "/industrial-coatings-services/powder-coating",
    alt: "Powder coating services at Pop's Industrial Coatings, Lakeland FL",
  },
  {
    number: "05",
    name: "Large Capacity Powder Coating",
    lede: "Tailored for significant scale.",
    image: "/images/large-capacity-powder-coating.jpg",
    href: "/industrial-coatings-services/large-capacity-powder-coating",
    alt: "Large capacity powder coating at Pop's Industrial Coatings",
  },
];

type Stat = {
  label: string;
  detail: string;
  /** Animated numeric portion. Omit for static text-only stats. */
  count?: { value: number; from: number; suffix?: string; grouping?: boolean };
  /** Static value used when `count` is omitted. */
  text?: string;
};

const STATS: Stat[] = [
  { label: "Founded",     detail: "50+ years serving Florida",   count: { value: 1972, from: 1900, grouping: false } },
  { label: "Generations", detail: "Family-owned & operated",     count: { value: 4, from: 0, suffix: "th Gen" } },
  { label: "Specialties", detail: "Coating, blasting & more",    count: { value: 5, from: 0, suffix: " Services" } },
  { label: "Location",    detail: "Serving all of Polk County",  text: "Lakeland, FL" },
];

// Per-cell border classes for a 2-col (mobile) → 4-col (desktop) grid.
const STAT_CELL_CLASSES = [
  "border-r border-b border-ink-200 md:border-b-0",
  "border-b border-ink-200 md:border-r md:border-b-0",
  "border-r border-ink-200",
  "",
];

export default function HomePage() {
  return (
    <>
      <JsonLd data={getOrgJsonLd()} />
      <Header />
      <main id="content">

        {/* ── Hero ── */}
        <Hero
          eyebrow="FAMILY OWNED · LAKELAND, FL · SINCE 1972"
          heading="Four generations of industrial finishing — done right the first time."
          lede="Powder coating, abrasive blasting, and wet paint for aerospace, defense, and heavy equipment."
          primaryCta={{ label: "Request a Quote", href: "/request-a-quote" }}
          secondaryCta={{ label: "See our work", href: "/industrial-coatings-services" }}
          backgroundImage="/images/slide-01.jpg"
          shimmerEyebrow
        />

        {/* ── Stats / Trust bar ── */}
        <div className="border-b border-ink-200 bg-canvas">
          <Container>
            <dl className="grid grid-cols-2 md:grid-cols-4">
              {STATS.map(({ label, count, text, detail }, i) => (
                <div
                  key={label}
                  className={`px-3 py-5 text-center sm:px-6 sm:py-6 md:py-8 ${STAT_CELL_CLASSES[i]}`}
                >
                  <dt className="font-text text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-400">
                    {label}
                  </dt>
                  <dd className="mt-1 font-display text-xl leading-tight tracking-tight text-ink-900 sm:text-2xl md:text-3xl">
                    {count ? (
                      <>
                        <NumberTicker
                          value={count.value}
                          startValue={count.from}
                          delay={0.15 * i}
                          useGrouping={count.grouping ?? true}
                        />
                        {count.suffix ? <span>{count.suffix}</span> : null}
                      </>
                    ) : (
                      text
                    )}
                  </dd>
                  {detail && (
                    <p className="mt-1 font-text text-[11px] leading-snug text-ink-400 sm:text-xs">{detail}</p>
                  )}
                </div>
              ))}
            </dl>
          </Container>
        </div>

        {/* ── Certification rail ── */}
        <CertificationMarquee />

        {/* ── Services — numbered rows ── */}
        <section className="bg-canvas py-12 sm:py-16 md:py-24" aria-labelledby="services-heading">
          <Container>
            <BlurFade>
              <EyebrowLabel tone="dark" shimmer className="mb-3 sm:mb-4">OUR SERVICES</EyebrowLabel>
              <h2
                id="services-heading"
                className="mb-8 font-display text-[26px] leading-tight tracking-tight text-ink-900 sm:mb-12 sm:text-[30px] md:text-[42px]"
              >
                Four generations of expertise
                <br className="hidden md:block" /> in industrial coatings
              </h2>
            </BlurFade>
            <div>
              {SERVICES.map((service, i) => (
                <BlurFade key={service.href} delay={0.08 * i} yOffset={4}>
                  <ServiceRow {...service} />
                </BlurFade>
              ))}
              <div className="border-t border-ink-200" aria-hidden="true" />
            </div>
          </Container>
        </section>

        {/* ── Industries served ── */}
        <IndustriesGrid />

        {/* ── Capacity specs (TODO: replace placeholder values) ── */}
        <CapacitySpecs />

        {/* ── Commitment · Infrastructure · Standards ── */}
        <section
          className="border-t border-ink-200 bg-canvas py-12 sm:py-16 md:py-24"
          aria-labelledby="commitment-heading"
        >
          <Container>
            <div className="grid grid-cols-1 gap-10 sm:gap-12 md:grid-cols-3">

              <BlurFade>
                <EyebrowLabel tone="dark" className="mb-4">COMMITMENT</EyebrowLabel>
                <h2
                  id="commitment-heading"
                  className="mb-4 font-display text-[26px] leading-tight tracking-tight text-ink-900"
                >
                  It&apos;s a family thing
                </h2>
                <p className="font-text text-base leading-relaxed text-ink-600">
                  With a rich history rooted in a deep understanding of the industry,
                  Pop&apos;s Industrial Coatings blends tradition with a contemporary approach,
                  solidifying our position as a principal company in industrial finishing.
                </p>
                <p className="mt-4 font-text text-base leading-relaxed text-ink-600">
                  We don&apos;t just meet expectations — we exceed them. Let us show you
                  what commitment to precision and technical expertise looks like.
                </p>
              </BlurFade>

              <BlurFade delay={0.12}>
                <EyebrowLabel tone="dark" className="mb-4">INFRASTRUCTURE</EyebrowLabel>
                <h2 className="mb-4 font-display text-[26px] leading-tight tracking-tight text-ink-900">
                  Our Facilities &amp; Equipment
                </h2>
                <p className="font-text text-base leading-relaxed text-ink-600">
                  In constant expansion to meet the demands of our customers, Pop&apos;s
                  facilities give us ample room for the largest projects.
                </p>
                <p className="mt-4 font-text text-base leading-relaxed text-ink-600">
                  State-of-the-art equipment and highly skilled personnel make all
                  the difference in your project&apos;s success.
                </p>
                <div className="mt-6">
                  <Button asChild variant="outline" size="compact">
                    <Link href="/request-a-quote/facilities-equipment">View Facilities</Link>
                  </Button>
                </div>
              </BlurFade>

              <BlurFade delay={0.24}>
                <EyebrowLabel tone="dark" className="mb-4">STANDARDS</EyebrowLabel>
                <h2 className="mb-4 font-display text-[26px] leading-tight tracking-tight text-ink-900">
                  Industry Standards &amp; Certifications
                </h2>
                <p className="font-text text-base leading-relaxed text-ink-600">
                  We adhere to strict industry specifications and best practices.
                  Read about our certifications and the standards that guide us.
                </p>
                <p className="mt-4 font-text text-base leading-relaxed text-ink-600">
                  We love questions about coatings — don&apos;t know the best product
                  for your project? Ask us.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button asChild variant="outline" size="compact">
                    <Link href="/request-a-quote/standards-specifications-certifications">
                      Our Certifications
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" size="compact">
                    <Link href="/request-a-quote">Ask us</Link>
                  </Button>
                </div>
              </BlurFade>

            </div>
          </Container>
        </section>

        {/* ── Family photo ── */}
        <section
          aria-label="Four generations of the Pop's Industrial Coatings family"
          className="relative min-h-[320px] overflow-hidden bg-ink-900 sm:min-h-[400px] md:min-h-[500px]"
        >
          <Image
            src="/images/pops-4-generations.jpg"
            alt="Four generations of the Pop's Industrial Coatings family — founder Marcus Woods and the leadership team in Lakeland, FL"
            fill
            sizes="100vw"
            className="object-cover object-center"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-ink-900/50" />
          <div className="absolute bottom-0 left-0 right-0">
            <Container className="pb-8 sm:pb-12">
              <Button asChild variant="primary" className="w-full sm:w-auto">
                <Link href="/about-us">About Us</Link>
              </Button>
            </Container>
          </div>
        </section>

        {/* ── CTA Banner — yellow card on dark, with traced border beam ── */}
        <section
          className="bg-ink-900 py-12 sm:py-16 md:py-20"
          aria-labelledby="cta-heading"
        >
          <Container>
            <div className="relative overflow-hidden rounded-md bg-pops-yellow-500 px-6 py-10 sm:px-10 sm:py-12 md:px-14 md:py-14">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between md:gap-8">
                <div>
                  <h2
                    id="cta-heading"
                    className="font-display text-[26px] leading-tight tracking-tight text-ink-900 sm:text-[30px] md:text-[40px]"
                  >
                    Ready to start your project?
                  </h2>
                  <p className="mt-3 max-w-xl font-text text-base leading-relaxed text-ink-800">
                    From powder coating to abrasive blasting — get a quote within 24 hours.
                  </p>
                </div>
                <div className="shrink-0">
                  <Button asChild variant="dark" className="w-full sm:w-auto">
                    <Link href="/request-a-quote">Request a Quote →</Link>
                  </Button>
                </div>
              </div>

              {/* Two beams traveling in tandem along the card's border, half a loop apart. */}
              <BorderBeam
                size={120}
                pathRadius={8}
                duration={9}
                colorFrom="#1B1F27"
                colorTo="#3F4654"
                borderWidth={2}
              />
              <BorderBeam
                size={120}
                pathRadius={8}
                duration={9}
                delay={4.5}
                colorFrom="#1B1F27"
                colorTo="#3F4654"
                borderWidth={2}
              />
            </div>
          </Container>
        </section>

      </main>
      <Footer />
    </>
  );
}
