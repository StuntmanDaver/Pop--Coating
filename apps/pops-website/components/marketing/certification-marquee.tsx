import Image from "next/image";
import Link from "next/link";

import { Marquee } from "../magicui/marquee";
import { EyebrowLabel } from "./eyebrow";

const STANDARDS_CERTS_PATH = "/request-a-quote/standards-specifications-certifications";

type Cert = {
  src: string;
  /** Shown to screen readers — logo is decorative inside the link. */
  label: string;
  /** Intrinsic aspect (width / height) — keeps logo proportions inside the rail. */
  width: number;
  height: number;
  /** In-page anchor on the standards & certifications page. */
  hash: string;
};

const CERTS: Cert[] = [
  {
    src: "/images/sspc-accredited-contractor.png",
    label: "SSPC AAMP QP-3 certification — details and certificate",
    width: 200,
    height: 200,
    hash: "sspc-qp3",
  },
  {
    src: "/images/fdot-logo-color-768x339-1.png",
    label: "FDOT approval — details and inspection report",
    width: 320,
    height: 141,
    hash: "fdot-approval",
  },
  {
    src: "/images/lakeland-fl-certified-industrial-coatings.png",
    label: "Lakeland certified industrial coatings — local credentials",
    width: 240,
    height: 200,
    hash: "lakeland-certified",
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
                <Link
                  href={`${STANDARDS_CERTS_PATH}#${cert.hash}`}
                  aria-label={cert.label}
                  className="block h-full rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pops-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]"
                >
                  <Image
                    src={cert.src}
                    alt=""
                    width={cert.width}
                    height={cert.height}
                    className="h-full w-auto rounded-sm border border-pops-yellow-500/20 bg-black/80 p-2 object-contain opacity-90 grayscale transition-[opacity,filter,border-color,box-shadow] duration-300 hover:border-pops-yellow-500 hover:opacity-100 hover:grayscale-0 hover:shadow-[0_0_28px_-6px_rgba(254,205,8,0.35)]"
                  />
                </Link>
              </div>
            ))}
          </Marquee>
        </div>
      </div>
    </section>
  );
}
