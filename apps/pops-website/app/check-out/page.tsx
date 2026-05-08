import type { Metadata } from "next";

import { Container } from "../../components/layout/container";
import { Footer } from "../../components/layout/footer";
import { Header } from "../../components/layout/header";
import { Section } from "../../components/layout/section";
import { EyebrowLabel } from "../../components/marketing/eyebrow";
import { Hero } from "../../components/marketing/hero";
import { CheckOutForm } from "./check-out-form";

export const metadata: Metadata = {
  title: "Check Out - Pop's Industrial Coatings",
  description: "Before you leave, please fill out the below form to Check Out!",
};

export default function CheckOutPage() {
  return (
    <>
      <Header />
      <main id="content">
        <Hero
          eyebrow="GUEST"
          heading="Check Out"
          lede="Thank you for visiting. We're glad you were here!"
          primaryCta={{ label: "Back to Home", href: "/" }}
          backgroundImage="/images/slide-01.jpg"
        />

        <Section tone="dark">
          <Container>
            <div className="pops-panel mx-auto max-w-[640px] rounded-sm p-6 sm:p-8">
              <EyebrowLabel className="mb-4">I&apos;M CHECKING OUT:</EyebrowLabel>
              <p className="mb-6 font-text text-sm leading-relaxed text-ink-300">
                Before you leave, please fill out the below form to Check Out!
              </p>
              <CheckOutForm />
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
