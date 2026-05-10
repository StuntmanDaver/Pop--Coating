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
  title: "Standards, Specifications & Certifications - Pop's Industrial Coatings",
  description:
    "Located in Lakeland FL, Pop's Industrial Coatings adheres to strict industry specifications & best practices. Read about our certifications & the standards that guide us.",
};

/** Offset for sticky header when following in-page links (e.g. from the home page marquee). */
const ANCHOR_SCROLL_CLASS = "scroll-mt-28";

export default function StandardsPage() {
  return (
    <>
      <Header />
      <main id="content">
        <Section tone="dark" className="pt-10 pb-16 md:pt-14 md:pb-20">
          <Container>
            <div className="mx-auto max-w-[720px] space-y-16">
              <header className="border-b border-pops-yellow-500/15 pb-10">
                <EyebrowLabel className="mb-3">OUR</EyebrowLabel>
                <h1 className="font-display text-[28px] leading-[1.2] text-ink-100">
                  Certifications
                </h1>
              </header>

              {/* SSPC */}
              <section
                id="sspc-qp3"
                aria-labelledby="sspc-heading"
                className={ANCHOR_SCROLL_CLASS}
              >
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
                <h2
                  id="sspc-heading"
                  className="mb-4 font-display text-[28px] leading-[1.2] text-ink-100"
                >
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
                  className="inline-flex items-center gap-2 font-text text-sm font-semibold text-pops-yellow-500 transition-colors hover:text-pops-yellow-300"
                >
                  <span aria-hidden="true">↓</span>
                  <span>Download SSPC QP 3 Certificate, Expiration Date 03/31/2027</span>
                  <span className="font-normal text-ink-400">(PDF)</span>
                </a>
              </section>

              {/* FDOT */}
              <section
                id="fdot-approval"
                aria-labelledby="fdot-heading"
                className={ANCHOR_SCROLL_CLASS}
              >
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
                <h2
                  id="fdot-heading"
                  className="mb-4 font-display text-[28px] leading-[1.2] text-ink-100"
                >
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
                  className="inline-flex items-center gap-2 font-text text-sm font-semibold text-pops-yellow-500 transition-colors hover:text-pops-yellow-300"
                >
                  <span aria-hidden="true">↓</span>
                  <span>Download Inspection Report Dated 03/05/2025</span>
                  <span className="font-normal text-ink-400">(PDF)</span>
                </a>
              </section>

              {/* Lakeland — local credentials (marquee badge) */}
              <section
                id="lakeland-certified"
                aria-labelledby="lakeland-heading"
                className={ANCHOR_SCROLL_CLASS}
              >
                <div className="mb-8 flex justify-center">
                  <Image
                    src="/images/lakeland-fl-certified-industrial-coatings.png"
                    alt="Lakeland certified industrial coatings recognition mark"
                    width={240}
                    height={200}
                    sizes="240px"
                    className="object-contain"
                  />
                </div>
                <EyebrowLabel className="mb-3">LOCAL CREDENTIALS</EyebrowLabel>
                <h2
                  id="lakeland-heading"
                  className="mb-4 font-display text-[28px] leading-[1.2] text-ink-100"
                >
                  Certified industrial coatings in Lakeland, FL
                </h2>
                <p className="font-text text-base leading-relaxed text-ink-100">
                  Family-owned and operated in Lakeland, serving Polk County and Central Florida with
                  shop painting, powder coating, and surface preparation backed by the credentials
                  above.
                </p>
              </section>

              <div className="border-t border-pops-yellow-500/15 pt-10">
                <p className="font-text text-base leading-relaxed text-ink-300">
                  Questions about specs or a project? We&apos;re happy to walk through what applies.
                </p>
                <div className="mt-6">
                  <Button asChild variant="secondary" size="compact">
                    <Link href="/request-a-quote">Request a Quote</Link>
                  </Button>
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
