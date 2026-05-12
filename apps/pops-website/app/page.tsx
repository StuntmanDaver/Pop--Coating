import type { Metadata } from "next";
import Image from "next/image";
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
    name: "Wet Paint Coatings",
    lede: "Precision & expertise for industrial wet paint applications.",
    image: "/images/industrial-painting-lakeland-fl-1024x683-1.jpg",
    href: "/industrial-coatings-services/wet-paint-coatings",
    alt: "Industrial wet paint coating work at Pop's Industrial Coatings, Lakeland FL",
  },
  {
    name: "Complex Coating",
    lede: "Meticulous baking for superior longevity.",
    image: "/images/industrial-complex-coatings-1.jpg",
    href: "/industrial-coatings-services/complex-coating",
    alt: "Complex industrial coating and baking services at Pop's Industrial Coatings",
  },
  {
    name: "Abrasive Media Blasting",
    lede: "To rigorous industry standards.",
    image: "/images/abrasive-media-blasting.jpg",
    href: "/industrial-coatings-services/abrasive-media-blasting",
    alt: "Abrasive media blasting at Pop's Industrial Coatings in Lakeland, FL",
  },
  {
    name: "Powder Coating",
    lede: "Elevate durability and appearance.",
    image: "/images/powder-coat-gallery-toll-gantry.png",
    href: "/industrial-coatings-services/powder-coating",
    alt: "Large powder-coated highway toll gantry — Pop's Industrial Coatings, Lakeland FL",
  },
  {
    name: "Large Capacity Coatings",
    lede: "Tailored for significant scale.",
    image: "/images/large-capacity-powder-coating.png",
    href: "/industrial-coatings-services/large-capacity-powder-coating",
    alt: "Large capacity coatings at Pop's Industrial Coatings",
  },
];

const STATS = [
  { label: "Founded",      value: "1972",      detail: "50+ years serving Florida" },
  { label: "Generations",  value: "4th", detail: "Family-owned & operated" },
  { label: "Specialties",  value: "5+\u00A0Services", detail: "Coating, blasting & more" },
  { label: "Location",     value: "Lakeland,\u00A0FL", detail: "Serving all of Polk County" },
];

