import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "../../../components/layout/container";
import { Footer } from "../../../components/layout/footer";
import { Header } from "../../../components/layout/header";
import { Section } from "../../../components/layout/section";
import { EyebrowLabel } from "../../../components/marketing/eyebrow";
import { Hero } from "../../../components/marketing/hero";
import { PhotoGalleryLightbox } from "../../../components/marketing/photo-gallery-lightbox";
import { Button } from "../../../components/ui/button";

export const metadata: Metadata = {
  title: "Facilities & Equipment - Pop's Industrial Coatings",
  description:
    "We have the equipment & facilities to handle any project, large or small! Our team has the experience and skills for quality workmanship in industrial coating.",
};

export default function FacilitiesEquipmentPage() {
  return (
    <>
      <Header />
      <main id="content">
        <Hero
          eyebrow="INFRASTRUCTURE"
          heading="Facilities & Equipment"
          lede="We have the equipment and facilities to handle any project, large or small."
          primaryCta={{ label: "Request a Quote", href: "/request-a-quote" }}
          backgroundImage="/images/facilities-map-overview.png"
          backgroundAlt="Aerial map view of Pop's Industrial Coatings facilities in Lakeland, FL"
        />

        {/* Photo grid */}
        <Section tone="dark" className="pb-0">
          <Container>
            <PhotoGalleryLightbox
              className="grid-cols-2 sm:grid-cols-4"
              sizes="(min-width: 640px) 25vw, 50vw"
              photos={[
                {
                  src: "/images/facilities-map-overview.png",
                  alt: "Aerial map view of Pop's Industrial Coatings facilities in Lakeland, FL",
                },
                {
                  src: "/images/pops-industrial-coatings-lakeland-fl-facility-01-1.jpg",
                  alt: "Pop's Industrial Coatings Lakeland FL facility — production floor view 1",
                },
                {
                  src: "/images/pops-industrial-coatings-lakeland-fl-facility-02-1.jpg",
                  alt: "Pop's Industrial Coatings Lakeland FL facility — production floor view 2",
                },
                {
                  src: "/images/large-capacity-powder-coating-270x138-1.png",
                  alt: "Large capacity coatings oven at Pop's Industrial Coatings",
                },
              ]}
            />
          </Container>
        </Section>

        {/* Cross-link section */}
        <Section tone="dark" className="border-t border-ink-700">
          <Container>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              <div>
                <EyebrowLabel className="mb-3">CAPABILITIES</EyebrowLabel>
                <h2 className="mb-3 font-display text-[22px] leading-[1.2] text-ink-100">
                  Our Services
                </h2>
                <p className="mb-6 font-text text-sm leading-relaxed text-ink-300">
                  We pride ourselves in our extensive services and quality products, offering
                  customers one-stop shopping from small to large projects.
                </p>
                <Button asChild variant="secondary">
                  <Link href="/industrial-coatings-services">Learn More</Link>
                </Button>
              </div>

              <div>
                <EyebrowLabel className="mb-3">STANDARDS</EyebrowLabel>
                <h2 className="mb-3 font-display text-[22px] leading-[1.2] text-ink-100">
                  Our Certifications
                </h2>
                <p className="mb-6 font-text text-sm leading-relaxed text-ink-300">
                  We adhere to strict industry specifications and best practices to achieve
                  the utmost in quality workmanship. See our certifications.
                </p>
                <Button asChild variant="secondary">
                  <Link href="/request-a-quote/standards-specifications-certifications">
                    Learn More
                  </Link>
                </Button>
              </div>

              <div>
                <EyebrowLabel className="mb-3">ABOUT US</EyebrowLabel>
                <h2 className="mb-3 font-display text-[22px] leading-[1.2] text-ink-100">
                  What Makes Us Different
                </h2>
                <p className="mb-6 font-text text-sm leading-relaxed text-ink-300">
                  Pop&apos;s offers experience and expertise. Read about what makes us
                  different, solidifying our position as a leader in industrial coatings.
                </p>
                <Button asChild variant="secondary">
                  <Link href="/about-us">Learn More</Link>
                </Button>
              </div>
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
