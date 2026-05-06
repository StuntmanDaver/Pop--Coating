import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Container } from "../../components/layout/container";
import { Footer } from "../../components/layout/footer";
import { Header } from "../../components/layout/header";
import { Section } from "../../components/layout/section";
import { EyebrowLabel } from "../../components/marketing/eyebrow";
import { Hero } from "../../components/marketing/hero";
import { Button } from "../../components/ui/button";

export const metadata: Metadata = {
  title: "About Us - Pop's Industrial Coatings",
  description:
    "Providing Quality Industrial Painting, Coating, & Sandblasting in Lakeland, FL Since 1972",
};

export default function AboutUsPage() {
  return (
    <>
      <Header />
      <main id="content">
        <Hero
          eyebrow="OUR STORY"
          heading="About Pop's Industrial Coatings"
          lede="A legacy defined by four generations of expertise in industrial coatings — blending tradition with a contemporary approach to applications."
          primaryCta={{ label: "Request a Quote", href: "/request-a-quote" }}
          backgroundImage="/images/pops-industrial-coatings-lakeland-fl-facility-01.jpg"
          backgroundAlt="Pop's Industrial Coatings facility in Lakeland, FL"
        />

        {/* About + capabilities */}
        <Section tone="dark">
          <Container>
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
              <div>
                <EyebrowLabel className="mb-4">ABOUT</EyebrowLabel>
                <h2 className="mb-4 font-display text-[28px] leading-[1.2] text-ink-100">
                  Pop&apos;s Industrial Coatings
                </h2>
                <p className="font-text text-base leading-relaxed text-ink-100">
                  Pop&apos;s Industrial Coatings, a legacy defined by four generations of expertise
                  in industrial coatings. With a rich history rooted in a deep understanding of
                  the industry, we seamlessly blend tradition with a contemporary approach to
                  applications, solidifying our position as a principal company in the industrial
                  coating sector.
                </p>

                <h3 className="mt-8 mb-3 font-display text-[22px] leading-[1.2] text-ink-100">
                  Large Capacity Ovens
                </h3>
                <p className="font-text text-base leading-relaxed text-ink-100">
                  Size matters, especially when it comes to powder coating. Our large capacity ovens
                  are designed to accommodate large pieces effortlessly. This means that your
                  substantial components receive the same meticulous attention and precision finish
                  as smaller items.
                </p>

                <h3 className="mt-8 mb-3 font-display text-[22px] leading-[1.2] text-ink-100">
                  Industrial Size Projects
                </h3>
                <p className="font-text text-base leading-relaxed text-ink-100">
                  At Pop&apos;s Industrial Coatings, we take pride in our distinctive capabilities
                  that set us apart in the industry. What makes us truly unique is our unparalleled
                  capacity to handle substantial parts and heavy materials, making us your go-to
                  solution for large-scale projects.
                </p>

                <h3 className="mt-8 mb-3 font-display text-[22px] leading-[1.2] text-ink-100">
                  Expansive Facilities
                </h3>
                <p className="font-text text-base leading-relaxed text-ink-100">
                  Our expansive facilities empower us to seamlessly accommodate sizable jobs. With
                  ample space at our disposal, we can efficiently manage and organize materials,
                  ensuring a smooth workflow for even the most extensive projects.
                </p>
              </div>

              <div>
                <h3 className="mb-3 font-display text-[22px] leading-[1.2] text-ink-100">
                  Experience &amp; Expertise
                </h3>
                <p className="font-text text-base leading-relaxed text-ink-100">
                  Navigating the intricate landscape of coating systems requires expertise, and
                  that&apos;s where we shine. Our team boasts extensive technical knowledge and
                  know-how, particularly in dealing with complex coating systems. Whether it&apos;s
                  a specialized application or a unique challenge, we have the skills to deliver
                  top-notch results.
                </p>

                <div className="relative mt-10 mb-10 aspect-[4/3] w-full overflow-hidden rounded-sm bg-ink-900 ring-1 ring-pops-yellow-500/20 lg:mb-12">
                  <Image
                    src="/images/pops-about-worker.png"
                    alt="Industrial painter applying coating with spray equipment at Pop's Industrial Coatings, Lakeland FL"
                    fill
                    sizes="(min-width: 1024px) 40vw, 100vw"
                    className="object-contain object-center"
                  />
                  {/* Dark wash — keeps photo moody and on-brand with the dark UI */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-black/55"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/50"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 ring-1 ring-inset ring-black/40"
                  />
                </div>

                <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                  <Button asChild variant="primary">
                    <Link href="/about-us/history">Our History</Link>
                  </Button>
                  <Button asChild variant="secondary">
                    <Link href="/about-us/leadership">Meet the Family</Link>
                  </Button>
                </div>
              </div>
            </div>
          </Container>
        </Section>

        {/* Facility photos */}
        <Section tone="dark" className="border-t border-ink-700 pt-0 pb-0">
          <div className="grid grid-cols-1 sm:grid-cols-2">
            <div className="relative aspect-[4/3] overflow-hidden bg-ink-900">
              <Image
                src="/images/pops-industrial-coatings-lakeland-fl-facility-01.jpg"
                alt="Interior of Pop's Industrial Coatings facility in Lakeland, FL — large-scale coating equipment"
                fill
                sizes="(min-width: 640px) 50vw, 100vw"
                className="object-contain object-center"
              />
            </div>
            <div className="relative aspect-[4/3] overflow-hidden bg-ink-900">
              <Image
                src="/images/pops-industrial-coatings-lakeland-fl-facility-02.jpg"
                alt="Pop's Industrial Coatings Lakeland FL facility exterior and production floor"
                fill
                sizes="(min-width: 640px) 50vw, 100vw"
                className="object-contain object-center"
              />
            </div>
          </div>
        </Section>

        {/* Cross-links: History / Certifications / Services */}
        <Section tone="dark" className="border-t border-ink-700">
          <Container>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              <div>
                <EyebrowLabel className="mb-3">LEGACY</EyebrowLabel>
                <h2 className="mb-3 font-display text-[22px] leading-[1.2] text-ink-100">
                  Company History
                </h2>
                <p className="mb-6 font-text text-sm leading-relaxed text-ink-300">
                  A family company, Pop&apos;s has served industrial coating needs since 1972
                  blending tradition with innovation to meet our customers needs.
                </p>
                <Button asChild variant="secondary">
                  <Link href="/about-us/history">Learn More</Link>
                </Button>
              </div>

              <div>
                <EyebrowLabel className="mb-3">STANDARDS</EyebrowLabel>
                <h2 className="mb-3 font-display text-[22px] leading-[1.2] text-ink-100">
                  Our Certifications
                </h2>
                <p className="mb-6 font-text text-sm leading-relaxed text-ink-300">
                  Pop&apos;s Industrial Coatings is committed to quality work in full conformance
                  with industry standards. See our certifications.
                </p>
                <Button asChild variant="secondary">
                  <Link href="/request-a-quote/standards-specifications-certifications">
                    Learn More
                  </Link>
                </Button>
              </div>

              <div>
                <EyebrowLabel className="mb-3">CAPABILITIES</EyebrowLabel>
                <h2 className="mb-3 font-display text-[22px] leading-[1.2] text-ink-100">
                  Complete Services
                </h2>
                <p className="mb-6 font-text text-sm leading-relaxed text-ink-300">
                  We pride ourselves in our extensive services and quality products, offering
                  customers one-stop shopping from small to large projects.
                </p>
                <Button asChild variant="secondary">
                  <Link href="/industrial-coatings-services">Learn More</Link>
                </Button>
              </div>
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
