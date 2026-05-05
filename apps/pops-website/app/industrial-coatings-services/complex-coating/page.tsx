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
  title: "Corrosion Resistant Industrial Coating Services",
  description:
    "Serving Lakeland Polk County FL, Pop's provided complex coating services; corrosion resistant tank liners, baked coatings, multiple component coatings & more",
  openGraph: {
    images: [{ url: "/images/industrial-complex-coatings-1.jpg" }],
  },
};

const OTHER_SERVICES = [
  { name: "Wet Paint Coatings", href: "/industrial-coatings-services/wet-paint-coatings" },
  { name: "Abrasive Media Blasting", href: "/industrial-coatings-services/abrasive-media-blasting" },
  { name: "Powder Coating", href: "/industrial-coatings-services/powder-coating" },
  { name: "Large Capacity Powder Coating", href: "/industrial-coatings-services/large-capacity-powder-coating" },
];

export default function ComplexCoatingPage() {
  return (
    <>
      <JsonLd
        data={getServiceJsonLd({
          name: "Complex Coating",
          description:
            "Specialty corrosion-resistant coating services in Lakeland, FL. Tank liners, baked coatings, and plural component coatings.",
        })}
      />
      <Header />
      <main id="content">
        <Hero
          eyebrow="COMPLEX INDUSTRIAL"
          heading="Complex Coating"
          lede="Specialty tank lining, baked coatings, and plural component coatings for the most demanding industrial applications."
          primaryCta={{ label: "Request a Quote", href: "/request-a-quote?service=complex-coating" }}
          backgroundImage="/images/industrial-complex-coatings-1.jpg"
        />

        <Section tone="dark">
          <Container>
            <div className="grid grid-cols-1 gap-10 sm:gap-12 lg:grid-cols-[1fr_280px] lg:gap-16">

              {/* Main content */}
              <div>
                <EyebrowLabel className="mb-3">COMPLEX PROJECTS</EyebrowLabel>
                <h2 className="mb-6 font-display text-[28px] leading-[1.2] text-ink-100">
                  Complex Industrial Projects
                </h2>

                <div className="mb-8 relative aspect-[16/9] overflow-hidden rounded-sm bg-ink-800 sm:aspect-[16/7]">
                  <Image
                    src="/images/industrial-complex-coatings-1.jpg"
                    alt="Complex industrial coating project at Pop's Industrial Coatings, Lakeland FL"
                    fill
                    sizes="(min-width: 1024px) 60vw, 100vw"
                    className="object-cover"
                    priority
                  />
                </div>

                <div className="space-y-4 font-text text-base leading-relaxed text-ink-100">
                  <p>
                    Drawing upon our team&apos;s extensive technical knowledge and adept handling of complex
                    coating systems, we stand ready to meet the demands of specialized applications and
                    unique challenges.
                  </p>
                  <p>
                    Our skill set allows us to consistently deliver top-notch results. In our diverse range
                    of services, we specialize in complex coatings that surpass conventional applications.
                    This expertise extends to specialty tank lining, where we meticulously apply
                    high-performance liners tailored to meet the unique demands of your storage systems.
                    These specialty tank liners offer superior corrosion resistance, including options for
                    severe exposure, all aimed at preserving the integrity of your tanks.
                  </p>
                  <p>
                    Furthermore, our proficiency encompasses baked coatings, ensuring a durable and uniform
                    finish achieved through a meticulous curing process. Additionally, we excel in applying
                    coatings that necessitate specialty equipment, such as plural component coatings,
                    addressing the specific needs of diverse industries.
                  </p>
                  <p>
                    Place your trust in us for comprehensive solutions that navigate the intricacies of
                    complex coating requirements, providing both protection and longevity to your valuable
                    assets.
                  </p>
                </div>

                <div className="mt-10">
                  <Button asChild variant="primary">
                    <Link href="/request-a-quote?service=complex-coating">Get a Quote</Link>
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
                        Complex Coating
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
