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
  title: "Industrial Powder Coating - Lakeland FL Polk County FL",
  description:
    "Pop's Industrial offers electrostatic powder coating process for tough, uniform finish with superior resistance to corrosion, impact and chemicals.",
  openGraph: {
    images: [{ url: "/images/powder-coat-gallery-toll-gantry.png", width: 1024, height: 768 }],
  },
};

const OTHER_SERVICES = [
  { name: "Wet Paint Coatings", href: "/industrial-coatings-services/wet-paint-coatings" },
  { name: "Complex Coating", href: "/industrial-coatings-services/complex-coating" },
  { name: "Abrasive Media Blasting", href: "/industrial-coatings-services/abrasive-media-blasting" },
  { name: "Large Capacity Powder Coating", href: "/industrial-coatings-services/large-capacity-powder-coating" },
];

const GALLERY = [
  {
    src: "/images/powder-coat-gallery-poles-before-after.png",
    width: 576,
    height: 1024,
    alt: "Steel poles before powder coating (galvanized) and after a glossy black powder coat finish — Pop's Industrial Coatings, Lakeland FL",
  },
  {
    src: "/images/powder-coat-gallery-toll-gantry.png",
    width: 1024,
    height: 768,
    alt: "Large highway toll and ITS gantry with tan powder-coated steel structure — Pop's Industrial Coatings",
  },
  {
    src: "/images/powder-coat-gallery-boat-transformation.png",
    width: 576,
    height: 1024,
    alt: "Vessel structure before refinishing, after abrasive blasting, and finished in blue powder coat — Pop's Industrial Coatings",
  },
  {
    src: "/images/powder-coat-gallery-large-frame-cream.png",
    width: 768,
    height: 1024,
    alt: "Large industrial truss powder coated in smooth off-white, suspended for curing — Pop's Industrial Coatings, Lakeland FL",
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

                {/* Photo grid — object-contain so tall before/after composites are fully visible */}
                <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
                  {GALLERY.map((photo) => (
                    <figure
                      key={photo.src}
                      className="overflow-hidden rounded-sm border border-pops-yellow-500/20 bg-ink-900/50"
                    >
                      <div className="flex w-full items-center justify-center p-3 sm:p-4">
                        <Image
                          src={photo.src}
                          alt={photo.alt}
                          width={photo.width}
                          height={photo.height}
                          sizes="(min-width: 768px) 45vw, 100vw"
                          className="h-auto w-full max-h-[min(90vh,56rem)] object-contain"
                        />
                      </div>
                    </figure>
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
