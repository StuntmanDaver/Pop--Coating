import type { Metadata } from "next";
import Link from "next/link";

import { company } from "../../content/company";
import { Container } from "../../components/layout/container";
import { Footer } from "../../components/layout/footer";
import { Header } from "../../components/layout/header";
import { Section } from "../../components/layout/section";
import { EyebrowLabel } from "../../components/marketing/eyebrow";
import { Hero } from "../../components/marketing/hero";
import { MapEmbed } from "../../components/marketing/map-embed";
import { Button } from "../../components/ui/button";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact - Pop's Industrial Coatings",
  description:
    "Your Lakeland Florida Industrial Painting & Coating Company - Industrial Paint and Powder Coating Services",
};

export default function ContactPage() {
  return (
    <>
      <Header />
      <main id="content">
        <Hero
          eyebrow="GET IN TOUCH"
          heading="Contact"
          lede="Reach us by phone, email, or the form below. We respond within one business day."
          primaryCta={{ label: "Call us: 863.644.7473", href: "tel:8636447473" }}
          secondaryCta={{ label: "Request a quote", href: "/request-a-quote" }}
          stackPrimaryActions
          backgroundImage="/images/slide-01.jpg"
        />

        <Section tone="dark">
          <Container>
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">

              {/* Contact info */}
              <div className="pops-panel rounded-sm p-6 sm:p-8">
                <EyebrowLabel className="mb-4">CONTACT INFORMATION</EyebrowLabel>
                <h2 className="mb-8 font-display text-[28px] leading-[1.2] text-ink-100">
                  {company.name}
                </h2>

                <div className="space-y-6 font-text text-sm text-ink-100">
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-400">
                      Main Office
                    </p>
                    <address className="not-italic">
                      {company.mainOffice.street}<br />
                      {company.mainOffice.city}, {company.mainOffice.state} {company.mainOffice.zip}
                    </address>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-400">
                      Shipping &amp; Receiving
                    </p>
                    <address className="not-italic">
                      {company.shippingReceiving.street}<br />
                      {company.shippingReceiving.city}, {company.shippingReceiving.state} {company.shippingReceiving.zip}
                    </address>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-400">
                      Phone
                    </p>
                    <a
                      href={`tel:${company.phone.replace(/\./g, "")}`}
                      className="text-pops-yellow-500 hover:text-pops-yellow-300 transition-colors"
                    >
                      {company.phone}
                    </a>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-400">
                      Fax
                    </p>
                    <span>{company.fax}</span>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-400">
                      Email
                    </p>
                    <div className="space-y-1">
                      <a
                        href={`mailto:${company.emails.info}`}
                        className="block text-pops-yellow-500 hover:text-pops-yellow-300 transition-colors"
                      >
                        {company.emails.info}
                      </a>
                      <a
                        href={`mailto:${company.emails.invoices}`}
                        className="block text-pops-yellow-500 hover:text-pops-yellow-300 transition-colors"
                      >
                        {company.emails.invoices}
                      </a>
                    </div>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-400">
                      Hours
                    </p>
                    <span>{company.hours}</span>
                  </div>
                </div>

                <div className="mt-10 rounded-sm border border-pops-yellow-500/25 bg-gradient-to-br from-ink-900/90 via-black/50 to-ink-900/80 p-6 ring-1 ring-inset ring-pops-yellow-500/10">
                  <EyebrowLabel className="mb-3">CAREERS</EyebrowLabel>
                  <p className="font-display text-lg leading-snug text-ink-100">
                    Join our team in Lakeland
                  </p>
                  <p className="mt-2 font-text text-sm leading-relaxed text-ink-300">
                    We hire coatings and industrial talent. Apply online — we follow up when there&apos;s a fit.
                  </p>
                  <Button asChild variant="primary" className="mt-5 min-h-11 w-full sm:w-auto">
                    <Link href="/careers">Apply now</Link>
                  </Button>
                </div>

                <div className="mt-10">
                  <MapEmbed />
                </div>
              </div>

              {/* Contact form */}
              <div className="pops-panel rounded-sm p-6 sm:p-8">
                <EyebrowLabel className="mb-4">SEND A MESSAGE</EyebrowLabel>
                <h2 className="mb-2 font-display text-[28px] leading-[1.2] text-ink-100">
                  How can we help?
                </h2>
                <p className="mb-8 font-text text-sm leading-relaxed text-ink-300">
                  Fields marked with <span className="text-pops-yellow-500">*</span> are required.
                </p>
                <p className="-mt-4 mb-8 font-text text-sm text-ink-400">
                  Looking for work?{" "}
                  <Link
                    href="/careers"
                    className="font-semibold text-pops-yellow-500 underline-offset-4 transition-colors hover:text-pops-yellow-300 hover:underline"
                  >
                    Submit a job application
                  </Link>{" "}
                  instead.
                </p>
                <ContactForm />
              </div>

            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
