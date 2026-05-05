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
  title: "Large Capacity Powder Coating - Lakeland FL Polk County",
  description:
    "Pop's Industrial Coatings offer large scale powder coating processes that ensure uniform coverage & robust protection without compromising quality.",
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
    src: "/images/large-capacity-powder-coating.jpg",
    alt: "Large capacity powder coating oven at Pop's Industrial Coatings, Lakeland FL — accommodating oversized industrial components",
  },
  {
    src: "/images/large-capacity-industrial-powder-coating-scaled.jpeg",
    alt: "Large scale powder coating work at Pop's Industrial Coatings facility in Lakeland, FL",
  },
  {
    src: "/images/large-capacity-industrial-powder-coating2-scaled.jpeg",
    alt: "Oversized structural components receiving powder coating at Pop's Industrial Coatings",
  },
];

export default function LargeCapacityPowderCoatingPage() {
  return (
    <>
      <JsonLd
        data={getServiceJsonLd({
          name: "Large Capacity Powder Coating",
          description:
            "Large-scale powder coating services in Lakeland, FL. Uniform coverage and robust protection for significant size and volume projects.",
        })}
      />
      <Header />
      <main id="content">
        <Hero
          eyebrow="LARGE CAPACITY"
          heading="Large Capacity Powder Coating"
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
                  Large Capacity Industrial Powder Coating
                </h2>
                <div className="space-y-4 font-text text-base leading-relaxed text-ink-100">
                  <p>
                    Our large capacity powder coating services are tailored for projects of significant
                    scale. We efficiently handle large volumes while maintaining the same high standards
                    of quality.
                  </p>
                  <p>
                    From structural members to oversized components, our large capacity powder coating
                    process ensures uniform coverage, vibrant finishes, and robust protection.
                  </p>
                  <p>
                    Trust us to deliver efficiency without compromising on the superior quality that
                    defines our powder coating services.
                  </p>
                </div>

                {/* Photo grid */}
                <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {GALLERY.map((photo) => (
                    <div
                      key={photo.src}
                      className="relative aspect-[4/3] overflow-hidden rounded-sm bg-ink-800"
                    >
                      <Image
                        src={photo.src}
                        alt={photo.alt}
                        fill
                        sizes="(min-width: 640px) 33vw, 100vw"
                        className="object-cover"
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
                        Large Capacity Powder Coating
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
