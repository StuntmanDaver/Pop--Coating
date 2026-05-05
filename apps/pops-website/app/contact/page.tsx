import type { Metadata } from "next";

import { company } from "../../content/company";
import { Container } from "../../components/layout/container";
import { Footer } from "../../components/layout/footer";
import { Header } from "../../components/layout/header";
import { Section } from "../../components/layout/section";
import { EyebrowLabel } from "../../components/marketing/eyebrow";
import { Hero } from "../../components/marketing/hero";
import { MapEmbed } from "../../components/marketing/map-embed";
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
          backgroundImage="/images/slide-01.jpg"
        />

        <Section tone="dark">
          <Container>
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">

              {/* Contact info */}
              <div>
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
                    <div className="space-y-2">
                      <a
                        href={`mailto:${company.emails.info}`}
                        className="block text-pops-yellow-500 hover:text-pops-yellow-300 transition-colors"
                      >
                        {company.emails.info}
                      </a>
                      <a
                        href={`mailto:${company.emails.invoices}`}
                        className="block text-xs text-ink-400 hover:text-ink-200 transition-colors"
                      >
                        {company.emails.invoices}{" "}
                        <span className="text-ink-300">(billing only)</span>
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

                <div className="mt-10">
                  <MapEmbed />
                </div>
              </div>

              {/* Contact form */}
              <div>
                <EyebrowLabel className="mb-4">SEND A MESSAGE</EyebrowLabel>
                <h2 className="mb-2 font-display text-[28px] leading-[1.2] text-ink-100">
                  How can we help?
                </h2>
                <p className="mb-8 font-text text-sm leading-relaxed text-ink-300">
                  Fields marked with <span className="text-pops-yellow-500">*</span> are required.
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
