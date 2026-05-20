import { Container } from "../../../components/layout/container";
import { Footer } from "../../../components/layout/footer";
import { Header } from "../../../components/layout/header";
import { SharePreviewCard } from "../../../components/marketing/share-preview-card";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Share preview card",
  robots: { index: false, follow: false },
};

export default function SharePreviewDevPage() {
  return (
    <>
      <Header />
      <main id="content" className="min-w-0 overflow-x-clip">
        <section className="relative py-16 sm:py-24">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(254,205,8,0.12),transparent_55%)]"
          />
          <Container className="relative z-10">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <h1 className="font-display text-2xl text-white sm:text-3xl">Link preview reference</h1>
              <p className="mt-3 font-text text-sm leading-relaxed text-ink-300">
                Below is the interactive browser card. iMessage, Slack, and social apps render the
                generated{" "}
                <code className="rounded-sm bg-white/5 px-1.5 py-0.5 font-mono text-xs text-pops-yellow-500">
                  /opengraph-image
                </code>{" "}
                PNG for actual shares.
              </p>
            </div>
            <SharePreviewCard />
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
