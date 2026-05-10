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
import { Button } from "../../../components/ui/button";
import { getServiceJsonLd } from "../../../lib/jsonld";

export const metadata: Metadata = {
  title: "Wet Paint Coatings - Pop's Industrial Lakeland FL",
  description:
    "Our skilled team employs top-quality paints and application techniques to enhance both aesthetics & protection for your industrial wet paint project.",
  openGraph: {
    images: [{ url: "/images/pops-social-thumbnail.png", width: 1200, height: 630, alt: "Pop's Industrial Coatings" }],
  },
};

const OTHER_SERVICES = [
  { name: "Complex Coating", href: "/industrial-coatings-services/complex-coating" },
  { name: "Abrasive Media Blasting", href: "/industrial-coatings-services/abrasive-media-blasting" },
  { name: "Powder Coating", href: "/industrial-coatings-services/powder-coating" },
  { name: "Large Capacity Coatings", href: "/industrial-coatings-services/large-capacity-powder-coating" },
];

const GALLERY = [
  {
    src: "/images/wet-paint-img-4100.png",
    alt: "Blue-coated industrial tank transported on a trailer after wet paint application",
  },
  {
    src: "/images/wet-paint-img-5329.png",
    alt: "Large blue industrial tank coated in Pop's Lakeland paint booth",
  },
  {
    src: "/images/wet-paint-img-7649.png",
    alt: "White coated structural frames staged on a flatbed trailer",
  },
  {
    src: "/images/wet-paint-img-7854.png",
    alt: "Long white coated steel assembly loaded for transport",
  },
  {
    src: "/images/wet-paint-img-8950.png",
    alt: "Freshly coated yellow industrial motors lined up after painting",
  },
  {
    src: "/images/wet-paint-img-9363.png",
    alt: "White coated steel beams secured on a flatbed truck",
  },
  {
    src: "/images/wet-paint-img-9372.png",
    alt: "Freshly coated industrial assembly in white primer finish",
  },
  {
    src: "/images/wet-paint-industrial-1.png",
    alt: "Painter spray-applying industrial coating in a controlled environment",
  },
  {
    src: "/images/wet-paint-industrial-2.png",
    alt: "Technician applying paint coating across large steel beams",
  },
];

export default function WetPaintCoatingsPage() {
  return (
    <>
      <JsonLd
        data={getServiceJsonLd({
          name: "Wet Paint Coatings",
          description:
            "Industrial wet paint coating services in Lakeland, FL. Precision application for equipment, machinery, and structural components.",
        })}
      />
      <Header />
      <main id="content">
        <Hero
          eyebrow="INDUSTRIAL"
          heading="Wet Paint Coatings"
          lede="Precision and expertise for a seamless, durable finish on industrial equipment, machinery, and structural components."
          primaryCta={{ label: "Request a Quote", href: "/request-a-quote" }}
          backgroundImage="/images/industrial-painting-lakeland-fl-1024x683-1.jpg"
        />

        <Section tone="dark">
          <Container>
            <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1fr_280px]">

              {/* Main content */}
              <div>
                <EyebrowLabel className="mb-3">WET PAINT</EyebrowLabel>
                <h2 className="mb-6 font-display text-[28px] leading-[1.2] text-ink-100">
                  Industrial Wet Paint Coatings
                </h2>
                <div className="space-y-4 font-text text-base leading-relaxed text-ink-100">
                  <p>
                    Our wet paint coatings are applied with precision and expertise, providing a seamless
                    and durable finish to a variety of surfaces.
                  </p>
                  <p>
                    Whether for industrial equipment, machinery, or structural components, our skilled
                    team employs top-quality paints and application techniques to enhance both aesthetics
                    and protection.
                  </p>
                  <p>
                    Our team will work in tandem with you to supply your wet paint solutions which meet
                    the specific requirements of each project, ensuring a professional and resilient
                    coating that withstands the test of time.
                  </p>
                </div>

                {/* Photo grid */}
                <div className="mt-10">
                  <PhotoGalleryLightbox
                    className="grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
                    sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
                    photos={GALLERY}
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
                        Wet Paint Coatings
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
