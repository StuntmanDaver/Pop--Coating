import Image from "next/image";
import Link from "next/link";

import siteGlobals from "../../content/site-globals.json";
import { company } from "../../content/company";
import { Button } from "../ui/button";
import { Container } from "./container";

type LinkEntry = { label: string; href: string };
type ValueEntry = { label: string; value: string };
type ColumnEntry = LinkEntry | ValueEntry;

const isLinkEntry = (entry: ColumnEntry): entry is LinkEntry =>
  "href" in entry && typeof entry.href === "string";

// Strip the live-site origin from scraped URLs so they navigate within the rebuild.
const toRelative = (url: string): string => {
  try {
    const u = new URL(url);
    return u.pathname.replace(/\/$/, "") || "/";
  } catch {
    return url;
  }
};

const navigationColumns = siteGlobals.footer.navigation_columns as Record<
  string,
  ColumnEntry[]
>;

const columnTitles = Object.keys(navigationColumns) as [string, string, string];

export function Footer() {
  const [doingBusinessTitle, servicesTitle, visitingTitle] = columnTitles;

  return (
    <footer className="pops-section-gold-wash border-t border-pops-yellow-500/30 text-ink-100">
      <Container className="relative z-10">
        <div className="grid grid-cols-1 gap-12 py-16 md:grid-cols-3 md:gap-10 md:py-20">
          <FooterColumn title={doingBusinessTitle} headingId="footer-col-business">
            <div className="mb-5">
              <Link
                href="/"
                className="inline-block overflow-visible rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-pops-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]"
              >
                <span className="relative inline-block h-28 w-[calc(7rem*682/1024)] overflow-visible sm:h-32 sm:w-[calc(8rem*682/1024)] md:h-36 md:w-[calc(9rem*682/1024)]">
                  <Image
                    src="/images/pops-logo-header-footer.png"
                    alt="Pop's Industrial Coatings"
                    fill
                    sizes="260px"
                    className="object-contain object-left scale-[1.26] [transform-origin:0%_50%]"
                    priority={false}
                  />
                </span>
              </Link>
            </div>
            <FooterNav
              ariaLabelledBy="footer-col-business"
              entries={navigationColumns[doingBusinessTitle] ?? []}
            />
            <div className="mt-8">
              <Button asChild variant="primary" size="default">
                <Link href="/request-a-quote">GET A QUOTE</Link>
              </Button>
            </div>
          </FooterColumn>

          <FooterColumn title={servicesTitle} headingId="footer-col-services">
            <FooterNav
              ariaLabelledBy="footer-col-services"
              entries={navigationColumns[servicesTitle] ?? []}
            />
          </FooterColumn>

          <FooterColumn title={visitingTitle} headingId="footer-col-visiting">
            <div className="space-y-6 font-text text-sm leading-relaxed text-ink-100">
              <FooterAddress
                label="Main Office"
                street={company.mainOffice.street}
                city={company.mainOffice.city}
                state={company.mainOffice.state}
                zip={company.mainOffice.zip}
              />
              <FooterAddress
                label="Shipping & Receiving"
                street={company.shippingReceiving.street}
                city={company.shippingReceiving.city}
                state={company.shippingReceiving.state}
                zip={company.shippingReceiving.zip}
              />
              <ul className="space-y-2 not-italic">
                <li>
                  <span className="text-ink-400">Phone:&nbsp;</span>
                  <a
                    href="tel:+18636447473"
                    className="rounded-sm underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pops-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  >
                    {company.phone}
                  </a>
                </li>
                <li>
                  <span className="text-ink-400">Fax:&nbsp;</span>
                  <span>{company.fax}</span>
                </li>
                <li>
                  <a
                    href={`mailto:${company.emails.info}`}
                    className="rounded-sm underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pops-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  >
                    {company.emails.info}
                  </a>
                </li>
                <li>
                  <a
                    href={`mailto:${company.emails.invoices}`}
                    className="rounded-sm underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pops-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  >
                    {company.emails.invoices}
                  </a>
                </li>
              </ul>
              <p className="text-ink-300">{company.hours}</p>
            </div>
          </FooterColumn>
        </div>

        <div className="border-t border-pops-yellow-500/15 py-6 font-text text-xs text-ink-400">
          <p>
            &copy; {new Date().getFullYear()} {company.name}. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
}

type FooterColumnProps = {
  title: string;
  headingId: string;
  children: React.ReactNode;
};

function FooterColumn({ title, headingId, children }: FooterColumnProps) {
  return (
    <div>
      <h2
        id={headingId}
        className="mb-4 font-text text-xs font-semibold uppercase tracking-[0.04em] text-pops-yellow-500"
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

type FooterNavProps = {
  ariaLabelledBy: string;
  entries: ColumnEntry[];
};

function FooterNav({ ariaLabelledBy, entries }: FooterNavProps) {
  return (
    <nav aria-labelledby={ariaLabelledBy}>
      <ul className="space-y-3 font-text text-sm">
        {entries.map((entry, index) => {
          if (isLinkEntry(entry)) {
            return (
              <li key={`${entry.label}-${index}`}>
                <Link
                  href={toRelative(entry.href)}
                  className="inline-block min-h-11 rounded-sm py-2 text-ink-100 underline-offset-2 hover:text-pops-yellow-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pops-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  {entry.label}
                </Link>
              </li>
            );
          }
          return (
            <li key={`${entry.label}-${index}`} className="text-ink-100">
              {entry.value}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

type FooterAddressProps = {
  label: string;
  street: string;
  city: string;
  state: string;
  zip: string;
};

function FooterAddress({ label, street, city, state, zip }: FooterAddressProps) {
  return (
    <div>
      <p className="mb-1 font-text text-xs font-semibold uppercase tracking-[0.04em] text-ink-400">
        {label}
      </p>
      <address className="not-italic font-text text-sm text-ink-100">
        {street}
        <br />
        {city}, {state} {zip}
      </address>
    </div>
  );
}
