import { Header } from "../../../components/layout/header";

export default function HeaderPreviewPage() {
  return (
    <>
      <Header />
      <main id="content" className="min-h-screen bg-ink-800">
        <section className="border-b border-ink-700 px-6 py-16">
          <h1 className="font-display text-2xl text-ink-100">Header preview</h1>
          <p className="mt-2 max-w-2xl font-text text-sm text-ink-300">
            Internal preview of the global &lt;Header /&gt; component (US-014).
            Sticky on scroll, skip-to-content link is the first focusable
            element, single HOME link mirrors the live site.
          </p>
        </section>
        <section className="px-6 py-16">
          <p className="font-text text-sm text-ink-300">
            Scroll filler so you can verify the sticky behavior.
          </p>
          <div className="mt-8 space-y-6">
            {Array.from({ length: 30 }).map((_, i) => (
              <p key={i} className="font-text text-sm text-ink-400">
                Filler paragraph {i + 1}.
              </p>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
