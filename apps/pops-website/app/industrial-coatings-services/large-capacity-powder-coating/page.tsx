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
  title: "Large Capacity Coatings - Lakeland FL Polk County",
  description:
    "Pop's Industrial Coatings offers large scale coating processes that ensure uniform coverage and robust protection without compromising quality.",
  openGraph: {
    images: [{ url: "/images/large-capacity-powder-coating.jpg" }],
  },
};

const OTHER_SERVICES = [
  { name: "Wet Paint Coatings", href: "/industrial-coatings-services/wet-paint-coatings" },
  { name: "Complex Coating", href: "/industrial-coatings-services/complex-coating" },
  { name: "Abrasive Media Blasting", href: "/industrial-coatings-services/abrasive-media-blasting" },
  { name: "Powder Coating", href: "/industrial-coatings-services/powder-coating" },
];

const GALLERY = [
  {
    src: "/images/large-capacity-gallery-1.png",
    alt: "Large white coated industrial component secured between support frames",
  },
  {
    src: "/images/large-capacity-gallery-2.png",
    alt: "Long white truss component coated and staged on transport rack",
  },
  {
    src: "/images/large-capacity-gallery-3.png",
    alt: "Bright yellow coated industrial structure hanging on the finishing line",
  },
  {
    src: "/images/large-capacity-gallery-4.png",
    alt: "White coated heavy steel component hanging for final finish",
  },
  {
    src: "/images/large-capacity-gallery-5.png",
    alt: "Large industrial beam section coated in gray and staged outdoors",
  },
  {
    src: "/images/large-capacity-gallery-6.png",
    alt: "White coated truss loaded on trailer ready for delivery",
  },
  {
    src: "/images/large-capacity-gallery-7.png",
    alt: "Multiple large coated truss assemblies secured on flatbed trailer",
  },
  {
    src: "/images/large-capacity-gallery-8.png",
    alt: "White coated industrial assembly suspended on conveyor outside booth",
  },
  {
    src: "/images/large-capacity-gallery-9.png",
    alt: "Long truss structures with metallic finish hanging in industrial booth",
  },
];

export default function LargeCapacityPowderCoatingPage() {
  return (
    <>
      <JsonLd
        data={getServiceJsonLd({
          name: "Large Capacity Coatings",
          description:
            "Large-scale coating services in Lakeland, FL. Uniform coverage and robust protection for significant size and volume projects.",
        })}
      />
      <Header />
      <main id="content">
        <Hero
          eyebrow="LARGE CAPACITY"
          heading="Large Capacity Coatings"
          lede="Uniquely tailored for large scale projects — we efficiently handle significant size and volume without compromising quality."
          primaryCta={{ label: "Request a Quote", href: "/request-a-quote" }}
          backgroundImage="/images/large-capacity-powder-coating.jpg"
        />

        <Section tone="dark">
          <Container>
            <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1fr_280px]">

              {/* Main content */}
              <div>
                <EyebrowLabel className="mb-3">LARGE CAPACITY</EyebrowLabel>
                <h2 className="mb-6 font-display text-[28px] leading-[1.2] text-ink-100">
                  Large capacity industrial coatings
                </h2>
                <div className="space-y-4 font-text text-base leading-relaxed text-ink-100">
                  <p>
                    Our large capacity coating services are tailored for projects of significant scale.
                    We efficiently handle large volumes while maintaining the same high standards of
                    quality.
                  </p>
                  <p>
                    From structural members to oversized components, our large capacity coatings process
                    ensures uniform coverage, vibrant finishes, and robust protection.
                  </p>
                  <p>
                    Trust us to deliver efficiency without compromising on the superior quality that
                    defines our coating services.
                  </p>
                </div>

                {/* Photo gallery */}
                <div className="mt-12">
                  <div className="mb-4 flex items-end justify-between">
                    <h3 className="font-display text-xl text-ink-100">Large Capacity Project Gallery</h3>
                    <p className="font-text text-sm text-ink-300">Tap any photo to enlarge</p>
                  </div>
                  <PhotoGalleryLightbox
                    photos={GALLERY}
                    className="grid-cols-3 gap-5"
                    itemClassName="rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-28px_rgba(250,179,0,0.6)]"
                    imageClassName="object-contain"
                    sizes="33vw"
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
                        Large Capacity Coatings
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
