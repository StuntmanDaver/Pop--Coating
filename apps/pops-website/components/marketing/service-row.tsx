import Image from "next/image";
import Link from "next/link";

import { cn } from "../../lib/utils";

type ServiceRowProps = {
  number: string;
  name: string;
  lede: string;
  image: string;
  href: string;
  alt: string;
  className?: string;
};

export function ServiceRow({
  number,
  name,
  lede,
  image,
  href,
  alt,
  className,
}: ServiceRowProps) {
  return (
    <div className={cn("group border-t border-ink-200 transition-colors duration-150 hover:bg-ink-50", className)}>
      <Link
        href={href}
        className="block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pops-yellow-500 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
      >
        <div className="flex items-center gap-4 py-6 sm:gap-6 sm:py-8 md:grid md:grid-cols-[3.5rem_1fr_180px] md:gap-8 md:py-10">
          {/* Service number */}
          <span
            className="shrink-0 font-display text-3xl leading-none text-pops-yellow-500/35 transition-colors duration-150 group-hover:text-pops-yellow-500/65 sm:text-4xl md:text-5xl"
            aria-hidden="true"
          >
            {number}
          </span>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-lg tracking-tight text-ink-900 sm:text-xl md:text-2xl">
              {name}
            </h3>
            <p className="mt-1.5 font-text text-sm leading-relaxed text-ink-500 md:text-base">
              {lede}
            </p>
            <span className="mt-3 inline-flex items-center gap-1.5 font-text text-sm font-semibold text-pops-yellow-600 transition-colors duration-150 group-hover:text-pops-yellow-500 sm:mt-4">
              <span>Learn more</span>
              <span
                aria-hidden="true"
                className="inline-block transition-transform duration-150 group-hover:translate-x-0.5"
              >
                →
              </span>
            </span>
          </div>

          {/* Thumbnail — desktop only */}
          <div className="relative hidden h-[120px] w-[180px] shrink-0 overflow-hidden rounded-sm shadow-1 md:block">
            <Image
              src={image}
              alt={alt}
              fill
              sizes="180px"
              className="object-cover transition-transform duration-200 ease-out group-hover:scale-[1.03]"
            />
          </div>
        </div>
      </Link>
    </div>
  );
}
