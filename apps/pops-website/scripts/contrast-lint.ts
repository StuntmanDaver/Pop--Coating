#!/usr/bin/env node
/**
 * Playwright-based WCAG AA contrast lint.
 * Visits all production pages against a running dev/start server and
 * uses @axe-core/playwright to detect color-contrast violations.
 *
 * Usage: npx tsx scripts/contrast-lint.ts [--base-url http://localhost:3001]
 * Exits 0 on PASS, 1 on FAIL.
 */
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";

const BASE_URL =
  process.argv.find((a) => a.startsWith("--base-url="))?.split("=")[1] ??
  process.env.CONTRAST_BASE_URL ??
  "http://localhost:3002";

const PAGES = [
  "/",
  "/about-us",
  "/about-us/history",
  "/about-us/leadership",
  "/industrial-coatings-services",
  "/industrial-coatings-services/wet-paint-coatings",
  "/industrial-coatings-services/powder-coating",
  "/industrial-coatings-services/abrasive-media-blasting",
  "/industrial-coatings-services/complex-coating",
  "/industrial-coatings-services/large-capacity-powder-coating",
  "/request-a-quote",
  "/request-a-quote/facilities-equipment",
  "/request-a-quote/standards-specifications-certifications",
  "/request-a-quote/terms-conditions",
  "/contact",
  "/check-in",
  "/check-out",
  "/guest-safety-rules",
];

type Violation = {
  page: string;
  id: string;
  impact: string;
  description: string;
  nodes: number;
};

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const violations: Violation[] = [];

  for (const route of PAGES) {
    const url = `${BASE_URL}${route}`;
    await page.goto(url, { waitUntil: "domcontentloaded" });

    const results = await new AxeBuilder({ page })
      .withRules(["color-contrast"])
      .analyze();

    for (const v of results.violations) {
      violations.push({
        page: route,
        id: v.id,
        impact: v.impact ?? "unknown",
        description: v.description,
        nodes: v.nodes.length,
      });
    }
  }

  await browser.close();

  if (violations.length === 0) {
    console.log(`PASS: Zero contrast violations across ${PAGES.length} pages.`);
    process.exit(0);
  } else {
    console.error(
      `FAIL: ${violations.length} contrast violation(s) across ${PAGES.length} pages:`
    );
    for (const v of violations) {
      console.error(`  [${v.impact.toUpperCase()}] ${v.page} — ${v.description} (${v.nodes} node(s))`);
    }
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("contrast-lint error:", err);
  process.exit(1);
});
