import type { Metadata } from "next";

import { Container } from "../../components/layout/container";
import { Footer } from "../../components/layout/footer";
import { Header } from "../../components/layout/header";
import { Section } from "../../components/layout/section";
import { EyebrowLabel } from "../../components/marketing/eyebrow";
import { Hero } from "../../components/marketing/hero";
import { QuoteForm } from "./quote-form";

export const metadata: Metadata = {
  title: "Request a Quote - Pop's Industrial Coatings",
  description:
    "Request a quote for industrial painting, powder coating, or abrasive blasting services in Lakeland, FL. We'll get back to you within one business day.",
};

export default function RequestAQuotePage() {
  return (
    <>
      <Header />
      <main id="content">
        <Hero
          eyebrow="GET STARTED"
          heading="Request a Quote"
          lede="Tell us about your project and we'll get back to you within one business day."
          primaryCta={{ label: "Call us: 863.644.7473", href: "tel:8636447473" }}
          backgroundImage="/images/slide-01.jpg"
        />

        <Section tone="dark">
          <Container>
            <div className="pops-panel mx-auto max-w-[720px] rounded-sm p-6 sm:p-8">
              <EyebrowLabel className="mb-4">YOUR PROJECT</EyebrowLabel>
              <h2 className="mb-2 font-display text-[28px] leading-[1.2] text-ink-100">
                Tell us about your needs
              </h2>
              <p className="mb-10 font-text text-base leading-relaxed text-ink-300">
                Fields marked with <span className="text-pops-yellow-500">*</span> are required.
              </p>
              <QuoteForm />
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
