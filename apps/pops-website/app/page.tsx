import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "../components/layout/container";
import { Footer } from "../components/layout/footer";
import { Header } from "../components/layout/header";
import { CertificationMarquee } from "../components/marketing/certification-marquee";
import { EyebrowLabel } from "../components/marketing/eyebrow";
import { Hero } from "../components/marketing/hero";
import { IndustriesGrid } from "../components/marketing/industries-grid";
import { ServiceRow } from "../components/marketing/service-row";
import { Testimonials } from "../components/marketing/testimonials";
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

const STATS = [
  { label: "Founded",      value: "1972",      detail: "50+ years serving Florida" },
  { label: "Generations",  value: "4th Gen",   detail: "Family-owned & operated" },
  { label: "Specialties",  value: "5 Services", detail: "Coating, blasting & more" },
  { label: "Location",     value: "Lakeland, FL", detail: "Serving all of Polk County" },
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
        />

        {/* ── Stats / Trust bar ──
            Dome-of-light: a soft yellow glow rises from the bottom edge,
            so the bar reads as a warm arc lifting out of the dark hero
            without using any border-radius. Stat values are gradient-clipped
            from amber-500 → yellow-500 to give the numerals a subtle metallic
            warmth that nods to the painted-finish brand. */}
        <div className="border-b border-ink-700 bg-ink-900">
          <Container>
            <dl className="grid grid-cols-2 md:grid-cols-4">
              {STATS.map(({ label, value, detail }, i) => (
                <div
                  key={label}
                  className={`px-6 py-6 text-center md:py-8 ${STAT_CELL_CLASSES[i]}`}
                >
                  <dt className="font-text text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-300">
                    {label}
                  </dt>
                  <dd className="pops-text-grad mt-1 font-display text-2xl tracking-tight md:text-3xl">
                    {value}
                  </dd>
                  {detail && (
                    <p className="mt-0.5 font-text text-xs text-ink-300">{detail}</p>
                  )}
                </div>
              ))}
            </dl>
          </Container>
        </div>

        {/* ── Certification marquee ── */}
        <CertificationMarquee />

        {/* ── Services — numbered rows ── */}
        <section className="bg-ink-900 py-16 md:py-24" aria-labelledby="services-heading">
          <Container>
            <EyebrowLabel tone="dark" className="mb-4">OUR SERVICES</EyebrowLabel>
            <h2
              id="services-heading"
              className="mb-12 font-display text-[30px] leading-tight tracking-tight text-ink-100 md:text-[42px]"
            >
              Four generations of expertise
              <br className="hidden md:block" /> in industrial coatings
            </h2>
            <div>
              {SERVICES.map((service) => (
                <ServiceRow key={service.href} {...service} />
              ))}
              <div className="border-t border-ink-700" aria-hidden="true" />
            </div>
          </Container>
        </section>

        {/* ── Industries we serve ── */}
        <IndustriesGrid />

        {/* ── Commitment · Infrastructure · Standards ── */}
        <section
          className="border-t border-ink-700 bg-ink-800 py-16 md:py-24"
          aria-labelledby="commitment-heading"
        >
          <Container>
            <div className="grid grid-cols-1 gap-12 md:grid-cols-3">

              <div>
                <EyebrowLabel tone="dark" className="mb-4">COMMITMENT</EyebrowLabel>
                <h2
                  id="commitment-heading"
                  className="mb-4 font-display text-[26px] leading-tight tracking-tight text-ink-100"
                >
                  It&apos;s a family thing
                </h2>
                <p className="font-text text-base leading-relaxed text-ink-300">
                  With a rich history rooted in a deep understanding of the industry,
                  Pop&apos;s Industrial Coatings blends tradition with a contemporary approach,
                  solidifying our position as a principal company in industrial finishing.
                </p>
                <p className="mt-4 font-text text-base leading-relaxed text-ink-300">
                  We don&apos;t just meet expectations — we exceed them. Let us show you
                  what commitment to precision and technical expertise looks like.
                </p>
              </div>

              <div>
                <EyebrowLabel tone="dark" className="mb-4">INFRASTRUCTURE</EyebrowLabel>
                <h2 className="mb-4 font-display text-[26px] leading-tight tracking-tight text-ink-100">
                  Our Facilities &amp; Equipment
                </h2>
                <p className="font-text text-base leading-relaxed text-ink-300">
                  In constant expansion to meet the demands of our customers, Pop&apos;s
                  facilities give us ample room for the largest projects.
                </p>
                <p className="mt-4 font-text text-base leading-relaxed text-ink-300">
                  State-of-the-art equipment and highly skilled personnel make all
                  the difference in your project&apos;s success.
                </p>
                <div className="mt-6">
                  <Button asChild variant="outline" size="compact">
                    <Link href="/request-a-quote/facilities-equipment">View Facilities</Link>
                  </Button>
                </div>
              </div>

              <div>
                <EyebrowLabel tone="dark" className="mb-4">STANDARDS</EyebrowLabel>
                <h2 className="mb-4 font-display text-[26px] leading-tight tracking-tight text-ink-100">
                  Industry Standards &amp; Certifications
                </h2>
                <p className="font-text text-base leading-relaxed text-ink-300">
                  We adhere to strict industry specifications and best practices.
                  Read about our certifications and the standards that guide us.
                </p>
                <p className="mt-4 font-text text-base leading-relaxed text-ink-300">
                  We love questions about coatings — don&apos;t know the best product
                  for your project? Ask us.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button asChild variant="outline" size="compact">
                    <Link href="/request-a-quote/standards-specifications-certifications">
                      Our Certifications
                    </Link>
                  </Button>
                  <Button asChild variant="secondary" size="compact">
                    <Link href="/request-a-quote">Ask us</Link>
                  </Button>
                </div>
              </div>

            </div>
          </Container>
        </section>

        {/* ── Testimonials ── */}
        <Testimonials />

        {/* ── Family photo ──
            Replaces the flat `bg-ink-900/50` scrim with a radial-at-center-bottom
            ember glow: warmth lifts up from the CTA edge into a near-black sky.
            The image still shows; the dome adds depth and ties the section into
            the warm-deep palette without requiring extra art. */}
        <section
          aria-label="Four generations of the Pop's Industrial Coatings family"
          className="relative min-h-[400px] overflow-hidden bg-ink-900 md:min-h-[500px]"
        >
          <Image
            src="/images/pops-4-generations.jpg"
            alt="Four generations of the Pop's Industrial Coatings family — founder Marcus Woods and the leadership team in Lakeland, FL"
            fill
            sizes="100vw"
            className="object-cover object-center"
          />
          <div
            aria-hidden="true"
            className="pops-grad-ember-overlay absolute inset-0"
          />
          <div className="absolute bottom-0 left-0 right-0">
            <Container className="pb-12">
              <Button asChild variant="primary">
                <Link href="/about-us">About Us</Link>
              </Button>
            </Container>
          </div>
        </section>

        {/* ── CTA Banner — yellow → tan sunset ──
            Same yellow energy, but as a 121° gradient from yellow-300 to
            tan-400 it reads as a painted finish rather than a flat block.
            Subtle on-brand change: the yellow identity is preserved. */}
        <section
          className="pops-grad-sunset-light py-16 md:py-20"
          aria-labelledby="cta-heading"
        >
          <Container>
            <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div>
                <h2
                  id="cta-heading"
                  className="font-display text-[30px] leading-tight tracking-tight text-ink-900 md:text-[40px]"
                >
                  Ready to start your project?
                </h2>
                <p className="mt-3 max-w-xl font-text text-base leading-relaxed text-ink-800">
                  From powder coating to abrasive blasting — get a quote within 24 hours.
                </p>
              </div>
              <div className="shrink-0">
                <Button asChild variant="dark">
                  <Link href="/request-a-quote">Request a Quote →</Link>
                </Button>
              </div>
            </div>
          </Container>
        </section>

      </main>
      <Footer />
    </>
  );
}
