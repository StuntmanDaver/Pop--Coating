import { Footer } from "../../../components/layout/footer";

export default function FooterPreviewPage() {
  return (
    <main id="content" className="min-h-screen bg-ink-800">
      <section className="border-b border-ink-700 px-6 py-16">
        <h1 className="font-display text-2xl text-ink-100">Footer preview</h1>
        <p className="mt-2 max-w-2xl font-text text-sm text-ink-300">
          Internal preview of the global &lt;Footer /&gt; component (US-013). Three
          columns, mobile stacks vertically, addresses use semantic
          &lt;address&gt; elements, GET A QUOTE primary CTA in column 1.
        </p>
      </section>
      <Footer />
    </main>
  );
}
