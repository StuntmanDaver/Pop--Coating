import Image from "next/image";
import Link from "next/link";

import { cn } from "../../lib/utils";
import { Card } from "../ui/card";
import { EyebrowLabel } from "./eyebrow";

type ServiceTileProps = {
  number: string;
  name: string;
  lede: string;
  image: string;
  href: string;
  alt: string;
  className?: string;
};

export function ServiceTile({
  number,
  name,
  lede,
  image,
  href,
  alt,
  className,
}: ServiceTileProps) {
  return (
    <Card interactive className={cn("overflow-hidden p-0", className)}>
      <Link
        href={href}
        className="group block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pops-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-ink-800">
          <Image
            src={image}
            alt={alt}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-contain object-center transition-transform duration-200 ease-out motion-safe:group-hover:scale-[1.03]"
          />
        </div>
        <div className="p-6">
          <EyebrowLabel>{`Service ${number} / ${name}`}</EyebrowLabel>
          <h3 className="mt-2 font-text text-lg font-bold leading-tight tracking-tight">
            {name}
          </h3>
          <p className="mt-2 line-clamp-2 font-text text-sm leading-relaxed opacity-80">
            {lede}
          </p>
          <p className="mt-4 inline-flex items-center gap-2 font-text text-sm font-semibold text-pops-yellow-500">
            <span aria-hidden="true">→</span>
            <span>Learn more</span>
          </p>
        </div>
      </Link>
    </Card>
  );
}