// Per-cell border classes for a 2-col (mobile) → 4-col (desktop) grid.
const STAT_CELL_CLASSES = [
  "border-r border-b border-pops-yellow-500/15 md:border-b-0",
  "border-b border-pops-yellow-500/15 md:border-r md:border-b-0",
  "border-r border-pops-yellow-500/15",
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
          eyebrow={`FAMILY OWNED · LAKELAND,\u00A0FL`}
          heading="Serving the Industry Since 1972"
          headingClassName="text-balance text-[clamp(3rem,8vw,7.75rem)] max-w-5xl"
          lede="Premium industrial powder coating, wet paint, abrasive blasting, complex coating systems, and large-capacity finishing for mission-critical parts and structures."
          ledeClassName="max-w-3xl text-base leading-relaxed text-ink-100 sm:text-lg md:mt-8 md:text-xl"
          primaryCta={{ label: "Request a Quote", href: "/request-a-quote" }}
          secondaryCta={{ label: "Explore Services", href: "/industrial-coatings-services" }}
          animateCopyOnLoad
          cinematic
          backgroundImage="/images/slide-01.jpg"
        />

        {/* ── Stats / Trust bar ──
            Dome-of-light: a soft yellow glow rises from the bottom edge,
            so the bar reads as a warm arc lifting out of the dark hero
            without using any border-radius. Stat values are gradient-clipped
            from amber-500 → yellow-500 to give the numerals a subtle metallic
            warmth that nods to the painted-finish brand. */}
        <div className="pops-section-gold-wash pops-section-edge-glow border-b border-pops-yellow-500/25">
          <div className="relative z-10">
            <div className="pops-section-divider w-full" aria-hidden="true" />
            <Container>
              <div className="grid grid-cols-2 md:grid-cols-4">
                {STATS.map(({ label, value, detail }, i) => (
                  <div
                    key={label}
                    className={`px-6 py-7 text-center transition-colors duration-300 hover:bg-pops-yellow-500/[0.04] md:py-9 ${STAT_CELL_CLASSES[i]}`}
                  >
                    <p className="font-text text-[10px] font-semibold uppercase tracking-[0.1em] text-pops-yellow-500/90">
                      {label}
                    </p>
                    <p className="pops-text-grad mt-1 whitespace-nowrap font-display text-lg tracking-tight sm:text-2xl md:text-3xl">
                      {value}
                    </p>
                    {detail && (
                      <p className="mt-0.5 font-text text-xs text-ink-200">{detail}</p>
                    )}
                  </div>
                ))}
              </div>
            </Container>
          </div>
        </div>

        {/* ── Certification marquee ── */}
        <CertificationMarquee />

        {/* ── Services rows ── */}
        <section
          className="pops-section-gold-wash pops-section-gold-wash--no-top-rule py-20 md:py-28"
          aria-labelledby="services-heading"
        >
          <Container className="relative z-10">
            <div className="mb-12 md:mb-16">
              <EyebrowLabel tone="dark" className="mb-4">
                OUR SERVICES
              </EyebrowLabel>
              <h2
                id="services-heading"
                className="font-display text-[30px] leading-[1.05] tracking-tight text-white md:text-[44px] lg:text-[48px]"
              >
                Four generations of expertise
                <br className="hidden md:block" /> in industrial coatings
              </h2>
            </div>
            <div className="flex flex-col gap-3 md:gap-4">
              {SERVICES.map((service) => (
                <ServiceRow key={service.href} {...service} />
              ))}
            </div>
          </Container>
        </section>

        {/* ── Industries we serve ── */}
        <IndustriesGrid />

        {/* ── Commitment · Infrastructure · Standards ── */}
        <section
          className="pops-section-gold-wash border-t border-pops-yellow-500/20 py-20 md:py-28"
          aria-labelledby="commitment-heading"
        >
          <Container className="relative z-10">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">

              <div className="pops-card-surface rounded-sm p-8">
                <EyebrowLabel tone="dark" className="mb-4">COMMITMENT</EyebrowLabel>
                <h2
                  id="commitment-heading"
                  className="mb-4 font-display text-[26px] leading-tight tracking-tight text-white"
                >
                  It&apos;s a family thing
                </h2>
                <p className="font-text text-base leading-relaxed text-ink-200">
                  With a rich history rooted in a deep understanding of the industry,
                  Pop&apos;s Industrial Coatings blends tradition with a contemporary approach,
                  solidifying our position as a principal company in industrial finishing.
                </p>
                <p className="mt-4 font-text text-base leading-relaxed text-ink-200">
                  We don&apos;t just meet expectations — we exceed them. Let us show you
                  what commitment to precision and technical expertise looks like.
                </p>
              </div>

              <div className="pops-card-surface rounded-sm p-8">
                <EyebrowLabel tone="dark" className="mb-4">INFRASTRUCTURE</EyebrowLabel>
                <h2 className="mb-4 font-display text-[26px] leading-tight tracking-tight text-white">
                  Our Facilities &amp; Equipment
                </h2>
                <p className="font-text text-base leading-relaxed text-ink-200">
                  In constant expansion to meet the demands of our customers, Pop&apos;s
                  facilities give us ample room for the largest projects.
                </p>
                <p className="mt-4 font-text text-base leading-relaxed text-ink-200">
                  State-of-the-art equipment and highly skilled personnel make all
                  the difference in your project&apos;s success.
                </p>
                <div className="mt-6">
                  <Button asChild variant="outline" size="compact">
                    <Link href="/request-a-quote/facilities-equipment">View Facilities</Link>
                  </Button>
                </div>
              </div>

              <div className="pops-card-surface rounded-sm p-8">
                <EyebrowLabel tone="dark" className="mb-4">STANDARDS</EyebrowLabel>
                <h2 className="mb-4 font-display text-[26px] leading-tight tracking-tight text-white">
                  Industry Standards &amp; Certifications
                </h2>
                <p className="font-text text-base leading-relaxed text-ink-200">
                  We adhere to strict industry specifications and best practices.
                  Read about our certifications and the standards that guide us.
                </p>
                <p className="mt-4 font-text text-base leading-relaxed text-ink-200">
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

        {/* ── About strip — worker photo (blacked out) + CTA ── */}
        <section
          aria-label="About Pop's Industrial Coatings"
          className="relative min-h-[560px] overflow-hidden md:min-h-[720px]"
        >
          <div className="absolute inset-0 z-0">
            <Image
              src="/images/pops-about-worker.png"
              alt="Industrial coating technician spray finishing a large part at Pop's Industrial Coatings, Lakeland FL"
              fill
              sizes="100vw"
              className="object-cover object-center"
            />
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-[1] bg-black/55"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-black/85 via-black/35 to-black/55"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_80%_70%_at_50%_100%,rgba(254,205,8,0.1),transparent_55%)]"
          />
          <div className="absolute bottom-0 left-0 right-0 z-10">
            <Container className="pb-12 pt-20 md:pb-14 md:pt-28">
              <EyebrowLabel tone="dark" className="mb-3">
                ABOUT US
              </EyebrowLabel>
              <p className="mb-8 max-w-lg font-text text-base leading-relaxed text-ink-200 md:text-lg">
                Four generations of industrial coating expertise — family owned and operated in Lakeland since 1972.
              </p>
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
          className="pops-grad-sunset-light relative py-20 md:py-24"
          aria-labelledby="cta-heading"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_100%_50%,rgba(0,0,0,0.08),transparent)]"
          />
          <Container className="relative">
            <div className="flex flex-col gap-10 md:flex-row md:items-center md:justify-between md:gap-12">
              <div>
                <h2
                  id="cta-heading"
                  className="font-display text-[32px] leading-[1.05] tracking-tight text-black md:text-[44px]"
                >
                  Ready to start your project?
                </h2>
                <p className="mt-4 max-w-xl font-text text-base font-medium leading-relaxed text-black/80 md:text-lg">
                  From powder coating to abrasive blasting — get a quote within 24 hours.
                </p>
              </div>
              <div className="shrink-0">
                <Button asChild variant="dark" className="min-h-12 px-8">
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
