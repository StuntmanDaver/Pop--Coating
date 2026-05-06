"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Container } from "./container";

interface HeaderProps {
  className?: string;
}

interface NavLink {
  label: string;
  href: string;
}

const NAV_LINKS: ReadonlyArray<NavLink> = [
  { label: "Services", href: "/industrial-coatings-services" },
  { label: "About Us", href: "/about-us" },
  { label: "Contact",  href: "/contact" },
];

/** Pixel threshold below which the header is always visible. */
const REVEAL_THRESHOLD_PX = 80;

/** Sticky site header.
 *
 * Hides on scroll-down past `REVEAL_THRESHOLD_PX`, reappears immediately on
 * scroll-up — same pattern as Commvault and most modern marketing nav bars.
 * The transform-based hide keeps the bar on the compositor and avoids layout
 * thrash on scroll.
 */
export function Header({ className }: HeaderProps) {
  const [hidden, setHidden] = useState(false);
  const lastYRef = useRef<number>(0);

  useEffect(() => {
    const handleScroll = (): void => {
      const y = window.scrollY;
      const last = lastYRef.current;
      const delta = y - last;

      if (y < REVEAL_THRESHOLD_PX) {
        setHidden(false);
      } else if (delta > 4) {
        setHidden(true);
      } else if (delta < -4) {
        setHidden(false);
      }

      lastYRef.current = y;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header
      data-hidden={hidden ? "true" : "false"}
      className={cn(
        "sticky top-0 z-50 w-full border-b border-ink-200 bg-canvas/95 backdrop-blur",
        "transition-transform duration-200 ease-out will-change-transform",
        "data-[hidden=true]:-translate-y-full data-[hidden=true]:shadow-none",
        className,
      )}
    >
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-sm focus:bg-pops-yellow-500 focus:px-4 focus:py-2 focus:font-text focus:text-sm focus:font-semibold focus:uppercase focus:tracking-[0.04em] focus:text-ink-900 focus:shadow-3 focus:outline-none"
      >
        Skip to content
      </a>

      <Container className="flex items-center justify-between gap-6 py-3">
        {/* Logo */}
        <Link
          href="/"
          aria-label="Pop's Industrial Coatings — Home"
          className="group inline-flex shrink-0 items-center gap-3 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-pops-yellow-500 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
        >
          <Image
            src="/images/Pops-no-border.png"
            alt=""
            width={55}
            height={40}
            priority
            className="h-10 w-auto"
          />
          <span className="font-display text-sm tracking-tight text-ink-900 sm:text-base">
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
        <div className="flex items-center gap-3">
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
