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
import { Button } from "../../../components/ui/button";
import { getServiceJsonLd } from "../../../lib/jsonld";

export const metadata: Metadata = {
  title: "Wet Paint Coatings - Pop's Industrial Lakeland FL",
  description:
    "Our skilled team employs top-quality paints and application techniques to enhance both aesthetics & protection for your industrial wet paint project.",
  openGraph: {
    images: [{ url: "/images/industrial-painting-lakeland-fl-1024x683-1.jpg", width: 1024, height: 683 }],
  },
};

const OTHER_SERVICES = [
  { name: "Complex Coating", href: "/industrial-coatings-services/complex-coating" },
  { name: "Abrasive Media Blasting", href: "/industrial-coatings-services/abrasive-media-blasting" },
  { name: "Powder Coating", href: "/industrial-coatings-services/powder-coating" },
  { name: "Large Capacity Powder Coating", href: "/industrial-coatings-services/large-capacity-powder-coating" },
];

const GALLERY = [
  {
    src: "/images/industrial-painting-lakeland-fl-1024x683-1.jpg",
    alt: "Industrial wet paint coating being applied at Pop's Industrial Coatings, Lakeland FL",
    width: 1024,
    height: 683,
  },
  {
    src: "/images/industrial-wet-painting-coatings.png",
    alt: "Wet painting coatings on industrial components at Pop's Industrial Coatings",
    width: 800,
    height: 734,
  },
  {
    src: "/images/slide-02.jpg",
    alt: "Industrial paint coating work in progress at Pop's facility in Lakeland, FL",
    width: 1200,
    height: 800,
  },
  {
    src: "/images/teflon-coating.jpg",
    alt: "Teflon coating application at Pop's Industrial Coatings, Lakeland FL",
    width: 800,
    height: 800,
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
            <div className="grid grid-cols-1 gap-10 sm:gap-12 lg:grid-cols-[1fr_280px] lg:gap-16">

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
                <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {GALLERY.map((photo) => (
                    <div
                      key={photo.src}
                      className="relative aspect-square overflow-hidden rounded-sm bg-ink-800"
                    >
                      <Image
                        src={photo.src}
                        alt={photo.alt}
                        fill
                        sizes="(min-width: 640px) 25vw, 50vw"
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
