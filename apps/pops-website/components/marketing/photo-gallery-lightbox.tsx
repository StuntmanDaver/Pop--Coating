"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import { cn } from "../../lib/utils";

type Photo = {
  src: string;
  alt: string;
};

type PhotoGalleryLightboxProps = {
  photos: readonly Photo[];
  className?: string;
  itemClassName?: string;
  imageClassName?: string;
  imageClassNameForIndex?: (index: number) => string | undefined;
  sizes?: string;
};

export function PhotoGalleryLightbox({
  photos,
  className,
  itemClassName,
  imageClassName,
  imageClassNameForIndex,
  sizes = "(min-width: 640px) 33vw, 50vw",
}: PhotoGalleryLightboxProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const totalPhotos = photos.length;
  const activePhoto = activeIndex === null ? null : photos[activeIndex] ?? null;

  const goNext = () => {
    if (activeIndex === null || totalPhotos <= 1) return;
    setActiveIndex((activeIndex + 1) % totalPhotos);
  };

  const goPrev = () => {
    if (activeIndex === null || totalPhotos <= 1) return;
    setActiveIndex((activeIndex - 1 + totalPhotos) % totalPhotos);
  };

  useEffect(() => {
    if (activeIndex === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveIndex(null);
      if (event.key === "ArrowRight") goNext();
      if (event.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, totalPhotos]);

  return (
    <>
      <div className={cn("grid grid-cols-2 gap-4 sm:grid-cols-3", className)}>
        {photos.map((photo, i) => (
          <button
            key={photo.src}
            type="button"
            aria-label={`View enlarged photo ${i + 1}`}
            onClick={() => setActiveIndex(i)}
            className={cn(
              "relative aspect-[4/3] overflow-hidden rounded-md",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pops-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
              itemClassName,
            )}
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes={sizes}
              className={cn(
                "object-cover object-center",
                imageClassName,
                imageClassNameForIndex?.(i),
              )}
            />
          </button>
        ))}
      </div>

      {activePhoto ? (
        <div
          className="fixed inset-0 z-[100] bg-black/85 p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Expanded gallery image"
          onClick={() => setActiveIndex(null)}
        >
          <button
            type="button"
            aria-label="Close image viewer"
            className="absolute right-4 top-4 z-[110] rounded-sm border border-pops-yellow-500/35 bg-black/60 px-3 py-1.5 font-text text-xs font-semibold uppercase tracking-wider text-pops-yellow-400 transition-colors hover:text-pops-yellow-300"
            onClick={() => setActiveIndex(null)}
          >
            Close
          </button>
          <button
            type="button"
            aria-label="Previous image"
            className="absolute left-3 top-1/2 z-[110] -translate-y-1/2 rounded-full border border-white/20 bg-black/55 p-2 text-white transition-colors hover:border-pops-yellow-400 hover:text-pops-yellow-300 sm:left-6 sm:p-3"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
          >
            <span aria-hidden="true" className="block text-xl leading-none">
              &#8249;
            </span>
          </button>
          <button
            type="button"
            aria-label="Next image"
            className="absolute right-3 top-1/2 z-[110] -translate-y-1/2 rounded-full border border-white/20 bg-black/55 p-2 text-white transition-colors hover:border-pops-yellow-400 hover:text-pops-yellow-300 sm:right-6 sm:p-3"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
          >
            <span aria-hidden="true" className="block text-xl leading-none">
              &#8250;
            </span>
          </button>
          <div className="flex h-full w-full items-center justify-center">
            <div
              className="relative h-[88vh] w-[92vw] max-w-6xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={activePhoto.src}
                alt={activePhoto.alt}
                fill
                sizes="100vw"
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
