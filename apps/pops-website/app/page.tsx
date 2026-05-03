import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Container } from "../components/layout/container";
import { Footer } from "../components/layout/footer";
import { Header } from "../components/layout/header";
import { Section } from "../components/layout/section";
import { EyebrowLabel } from "../components/marketing/eyebrow";
import { Hero } from "../components/marketing/hero";
import { ServiceTile } from "../components/marketing/service-tile";
import { Button } from "../components/ui/button";

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
    alt: "Large capacity powder coating at Pop's Industrial Coatings — accommodating the biggest industrial projects",
  },
];

export default function HomePage() {
  return (
    <>
      <Header />
      <main id="content">
        {/* Hero — rebuilt per design principles §6.2; replaces 3-slide tagline rotator */}
        <Hero
          eyebrow="FAMILY OWNED · LAKELAND, FL · SINCE 1972"
          heading="Four generations of industrial finishing — done right the first time."
          lede="Powder coating, abrasive blasting, and wet paint for aerospace, defense, and heavy equipment."
          primaryCta={{ label: "Request a Quote", href: "/request-a-quote" }}
          secondaryCta={{ label: "See our work", href: "/industrial-coatings-services" }}
          backgroundImage="/images/slide-01.jpg"
        />

        {/* Services grid */}
        <Section tone="dark">
          <Container>
            <EyebrowLabel className="mb-4">OUR SERVICES</EyebrowLabel>
            <h2 className="mb-10 font-display text-[28px] leading-[1.2] text-ink-100">
              Four generations of expertise in industrial coatings
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-5">
              {SERVICES.map((service) => (
                <ServiceTile key={service.href} {...service} />
              ))}
            </div>
          </Container>
        </Section>

        {/* Commitment + Facilities & Equipment + Industry Standards — 3-column */}
        <Section tone="dark" className="border-t border-ink-700">
          <Container>
            <div className="grid grid-cols-1 gap-12 md:grid-cols-3">

              {/* Column 1: Commitment */}
              <div>
                <EyebrowLabel className="mb-4">COMMITMENT</EyebrowLabel>
                <h2 className="mb-4 font-display text-[28px] leading-[1.2] text-ink-100">
                  It&apos;s a family thing
                </h2>
                <p className="font-text text-base leading-relaxed text-ink-100">
                  With a rich history rooted in a deep understanding of the industry,
                  Pop&apos;s Industrial Coatings seamlessly blends tradition with a
                  contemporary approach to applications, solidifying our position as a
                  principal company in the industrial coating sector.
                </p>
                <p className="mt-4 font-text text-base leading-relaxed text-ink-100">
                  Choose Pop&apos;s Industrial Coatings for your next project. We don&apos;t
                  just meet expectations, we exceed them. Let us show you what
                  commitment to precision and technical expertise looks like.
                </p>
              </div>

              {/* Column 2: Our Facilities & Equipment */}
              <div>
                <EyebrowLabel className="mb-4">INFRASTRUCTURE</EyebrowLabel>
                <h2 className="mb-4 font-display text-[28px] leading-[1.2] text-ink-100">
                  Our Facilities &amp; Equipment
                </h2>
                <p className="font-text text-base leading-relaxed text-ink-100">
                  In constant expansion to meet the demands of our customers, Pop&apos;s
                  facilities give us ample room for the largest projects.
                </p>
                <p className="mt-4 font-text text-base leading-relaxed text-ink-100">
                  State-of-the-art equipment and highly skilled personnel makes all
                  the difference in your project&apos;s success.
                </p>
                <div className="mt-6">
                  <Button asChild variant="secondary">
                    <Link href="/request-a-quote/facilities-equipment">View Facilities</Link>
                  </Button>
                </div>
              </div>

              {/* Column 3: Industry Standards & High Performance Solutions */}
              <div>
                <EyebrowLabel className="mb-4">STANDARDS</EyebrowLabel>
                <h2 className="mb-4 font-display text-[28px] leading-[1.2] text-ink-100">
                  Industry Standards &amp; High Performance Solutions
                </h2>
                <p className="font-text text-base leading-relaxed text-ink-100">
                  We adhere to strict industry specifications and best practices. Read
                  about our certifications &amp; the standards that guide us.
                </p>
                <p className="mt-4 font-text text-base leading-relaxed text-ink-100">
                  We love questions about coatings. Don&apos;t know the best product to
                  meet your project&apos;s requirements?
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button asChild variant="secondary">
                    <Link href="/request-a-quote/standards-specifications-certifications">
                      Our Certifications
                    </Link>
                  </Button>
                  <Button asChild variant="ghost">
                    <Link href="/request-a-quote">Ask us!</Link>
                  </Button>
                </div>
              </div>

            </div>
          </Container>
        </Section>

        {/* Family photo section */}
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
          <div aria-hidden="true" className="absolute inset-0 bg-ink-900/50" />
          <div className="absolute bottom-0 left-0 right-0">
            <Container className="pb-12">
              <Button asChild variant="primary">
                <Link href="/about-us">About Us</Link>
              </Button>
            </Container>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
