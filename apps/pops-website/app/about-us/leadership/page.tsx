import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Container } from "../../../components/layout/container";
import { Footer } from "../../../components/layout/footer";
import { Header } from "../../../components/layout/header";
import { Section } from "../../../components/layout/section";
import { EyebrowLabel } from "../../../components/marketing/eyebrow";
import { Hero } from "../../../components/marketing/hero";
import { Card } from "../../../components/ui/card";

export const metadata: Metadata = {
  title: "Leadership - Pop's Industrial Coatings",
  description:
    "Meet the 3 generations of the Woods family, committed to Pop's legacy of solid coating services & technical knowledge. For us, excellence is a family tradition.",
};

type Leader = {
  slug: string;
  name: string;
  title: string;
  bio: string;
  linkedIn?: string;
  photoAlt: string;
};

const LEADERS: Leader[] = [
  {
    slug: "marcus",
    name: "Mark Woods",
    title: "President 1972 – 2025",
    photoAlt: "Mark Woods, former President of Pops Painting",
    bio: "Mark Woods, Former President of Pops Painting, proudly carried on the legacy of his father, Marcus Woods, as the second-generation leader of the company. With a career spanning over 53 years, Mark helped grow Pops Industrial Coatings from a small family business into a trusted name in the industrial painting and coatings industry. Respected for his strong work ethic and commitment to quality, Mark played a key role in the company's growth and reputation. Now retired, he remains a mentor and guiding influence for the next generation at Pops Industrial Coatings.",
  },
  {
    slug: "jamie",
    name: "Jamie Woods",
    title: "President",
    photoAlt: "Jamie Woods, President of Pop's Industrial Coatings",
    bio: "Jamie Woods, President of Pops Industrial Coatings leads with over 30 years of expertise in the industrial painting and coatings industry. Known for his hands on leadership and deep technical knowledge, Jamie oversees all aspects of company operations, from project execution to long term strategic planning. Under his leadership, Pops has continued to grow its reputation for safety, quality, and reliability across a wide range of industrial sectors. He is committed to delivering high performance coating solutions that protect critical infrastructure and exceed client expectations.",
    linkedIn: "https://www.linkedin.com/in/jamie-woods-95b0782a7/",
  },
  {
    slug: "kaitlyn",
    name: "Kaitlyn Woods",
    title: "Associate Director of Operations and Compliance",
    photoAlt: "Kaitlyn Woods, Associate Director of Operations and Compliance at Pop's Industrial Coatings",
    bio: "Kaitlyn Woods, Associate Director of Operations and Compliance at Pops Industrial Coatings, represents the fourth generation. Having grown up around the business, she brings a deep understanding of its legacy and operations, playing a key role in managing executive support, client relations, and internal coordination to help drive the company's continued growth and reputation for excellence. Kaitlyn is passionate about preserving family tradition while embracing innovation, she is proud to contribute to the future of Pops Industrial Coatings.",
    linkedIn: "https://www.linkedin.com/in/kaitlyn-woods-9214391a1/",
  },
  {
    slug: "chris",
    name: "Chris Woods Jr",
    title: "Fourth Generation",
    photoAlt: "Chris Woods Jr, fourth generation of Pop's Industrial Coatings",
    bio: "Chris Woods Jr. represents the fourth generation of the Woods family at Pops Industrial Coatings, carrying forward a proud legacy of craftsmanship and dedication. With a strong respect for the company's roots and a fresh perspective, Chris is committed to learning the business from the ground up and helping shape its future. He brings energy, drive, and a deep commitment to maintaining Pops' reputation for quality, safety, and service.",
  },
];

export default function LeadershipPage() {
  return (
    <>
      <Header />
      <main id="content">
        <Hero
          eyebrow="MEET THE FAMILY"
          heading="Leadership"
          lede="Four generations of the Woods family — committed to Pop's legacy of solid coating services and technical knowledge. For us, excellence is a family tradition."
          primaryCta={{ label: "Request a Quote", href: "/request-a-quote" }}
          backgroundImage="/images/pops-4-generations.jpg"
          backgroundAlt="Four generations of the Pop's Industrial Coatings family"
        />

        <Section tone="dark">
          <Container>
            <EyebrowLabel className="mb-4">THE WOODS FAMILY</EyebrowLabel>
            <h2 className="mb-10 font-display text-[28px] leading-[1.2] text-ink-100">
              Four generations of leadership
            </h2>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              {LEADERS.map((leader) => (
                <Card key={leader.slug} className="overflow-hidden p-0">
                  <div className="relative aspect-[4/3] overflow-hidden bg-ink-800">
                    <Image
                      src={`/images/${leader.slug}-woods-320x480-1.jpg`}
                      alt={leader.photoAlt}
                      fill
                      sizes="(min-width: 640px) 50vw, 100vw"
                      className="object-contain object-top"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="font-display text-xl font-bold leading-tight text-ink-100">
                      {leader.name}
                    </h3>
                    <p className="mt-1 font-text text-sm font-semibold text-pops-yellow-500">
                      {leader.title}
                    </p>
                    <p className="mt-4 font-text text-sm leading-relaxed text-ink-300">
                      {leader.bio}
                    </p>
                    {leader.linkedIn ? (
                      <Link
                        href={leader.linkedIn}
                        target="_blank"
                        rel="noopener"
                        className="mt-4 inline-flex items-center gap-2 font-text text-sm font-semibold text-pops-yellow-500 hover:text-pops-yellow-300 transition-colors"
                      >
                        <span aria-hidden="true">→</span>
                        <span>LinkedIn</span>
                      </Link>
                    ) : null}
                  </div>
                </Card>
              ))}
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
