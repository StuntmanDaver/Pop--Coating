import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";

export const metadata = {
  title: "Card preview (dev)",
};

export default function CardPreviewPage() {
  return (
    <main className="mx-auto max-w-[1024px] px-6 py-16 space-y-12">
      <header className="space-y-2">
        <h1 className="font-display text-3xl text-pops-yellow-500">
          Card — variants &amp; states
        </h1>
        <p className="text-ink-300 text-sm">
          Internal preview for US-009. Hover the interactive card to see the
          shadow-3 lift. Tab to confirm focus rings on inner elements.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="font-text text-lg font-semibold">Default — dark tone</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Powder Coating</CardTitle>
              <CardDescription>
                Industrial-grade, durable finishes for steel and aluminum
                fabrications up to 25 ft long.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Largest powder oven in Central Florida, with line capacity for
                aerospace and heavy-equipment volume.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="primary" size="compact">
                Learn more
              </Button>
              <Button variant="ghost" size="compact">
                Talk to us
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Abrasive Media Blasting</CardTitle>
              <CardDescription>
                Surface preparation done in-house — same crew, same shift.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                SSPC-SP standards, garnet and aluminum oxide media available.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-text text-lg font-semibold">
          Interactive — hover lifts via shadow-3
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/" className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pops-yellow-300 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-800">
            <Card interactive>
              <CardHeader>
                <CardTitle>Wet Paint Coatings</CardTitle>
                <CardDescription>
                  Wrap me in a Link and the whole card becomes a target.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-pops-yellow-500">→ Learn more</p>
              </CardContent>
            </Card>
          </Link>

          <Card interactive role="link" tabIndex={0}>
            <CardHeader>
              <CardTitle>Complex Coating</CardTitle>
              <CardDescription>
                Cards can also use role=&quot;link&quot; for the interactive
                affordance without wrapping.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-pops-yellow-500">→ Learn more</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-text text-lg font-semibold">Light tone</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 rounded-sm bg-paper p-6">
          <Card tone="light">
            <CardHeader>
              <CardTitle>Family-owned since 1972</CardTitle>
              <CardDescription>
                Used in the leadership grid where the page surface is paper.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Body copy on light cards inherits ink-800 with the standard
                opacity-80 description treatment.
              </p>
            </CardContent>
          </Card>

          <Card tone="light" interactive>
            <CardHeader>
              <CardTitle>Interactive light</CardTitle>
              <CardDescription>Shadow lift still works on paper.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>
    </main>
  );
}
