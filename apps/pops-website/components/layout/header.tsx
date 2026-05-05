import Image from "next/image";
import Link from "next/link";

import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Container } from "./container";

type HeaderProps = {
  className?: string;
};

const NAV_LINKS = [
  { label: "Services", href: "/industrial-coatings-services" },
  { label: "About Us", href: "/about-us" },
  { label: "Contact",  href: "/contact" },
];

export function Header({ className }: HeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-ink-200 bg-canvas/95 backdrop-blur",
        className,
      )}
    >
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-sm focus:bg-pops-yellow-500 focus:px-4 focus:py-2 focus:font-text focus:text-sm focus:font-semibold focus:uppercase focus:tracking-[0.04em] focus:text-ink-900 focus:shadow-3 focus:outline-none"
      >
        Skip to content
      </a>

      <Container className="flex items-center justify-between gap-3 py-3 sm:gap-6">
        {/* Logo */}
        <Link
          href="/"
          aria-label="Pop's Industrial Coatings — Home"
          className="group inline-flex min-w-0 flex-1 items-center gap-2.5 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-pops-yellow-500 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas sm:flex-initial sm:gap-3"
        >
          <Image
            src="/images/Pops-no-border.png"
            alt=""
            width={55}
            height={40}
            priority
            className="h-9 w-auto shrink-0 sm:h-10"
          />
          <span className="min-w-0 truncate font-display text-[13px] leading-tight tracking-tight text-ink-900 sm:text-base">
            POP&apos;S INDUSTRIAL COATINGS
          </span>
        </Link>

        {/* Primary nav — desktop */}
        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex min-h-11 items-center rounded-sm px-3 py-2 font-text text-sm font-medium text-ink-600 outline-none transition-colors hover:text-ink-900 focus-visible:ring-2 focus-visible:ring-pops-yellow-500 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA + mobile menu trigger */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Button asChild variant="primary" size="compact" className="hidden sm:inline-flex">
            <Link href="/request-a-quote">Request a Quote</Link>
          </Button>

          {/* Mobile hamburger — visual only; full mobile nav is a Wave 2 enhancement */}
          <button
            type="button"
            aria-label="Open navigation menu"
            className="inline-flex min-h-11 w-11 items-center justify-center rounded-sm text-ink-600 transition-colors hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pops-yellow-500 md:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M3 5h14M3 10h14M3 15h14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </Container>
    </header>
  );
}
