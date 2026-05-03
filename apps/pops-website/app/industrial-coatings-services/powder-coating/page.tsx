import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Container } from "../../../components/layout/container";
import { Footer } from "../../../components/layout/footer";
import { Header } from "../../../components/layout/header";
import { Section } from "../../../components/layout/section";
import { EyebrowLabel } from "../../../components/marketing/eyebrow";
import { Hero } from "../../../components/marketing/hero";
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
  { name: "Large Capacity Powder Coating", href: "/industrial-coatings-services/large-capacity-powder-coating" },
];

const GALLERY = [
  {
    src: "/images/industrial-powder-coating-lakeland-fl-IMG_3687.jpg",
    alt: "Powder coating application at Pop's Industrial Coatings, Lakeland FL",
  },
  {
    src: "/images/industrial-powder-coating-lakeland-fl-IMG_4029.jpg",
    alt: "Industrial powder coating process at Pop's facility in Lakeland, FL",
  },
  {
    src: "/images/industrial-powder-coating-lakeland-fl-IMG_4107.jpg",
    alt: "Uniform powder coat finish on industrial components at Pop's Lakeland facility",
  },
  {
    src: "/images/industrial-powder-coating-lakeland-fl-IMG_4181.jpg",
    alt: "Powder coated industrial parts curing at Pop's Industrial Coatings",
  },
  {
    src: "/images/industrial-powder-coating-lakeland-fl-IMG_4686.jpg",
    alt: "Electrostatic powder coating being applied to industrial equipment at Pop's",
  },
  {
    src: "/images/industrial-powder-coating-lakeland-fl-IMG_4980.jpg",
    alt: "Finished powder coating work at Pop's Industrial Coatings, Lakeland FL",
  },
  {
    src: "/images/industrial-powder-coating-lakeland-fl-IMG_5315.jpg",
    alt: "Industrial components with powder coat finish at Pop's facility",
  },
  {
    src: "/images/industrial-powder-coating-lakeland-fl-Ameron-pole-products-25-1336-2-In-3-27-25.jpg",
    alt: "Ameron pole products receiving powder coating at Pop's Industrial Coatings",
  },
];

export default function PowderCoatingPage() {
  return (
    <>
      <Header />
      <main id="content">
        <Hero
          eyebrow="POWDER"
          heading="Powder Coating"
          lede="Electrostatic spray process delivering a tough, uniform finish with superior resistance to corrosion, impact, and chemicals."
          primaryCta={{ label: "Request a Quote", href: "/request-a-quote" }}
          backgroundImage="/images/industrial-powder-coating-lakeland-fl-IMG_3687.jpg"
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

                {/* Photo grid */}
                <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {GALLERY.map((photo) => (
                    <div
                      key={photo.src}
                      className="relative aspect-[4/3] overflow-hidden rounded-sm bg-ink-800"
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
