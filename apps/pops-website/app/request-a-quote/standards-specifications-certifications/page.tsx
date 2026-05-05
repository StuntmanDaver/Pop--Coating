import type { Metadata } from "next";
import Image from "next/image";

import { Container } from "../../../components/layout/container";
import { Footer } from "../../../components/layout/footer";
import { Header } from "../../../components/layout/header";
import { Section } from "../../../components/layout/section";
import { EyebrowLabel } from "../../../components/marketing/eyebrow";
import { Hero } from "../../../components/marketing/hero";

export const metadata: Metadata = {
  title: "Standards, Specifications & Certifications - Pop's Industrial Coatings",
  description:
    "Located in Lakeland FL, Pop's Industrial Coatings adheres to strict industry specifications & best practices. Read about our certifications & the standards that guide us.",
};

export default function StandardsPage() {
  return (
    <>
      <Header />
      <main id="content">
        <Hero
          eyebrow="QUALITY ASSURANCE"
          heading="Standards, Specifications & Certifications"
          lede="Pop's Industrial Coatings adheres to strict industry specifications and best practices to achieve the utmost in quality workmanship."
          primaryCta={{ label: "Request a Quote", href: "/request-a-quote" }}
          backgroundImage="/images/slide-01.jpg"
        />

        <Section tone="dark">
          <Container>
            <div className="mx-auto max-w-[720px] space-y-12 sm:space-y-16">

              {/* SSPC */}
              <div>
                <div className="mb-8 flex justify-center">
                  <Image
                    src="/images/sspc-accredited-contractor.png"
                    alt="SSPC Accredited Contractor logo"
                    width={200}
                    height={200}
                    sizes="200px"
                    className="object-contain"
                  />
                </div>
                <EyebrowLabel className="mb-3">SSPC CERTIFICATION</EyebrowLabel>
                <h2 className="mb-4 font-display text-[28px] leading-[1.2] text-ink-100">
                  We Are AAMP QP-3 Certified
                </h2>
                <p className="mb-6 font-text text-base leading-relaxed text-ink-100">
                  The QP 3 accreditation is an internationally recognized program that evaluates
                  the practices of shop painting facilities in key areas of business.
                </p>
                <a
                  href="/pdfs/SSPC-QP3-Pops-Coatings-Certificate-expires-3-31-27.pdf"
                  target="_blank"
                  rel="noopener"
                  aria-label="Download SSPC QP3 Certificate, expires 03/31/2027 — PDF download"
                  className="inline-flex items-center gap-2 font-text text-sm font-semibold text-pops-yellow-500 hover:text-pops-yellow-300 transition-colors"
                >
                  <span aria-hidden="true">↓</span>
                  <span>Download SSPC QP 3 Certificate, Expiration Date 03/31/2027</span>
                  <span className="text-ink-400 font-normal">(PDF)</span>
                </a>
              </div>

              {/* FDOT */}
              <div>
                <div className="mb-8 flex justify-center">
                  <Image
                    src="/images/fdot-logo-color-768x339-1.png"
                    alt="Florida Department of Transportation logo"
                    width={320}
                    height={141}
                    sizes="320px"
                    className="object-contain"
                  />
                </div>
                <EyebrowLabel className="mb-3">FDOT APPROVAL</EyebrowLabel>
                <h2 className="mb-4 font-display text-[28px] leading-[1.2] text-ink-100">
                  We Are FDOT Approved
                </h2>
                <p className="mb-6 font-text text-base leading-relaxed text-ink-100">
                  Facility ID PA-FL-002
                </p>
                <a
                  href="/pdfs/2025-03-06-Pops-Industrial-Coatings-FDOT-Audit-QCPIR.pdf"
                  target="_blank"
                  rel="noopener"
                  aria-label="Download FDOT Audit QCPIR inspection report dated 03/05/2025 — PDF download"
                  className="inline-flex items-center gap-2 font-text text-sm font-semibold text-pops-yellow-500 hover:text-pops-yellow-300 transition-colors"
                >
                  <span aria-hidden="true">↓</span>
                  <span>Download Inspection Report Dated 03/05/2025</span>
                  <span className="text-ink-400 font-normal">(PDF)</span>
                </a>
              </div>

            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
