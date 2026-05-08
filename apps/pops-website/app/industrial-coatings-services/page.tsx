import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "../../components/layout/container";
import { Footer } from "../../components/layout/footer";
import { Header } from "../../components/layout/header";
import { Section } from "../../components/layout/section";
import { EyebrowLabel } from "../../components/marketing/eyebrow";
import { Hero } from "../../components/marketing/hero";
import { ServiceTile } from "../../components/marketing/service-tile";
import { Button } from "../../components/ui/button";

export const metadata: Metadata = {
  title: "Industrial Coatings Services - Pop's Industrial Coatings",
  description:
    "Wet Paint Coating, Powder & Teflon Coating, Industrial Sandblasting and more. Experts at large scale Coating Projects, we have the skills, equipment & facilities for your project!",
};

const SERVICES = [
  {
    number: "01",
    name: "Wet Paint Coatings",
    lede: "Our wet paint coatings are applied with precision and expertise, providing a seamless and durable finish to a variety of surfaces.",
    image: "/images/industrial-painting-lakeland-fl-1024x683-1.jpg",
    href: "/industrial-coatings-services/wet-paint-coatings",
    alt: "Industrial wet paint coating work at Pop's Industrial Coatings, Lakeland FL",
  },
  {
    number: "02",
    name: "Complex Coating",
    lede: "We offer extensive technical knowledge and adept handling of complex coating systems to meet all unique challenges.",
    image: "/images/industrial-complex-coatings-1.jpg",
    href: "/industrial-coatings-services/complex-coating",
    alt: "Complex industrial coating and baking services at Pop's Industrial Coatings",
  },
  {
    number: "03",
    name: "Abrasive Media Blasting",
    lede: "Our skilled professionals and specialized equipment ensure optimal coating adhesion to rigorous SSPC and NACE standards.",
    image: "/images/abrasive-media-blasting.jpg",
    href: "/industrial-coatings-services/abrasive-media-blasting",
    alt: "Abrasive media blasting at Pop's Industrial Coatings in Lakeland, FL",
  },
  {
    number: "04",
    name: "Powder Coating",
    lede: "Electrostatic spray process of dry powder cured for a tough, uniform surface with resistance to corrosion, impact and chemicals.",
    image: "/images/powder-coat-gallery-toll-gantry.png",
    href: "/industrial-coatings-services/powder-coating",
    alt: "Large powder-coated highway toll gantry — Pop's Industrial Coatings, Lakeland FL",
  },
  {
    number: "05",
    name: "Large Capacity Powder Coating",
    lede: "Uniquely tailored for large scale projects, we are skilled and equipped to take on both significant size and volume jobs.",
    image: "/images/large-capacity-powder-coating.jpg",
    href: "/industrial-coatings-services/large-capacity-powder-coating",
    alt: "Large capacity powder coating at Pop's Industrial Coatings — accommodating the biggest industrial projects",
  },
];

export default function IndustrialCoatingsServicesPage() {
  return (
    <>
      <Header />
      <main id="content">
        <Hero
          eyebrow="SERVICES"
          heading="Industrial Coatings Services"
          lede="We pride ourselves in our extensive services and quality products, offering customers one-stop shopping from small to large projects."
          primaryCta={{ label: "Request a Quote", href: "/request-a-quote" }}
          backgroundImage="/images/slide-01.jpg"
        />

        <Section tone="dark">
          <Container>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-5">
              {SERVICES.map((service) => (
                <ServiceTile key={service.href} {...service} />
              ))}
            </div>
          </Container>
        </Section>

        {/* Specifications & Certifications cross-link */}
        <Section tone="dark" className="border-t border-ink-700">
          <Container>
            <div className="mx-auto max-w-[720px] text-center">
              <EyebrowLabel className="mb-3">QUALITY ASSURANCE</EyebrowLabel>
              <h2 className="mb-4 font-display text-[28px] leading-[1.2] text-ink-100">
                Specifications &amp; Certifications
              </h2>
              <p className="mb-8 font-text text-base leading-relaxed text-ink-300">
                Pop&apos;s Industrial Coatings is committed to quality work in full conformance
                with industry standards. See our certifications and the specifications we adhere to.
              </p>
              <Button asChild variant="secondary">
                <Link href="/request-a-quote/standards-specifications-certifications">
                  View Our Certifications
                </Link>
              </Button>
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
