import Image from "next/image";
import Link from "next/link";

import { cn } from "../../lib/utils";
import { Container } from "./container";

type HeaderProps = {
  className?: string;
};

export function Header({ className }: HeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-ink-700/60 bg-ink-900/95 backdrop-blur",
        className,
      )}
    >
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-sm focus:bg-pops-yellow-500 focus:px-4 focus:py-2 focus:font-text focus:text-sm focus:font-semibold focus:uppercase focus:tracking-[0.04em] focus:text-ink-900 focus:shadow-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-pops-yellow-300 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-800"
      >
        Skip to content
      </a>
      <Container className="flex items-center justify-between py-3">
        <Link
          href="/"
          aria-label="Pop's Industrial Coatings — Home"
          className="group inline-flex items-center gap-3 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-pops-yellow-300 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900"
        >
          <Image
            src="/images/Pops-no-border.png"
            alt=""
            width={55}
            height={40}
            priority
            className="h-10 w-auto"
          />
          <span className="font-display text-sm tracking-tight text-ink-100 sm:text-base">
            POP&apos;S INDUSTRIAL COATINGS
          </span>
        </Link>
        <nav aria-label="Primary">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center rounded-sm px-3 py-2 font-text text-sm font-medium uppercase tracking-[0.04em] text-ink-100 outline-none transition-colors hover:text-pops-yellow-500 focus-visible:ring-2 focus-visible:ring-pops-yellow-300 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900"
          >
            Home
          </Link>
        </nav>
      </Container>
    </header>
  );
}
