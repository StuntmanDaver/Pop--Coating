import Image from "next/image";
import Link from "next/link";

import { cn } from "../../lib/utils";

type ServiceRowProps = {
  name: string;
  lede: string;
  image: string;
  href: string;
  alt: string;
  className?: string;
};

export function ServiceRow({
  name,
  lede,
  image,
  href,
  alt,
  className,
}: ServiceRowProps) {
  return (
    <div
      className={cn(
        "group rounded-sm transition-colors duration-300 hover:bg-pops-yellow-500/[0.03]",
        className,
      )}
    >
      <Link
        href={href}
        className="block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pops-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      >
        <div className="flex items-center gap-6 py-8 md:grid md:grid-cols-[1fr_180px] md:gap-8 md:py-10">
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-xl tracking-tight text-pops-yellow-500 md:text-2xl">
              {name}
            </h3>
            <p className="mt-1.5 font-text text-sm leading-relaxed text-ink-200 md:text-base">
              {lede}
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 font-text text-sm font-semibold text-pops-yellow-300 transition-colors duration-150 group-hover:text-pops-yellow-500">
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
          <div className="relative hidden h-[120px] w-[180px] shrink-0 overflow-hidden rounded-sm shadow-[0_0_24px_-8px_rgba(254,205,8,0.2)] md:block">
            <Image
              src={image}
              alt={alt}
              fill
              sizes="180px"
              className="object-cover object-center transition-transform duration-200 ease-out group-hover:scale-[1.03]"
            />
          </div>
        </div>
      </Link>
    </div>
  );
}
