import { Header } from "../../../components/layout/header";
import { Hero } from "../../../components/marketing/hero";

export const metadata = {
  title: "Hero preview (dev)",
};

export default function HeroPreviewPage() {
  return (
    <>
      <Header />
      <main id="content">
        <Hero
          eyebrow="Family Owned · Lakeland, FL · Since 1972"
          heading="Four generations of industrial finishing — done right the first time."
          lede="Powder coating, abrasive blasting, and wet paint for aerospace, defense, and heavy equipment."
          primaryCta={{ label: "Request a Quote", href: "/request-a-quote" }}
          secondaryCta={{ label: "See our work", href: "/industrial-coatings-services" }}
          backgroundImage="/images/bg-main.jpg"
          backgroundAlt=""
        />
        <section className="bg-ink-800 px-6 py-16">
          <div className="mx-auto max-w-[1280px] space-y-4">
            <h2 className="font-display text-2xl text-pops-yellow-500">
              Hero — US-015 preview
            </h2>
            <p className="max-w-2xl font-text text-sm text-ink-300">
              Tab order should be: skip-link → HOME → primary CTA → secondary
              CTA. Heading scales from 36px (mobile) to 56px (≥ md). Background
              uses next/image fill + ink-900/60 overlay.
            </p>
          </div>
        </section>

        <section className="bg-ink-700 px-6 py-16">
          <div className="mx-auto max-w-[1280px] space-y-4">
            <h2 className="font-display text-xl text-ink-100">
              Variant — heading-only (no lede, no secondary CTA)
            </h2>
          </div>
        </section>

        <Hero
          eyebrow="Service · Powder Coating"
          heading="Large-capacity powder coating built for production runs."
          primaryCta={{ label: "Request a Quote", href: "/request-a-quote" }}
          backgroundImage="/images/bg-main.jpg"
          backgroundAlt=""
        />
      </main>
    </>
  );
}
