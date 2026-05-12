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
        "group rounded-sm transition-[background-color,transform] duration-700 ease-in-out hover:-translate-y-0.5 hover:bg-pops-yellow-500/[0.03]",
        className,
      )}
    >
      <Link
        href={href}
        className="block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pops-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      >
        <div className="flex flex-col-reverse gap-5 py-8 md:grid md:grid-cols-[1fr_180px] md:items-center md:gap-8 md:py-10">
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-[1.375rem] leading-tight tracking-tight text-pops-yellow-500 sm:text-xl md:text-2xl">
              {name}
            </h3>
            <p className="mt-2 font-text text-[0.9375rem] leading-relaxed text-ink-200 sm:mt-1.5 sm:text-sm md:text-base">
              {lede}
            </p>
            <span className="mt-5 inline-flex min-h-11 items-center gap-1.5 font-text text-sm font-semibold text-pops-yellow-300 transition-colors duration-500 ease-in-out group-hover:text-pops-yellow-500 sm:mt-4">
              <span>Learn more</span>
              <span
                aria-hidden="true"
                className="inline-block transition-transform duration-500 ease-in-out group-hover:translate-x-0.5"
              >
                →
              </span>
            </span>
          </div>

          <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-sm shadow-[0_0_24px_-8px_rgba(254,205,8,0.2)] md:aspect-auto md:h-[120px] md:w-[180px] md:justify-self-end">
            <Image
              src={image}
              alt={alt}
              fill
              sizes="(min-width: 768px) 180px, 100vw"
              className="object-cover object-center transition-transform duration-[900ms] ease-in-out group-hover:scale-[1.06]"
            />
          </div>
        </div>
      </Link>
    </div>
  );
}
