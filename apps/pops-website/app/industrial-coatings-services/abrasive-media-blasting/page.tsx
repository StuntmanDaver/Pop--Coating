import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Container } from "../../../components/layout/container";
import { Footer } from "../../../components/layout/footer";
import { Header } from "../../../components/layout/header";
import { Section } from "../../../components/layout/section";
import { EyebrowLabel } from "../../../components/marketing/eyebrow";
import { Hero } from "../../../components/marketing/hero";
import { JsonLd } from "../../../components/seo/json-ld";
import { getServiceJsonLd } from "../../../lib/jsonld";
import { Button } from "../../../components/ui/button";

export const metadata: Metadata = {
  title: "Abrasive Media Blasting - Lakeland FL Polk County FL",
  description:
    "Our Abrasive Media Blasting services adhere strictly to the rigorous standards set by SSPC (Society for Protective Coatings) and NACE (National Association of Corrosion Engineers).",
  openGraph: {
    images: [{ url: "/images/abrasive-media-blasting.jpg" }],
  },
};

const OTHER_SERVICES = [
  { name: "Wet Paint Coatings", href: "/industrial-coatings-services/wet-paint-coatings" },
  { name: "Complex Coating", href: "/industrial-coatings-services/complex-coating" },
  { name: "Powder Coating", href: "/industrial-coatings-services/powder-coating" },
  { name: "Large Capacity Powder Coating", href: "/industrial-coatings-services/large-capacity-powder-coating" },
];

const GALLERY = [
  {
    src: "/images/industrial-sandblasting-lakeland-fl-IMG_5019.jpg",
    alt: "Abrasive media blasting at Pop's Industrial Coatings, Lakeland FL — surface preparation for industrial coating",
  },
  {
    src: "/images/industrial-sandblasting-lakeland-fl-IMG_5406.jpg",
    alt: "Industrial sandblasting work in progress at Pop's Lakeland facility",
  },
  {
    src: "/images/industrial-sandblasting-lakeland-fl-IMG_7484.jpg",
    alt: "Abrasive blasting to SSPC standards at Pop's Industrial Coatings",
  },
];

export default function AbrasiveMediaBlastingPage() {
  return (
    <>
      <JsonLd
        data={getServiceJsonLd({
          name: "Abrasive Media Blasting",
          description:
            "SSPC and NACE certified abrasive media blasting services in Lakeland, FL. Surface preparation for optimal coating adhesion.",
        })}
      />
      <Header />
      <main id="content">
        <Hero
          eyebrow="SAND BLASTING"
          heading="Abrasive Media Blasting"
          lede="Meticulous surface preparation to SSPC and NACE standards, ensuring optimal coating adhesion and long-term performance."
          primaryCta={{ label: "Request a Quote", href: "/request-a-quote" }}
          backgroundImage="/images/abrasive-media-blasting.jpg"
        />

        <Section tone="dark">
          <Container>
            <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1fr_280px]">

              {/* Main content */}
              <div>
                <EyebrowLabel className="mb-3">TO SSPC/NACE STANDARDS</EyebrowLabel>
                <h2 className="mb-6 font-display text-[28px] leading-[1.2] text-ink-100">
                  Sand Blasting to Industry Standards
                </h2>
                <div className="space-y-4 font-text text-base leading-relaxed text-ink-100">
                  <p>
                    Our Abrasive Media Blasting services adhere strictly to the rigorous standards set
                    by SSPC (Society for Protective Coatings) and NACE (National Association of
                    Corrosion Engineers).
                  </p>
                  <p>
                    Utilizing the necessary equipment and skilled professionals, we ensure that surfaces
                    are meticulously prepared to achieve optimal coating adhesion.
                  </p>
                  <p>
                    The process involves removing contaminants and creating a profile suitable for the
                    application of protective coatings, ensuring longevity and performance in diverse
                    environments.
                  </p>
                </div>

                {/* Photo grid */}
                <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {GALLERY.map((photo) => (
                    <div
                      key={photo.src}
                      className="relative aspect-[4/3] overflow-hidden rounded-sm bg-ink-800"
                    >
                      <Image
                        src={photo.src}
                        alt={photo.alt}
                        fill
                        sizes="(min-width: 640px) 33vw, 50vw"
                        className="object-contain object-center"
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-10">
                  <Button asChild variant="primary">
                    <Link href="/request-a-quote">Get a Quote</Link>
                  </Button>
                </div>
              </div>

              {/* Services sidebar */}
              <aside aria-label="Our services">
                <EyebrowLabel className="mb-4">OUR SERVICES</EyebrowLabel>
                <nav>
                  <ul className="space-y-1">
                    <li>
                      <span className="block py-2 font-text text-sm font-semibold text-ink-100">
                        Abrasive Media Blasting
                      </span>
                    </li>
                    {OTHER_SERVICES.map((service) => (
                      <li key={service.href}>
                        <Link
                          href={service.href}
                          className="block py-2 font-text text-sm text-ink-300 transition-colors hover:text-pops-yellow-500"
                        >
                          {service.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              </aside>

            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
