import Link from "next/link";

import { Button } from "../../../components/ui/button";

export const metadata = {
  title: "Button preview (dev)",
};

export default function ButtonPreviewPage() {
  return (
    <main className="mx-auto max-w-[1024px] px-6 py-16 space-y-12">
      <header className="space-y-2">
        <h1 className="font-display text-3xl text-pops-yellow-500">
          Button — variants &amp; states
        </h1>
        <p className="text-ink-300 text-sm">
          Internal preview for US-008. Tab through to see focus ring.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="font-text text-lg font-semibold">Variants — default size (44px)</h2>
        <div className="flex flex-wrap items-center gap-4 rounded-sm bg-ink-700 p-6">
          <Button variant="primary">Request a Quote</Button>
          <Button variant="secondary">Learn more</Button>
          <Button variant="ghost">View details</Button>
          <Button variant="destructive">Cancel job</Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-text text-lg font-semibold">Compact size (36px)</h2>
        <div className="flex flex-wrap items-center gap-4 rounded-sm bg-ink-700 p-6">
          <Button variant="primary" size="compact">
            Save
          </Button>
          <Button variant="secondary" size="compact">
            Reset
          </Button>
          <Button variant="ghost" size="compact">
            Skip
          </Button>
          <Button variant="destructive" size="compact">
            Delete
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-text text-lg font-semibold">Disabled</h2>
        <div className="flex flex-wrap items-center gap-4 rounded-sm bg-ink-700 p-6">
          <Button variant="primary" disabled>
            Disabled primary
          </Button>
          <Button variant="secondary" disabled>
            Disabled secondary
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-text text-lg font-semibold">Loading</h2>
        <div className="flex flex-wrap items-center gap-4 rounded-sm bg-ink-700 p-6">
          <Button variant="primary" isLoading>
            Submitting request
          </Button>
          <Button variant="secondary" isLoading>
            Loading
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-text text-lg font-semibold">asChild — wrapping a Link</h2>
        <div className="flex flex-wrap items-center gap-4 rounded-sm bg-ink-700 p-6">
          <Button asChild variant="primary">
            <Link href="/">Go home</Link>
          </Button>
          <Button asChild variant="secondary">
            <a href="https://popsindustrial.com" target="_blank" rel="noopener">
              External
            </a>
          </Button>
        </div>
      </section>
    </main>
  );
}
