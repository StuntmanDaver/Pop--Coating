import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Container } from "../../../components/layout/container";
import { Footer } from "../../../components/layout/footer";
import { Header } from "../../../components/layout/header";
import { Section } from "../../../components/layout/section";
import { EyebrowLabel } from "../../../components/marketing/eyebrow";
import { Button } from "../../../components/ui/button";

export const metadata: Metadata = {
  title: "History - Pop's Industrial Coatings",
  description:
    "Founded in 1972, we have over 50 years experience in industrial coating services. Family-owned and operated, we are proud of our experience and skills.",
};

export default function HistoryPage() {
  return (
    <>
      <Header />
      <main id="content">
        <Section tone="dark" className="pt-10 pb-16 md:pt-14 md:pb-20">
          <Container>
            <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1fr_320px]">
              {/* Story body */}
              <div>
                <header className="mb-10 md:mb-12">
                  <EyebrowLabel className="mb-3">OUR LEGACY</EyebrowLabel>
                  <h1 className="font-display text-[28px] leading-[1.2] text-ink-100 md:text-[32px]">
                    Our History
                  </h1>
                  <p className="mt-3 max-w-[720px] font-text text-base leading-relaxed text-ink-300">
                    Founded in 1972, Pop&apos;s Industrial Coatings has over 50 years of experience
                    in industrial coating services.
                  </p>
                </header>

                <EyebrowLabel className="mb-4">OUR STORY</EyebrowLabel>
                <h2 className="mb-8 font-display text-[28px] leading-[1.2] text-ink-100">
                  A legacy built over four generations
                </h2>

                <p className="font-text text-base leading-relaxed text-ink-100">
                  Beginning with our founding generation in 1972, we embarked on a journey to master
                  the art and science of industrial coatings. Over the years, this commitment has
                  been passed down through four generations, each contributing to our legacy of
                  excellence. Our history is not just a chronicle of time; it&apos;s a testament to
                  our enduring passion for quality and innovation.
                </p>

                <p className="mt-6 font-text text-base leading-relaxed text-ink-100">
                  What sets us apart is our unwavering commitment to comprehending and fulfilling the
                  unique needs of our clients. We view each project as an opportunity to exceed
                  expectations, delivering workmanship and services of the highest quality. Our
                  underlying objective is to establish widespread recognition as a provider of
                  unparalleled services within the industry while ensuring timely delivery.
                </p>

                <p className="mt-6 font-text text-base leading-relaxed text-ink-100">
                  Dedicated to excellence, we actively promote open and participatory engagement across
                  all aspects of our organization. Our team works collaboratively to achieve
                  objectives and maintain the highest standards. We don&apos;t just view our clients
                  as customers; we consider them partners in success. By fostering a culture of
                  collaboration, we ensure that every project benefits from collective expertise and
                  dedication.
                </p>

                <p className="mt-6 font-text text-base leading-relaxed text-ink-100">
                  At Pop&apos;s Industrial Coatings, our history is not just a story; it&apos;s a
                  foundation upon which we continue to build a future. Join us in our journey, and
                  let&apos;s create lasting success together.
                </p>

                <div className="mt-10">
                  <Button asChild variant="secondary">
                    <Link href="/about-us/leadership">Meet the Family</Link>
                  </Button>
                </div>
              </div>

              {/* Founder photo */}
              <div className="flex flex-col items-start">
                <div className="relative w-full max-w-[320px] overflow-hidden rounded-md bg-ink-900">
                  <Image
                    src="/images/marcus-woods-pops-industrial-coatings.jpg"
                    alt="Marcus Woods, founder of Pop's Industrial Coatings"
                    width={320}
                    height={400}
                    sizes="320px"
                    className="w-full object-contain object-center"
                  />
                </div>
                <p className="mt-3 font-text text-sm text-ink-300">Founder Marcus Woods</p>
              </div>
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
