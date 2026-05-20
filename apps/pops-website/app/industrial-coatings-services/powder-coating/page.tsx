import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "../../../components/layout/container";
import { Footer } from "../../../components/layout/footer";
import { Header } from "../../../components/layout/header";
import { Section } from "../../../components/layout/section";
import { EyebrowLabel } from "../../../components/marketing/eyebrow";
import { Hero } from "../../../components/marketing/hero";
import { PhotoGalleryLightbox } from "../../../components/marketing/photo-gallery-lightbox";
import { JsonLd } from "../../../components/seo/json-ld";
import { getServiceJsonLd } from "../../../lib/jsonld";
import { Button } from "../../../components/ui/button";

export const metadata: Metadata = {
  title: "Industrial Powder Coating - Lakeland FL Polk County FL",
  description:
    "Pop's Industrial offers electrostatic powder coating process for tough, uniform finish with superior resistance to corrosion, impact and chemicals.",
};

const OTHER_SERVICES = [
  { name: "Wet Paint Coatings", href: "/industrial-coatings-services/wet-paint-coatings" },
  { name: "Complex Coating", href: "/industrial-coatings-services/complex-coating" },
  { name: "Abrasive Media Blasting", href: "/industrial-coatings-services/abrasive-media-blasting" },
  { name: "Large Capacity Coatings", href: "/industrial-coatings-services/large-capacity-powder-coating" },
];

const GALLERY = [
  {
    src: "/images/powder-gallery-1.png",
    alt: "Large cream powder-coated overhead gantry installed over a roadway",
  },
  {
    src: "/images/powder-gallery-4.png",
    alt: "Black powder-coated truck wheels hanging in finishing line",
  },
  {
    src: "/images/powder-gallery-5.png",
    alt: "Matte black powder-coated metal parts hanging for cure",
  },
  {
    src: "/images/powder-gallery-6.png",
    alt: "Bright yellow powder-coated industrial components on overhead line",
  },
  {
    src: "/images/powder-gallery-7.png",
    alt: "Color-gradient powder-coated decorative metal chair",
  },
  {
    src: "/images/powder-gallery-8.png",
    alt: "Bright orange powder-coated slats hanging on conveyor line",
  },
  {
    src: "/images/powder-gallery-9.png",
    alt: "Glossy green powder-coated industrial steel table frame",
  },
  {
    src: "/images/powder-gallery-10.png",
    alt: "White powder-coated industrial truss assembly staged outdoors at Pop's facility",
  },
] as const;

export default function PowderCoatingPage() {
  return (
    <>
      <JsonLd
        data={getServiceJsonLd({
          name: "Industrial Powder Coating",
          description:
            "Electrostatic powder coating services in Lakeland, FL. Tough, uniform finish with superior resistance to corrosion, impact, and chemicals.",
        })}
      />
      <Header />
      <main id="content">
        <Hero
          eyebrow="POWDER"
          heading="Powder Coating"
          lede="Electrostatic spray process delivering a tough, uniform finish with superior resistance to corrosion, impact, and chemicals."
          primaryCta={{ label: "Request a Quote", href: "/request-a-quote" }}
          backgroundImage="/images/powder-coat-gallery-toll-gantry.png"
        />

        <Section tone="dark">
          <Container>
            <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1fr_280px]">

              {/* Main content */}
              <div>
                <EyebrowLabel className="mb-3">POWDER COATING</EyebrowLabel>
                <h2 className="mb-6 font-display text-[28px] leading-[1.2] text-ink-100">
                  Industrial Powder Coating Services
                </h2>
                <div className="space-y-4 font-text text-base leading-relaxed text-ink-100">
                  <p>
                    Elevate the durability and appearance of your products with our powder coating services.
                  </p>
                  <p>
                    We utilize an electrostatic spray process, applying a dry powder that is then cured
                    to form a tough, uniform finish. This method offers superior resistance to corrosion,
                    impact, and chemicals.
                  </p>
                  <p>
                    Whether for industrial components, architectural elements, or consumer goods, our
                    powder coating solutions provide an attractive and resilient coating that exceeds
                    expectations.
                  </p>
                </div>

                {/* Photo gallery */}
                <div className="mt-12">
                  <div className="mb-4 flex items-end justify-between">
                    <h3 className="font-display text-xl text-ink-100">Recent Powder Coating Work</h3>
                    <p className="font-text text-sm text-ink-300">Tap any photo to enlarge</p>
                  </div>
                  <PhotoGalleryLightbox
                    className="grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    photos={GALLERY}
                    itemClassName="rounded-xl transition-all duration-700 ease-in-out hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-28px_rgba(250,179,0,0.6)]"
                    imageClassName="object-cover"
                  />
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
                        Powder Coating
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
