import type { Metadata } from "next";

import { Container } from "../../components/layout/container";
import { Footer } from "../../components/layout/footer";
import { Header } from "../../components/layout/header";
import { Section } from "../../components/layout/section";
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
        <Section tone="dark" className="pt-10 pb-16 md:pt-14 md:pb-20">
          <Container>
            <div className="mx-auto max-w-[720px]">
              <div className="mb-4 h-px w-16 bg-gradient-to-r from-pops-yellow-500 to-transparent md:mb-5 md:w-24" />
              <p className="mb-3 font-text text-sm font-semibold text-pops-yellow-500">
                Apply now
              </p>
              <h1 className="mb-8 font-display text-[28px] leading-[1.2] text-ink-100 md:text-[32px]">
                Join our team
              </h1>
              <div id="application-form" className="scroll-mt-28">
                <div className="pops-panel rounded-sm p-6 sm:p-8">
                  <JobApplicationForm />
                </div>
              </div>
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
