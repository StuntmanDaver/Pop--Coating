import type { Metadata } from "next";

import { Container } from "../../components/layout/container";
import { Footer } from "../../components/layout/footer";
import { Header } from "../../components/layout/header";
import { Section } from "../../components/layout/section";
import { EyebrowLabel } from "../../components/marketing/eyebrow";
import { Hero } from "../../components/marketing/hero";
import { CheckInForm } from "./check-in-form";

export const metadata: Metadata = {
  title: "Check In - Pop's Industrial Coatings",
  description: "Welcome! Please fill out the below to check in.",
};

export default function CheckInPage() {
  return (
    <>
      <Header />
      <main id="content">
        <Hero
          eyebrow="GUEST"
          heading="Check In"
          lede="Welcome! Please fill out the below to check in."
          primaryCta={{ label: "Guest Safety Rules", href: "/guest-safety-rules" }}
          backgroundImage="/images/slide-01.jpg"
        />

        <Section tone="dark">
          <Container>
            <div className="mx-auto max-w-[640px]">
              <EyebrowLabel className="mb-4">I&apos;M CHECKING IN:</EyebrowLabel>
              <CheckInForm />
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
