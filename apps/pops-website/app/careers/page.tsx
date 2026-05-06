import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "../../components/layout/container";
import { Footer } from "../../components/layout/footer";
import { Header } from "../../components/layout/header";
import { Section } from "../../components/layout/section";
import { EyebrowLabel } from "../../components/marketing/eyebrow";
import { Hero } from "../../components/marketing/hero";
import { Button } from "../../components/ui/button";
import { JobApplicationForm } from "./application-form";

export const metadata: Metadata = {
  title: "Careers - Pop's Industrial Coatings",
  description:
    "Apply for industrial coating, painting, and shop roles at Pop's Industrial Coatings in Lakeland, Florida.",
};

export default function CareersPage() {
  return (
    <>
      <Header />
      <main id="content">
        <Hero
          eyebrow="CAREERS"
          heading="Join our team"
          lede="Skilled trades and industrial finishing professionals — tell us what you do best and we'll be in touch when there's a match."
          primaryCta={{ label: "Start your application", href: "#application-form" }}
          secondaryCta={{ label: "General contact", href: "/contact" }}
          backgroundImage="/images/slide-01.jpg"
        />

        <Section tone="dark">
          <Container>
            <div className="mx-auto max-w-[720px]">
              <div id="application-form" className="scroll-mt-28">
                <div className="pops-panel rounded-sm p-6 sm:p-8">
                  <EyebrowLabel className="mb-4">APPLY ONLINE</EyebrowLabel>
                  <h2 className="mb-2 font-display text-[28px] leading-[1.2] text-ink-100">
                    Job application
                  </h2>
                  <p className="mb-8 font-text text-sm leading-relaxed text-ink-300">
                    Fields marked with <span className="text-pops-yellow-500">*</span> are required.
                    Prefer to talk first?{" "}
                    <Link
                      href="/contact"
                      className="font-semibold text-pops-yellow-500 underline-offset-4 transition-colors hover:text-pops-yellow-300 hover:underline"
                    >
                      Contact us
                    </Link>{" "}
                    or call{" "}
                    <a
                      href="tel:8636447473"
                      className="font-semibold text-pops-yellow-500 underline-offset-4 transition-colors hover:text-pops-yellow-300 hover:underline"
                    >
                      863.644.7473
                    </a>
                    .
                  </p>
                  <JobApplicationForm />
                </div>
              </div>

              <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
                <Button asChild variant="secondary" className="min-h-12">
                  <Link href="/contact">Back to contact</Link>
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
