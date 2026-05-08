import Image from "next/image";

import { Marquee } from "../magicui/marquee";
import { EyebrowLabel } from "./eyebrow";

type Cert = {
  src: string;
  alt: string;
  /** Intrinsic aspect (width / height) — keeps logo proportions inside the rail. */
  width: number;
  height: number;
};

const CERTS: Cert[] = [
  {
    src: "/images/sspc-accredited-contractor.png",
    alt: "SSPC Accredited Contractor — AAMP QP-3",
    width: 200,
    height: 200,
  },
  {
    src: "/images/fdot-logo-color-768x339-1.png",
    alt: "Florida Department of Transportation Approved",
    width: 320,
    height: 141,
  },
  {
    src: "/images/lakeland-fl-certified-industrial-coatings.png",
    alt: "Lakeland, FL Certified Industrial Coatings",
    width: 240,
    height: 200,
  },
];

/**
 * A slow, hover-pausing marquee of trust badges.
 * Each logo is rendered grayscale + low opacity, brightening on hover —
 * trust signal without visual noise.
 */
export function CertificationMarquee() {
  return (
    <section
      aria-labelledby="cert-rail-heading"
      className="pops-section-gold-wash border-t border-pops-yellow-500/20 py-12 sm:py-14"
    >
      <div className="relative z-10">
        <div className="mx-auto mb-6 max-w-[1280px] px-4 text-center sm:px-6 lg:px-8">
          <EyebrowLabel id="cert-rail-heading" tone="dark" shimmer>
            Certifications &amp; Approvals
          </EyebrowLabel>
        </div>

        {/* Edge fade so logos enter/exit gracefully */}
        <div
          className="relative overflow-hidden"
          style={{
            maskImage:
              "linear-gradient(to right, transparent 0%, black 3%, black 97%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0%, black 3%, black 97%, transparent 100%)",
          }}
        >
          <Marquee
            pauseOnHover
            repeat={8}
            className="[--duration:32s] [--gap:4rem] py-2"
          >
            {CERTS.map((cert) => (
              <div
                key={cert.src}
                className="flex h-20 shrink-0 items-center justify-center sm:h-24"
              >
                <Image
                  src={cert.src}
                  alt={cert.alt}
                  width={cert.width}
                  height={cert.height}
                  className="h-full w-auto rounded-sm border border-pops-yellow-500/20 bg-black/80 p-2 object-contain opacity-90 grayscale transition-[opacity,filter,border-color,box-shadow] duration-300 hover:border-pops-yellow-500 hover:opacity-100 hover:grayscale-0 hover:shadow-[0_0_28px_-6px_rgba(254,205,8,0.35)]"
                />
              </div>
            ))}
          </Marquee>
        </div>
      </div>
    </section>
  );
}
