#!/usr/bin/env node
/**
 * Periodic axe-core accessibility audit.
 *
 * Walks every customer-facing route, scrolls each page top-to-bottom to wake
 * IntersectionObserver-driven content (BlurFade), then runs the full WCAG
 * 2.0 / 2.1 / 2.2 A + AA rule set. Exits non-zero if any violation is found
 * so this can run as a ship gate in CI alongside contrast-lint.
 *
 * Usage:
 *   pnpm exec tsx scripts/axe-audit.ts [--base-url http://localhost:3001]
 *
 * Exits 0 on PASS, 1 on FAIL.
 *
 * Comparison to contrast-lint:
 *   - contrast-lint: only the color-contrast rule, against a running server.
 *   - axe-audit:    full WCAG A + AA suite, against a running server.
 *
 * Both scripts assume a `pnpm start` (production build) is running on
 * --base-url so they exercise the same code path Vercel deploys.
 */
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";

const BASE_URL =
  process.argv.find((a) => a.startsWith("--base-url="))?.split("=")[1] ??
  process.env.AXE_AUDIT_BASE_URL ??
  "http://localhost:3001";

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

type ViolationRow = {
  page: string;
  id: string;
  impact: string;
  description: string;
  nodes: number;
  firstSelector: string;
};

/**
 * Scrolls the current page from top to bottom in viewport-half steps so any
 * IntersectionObserver-gated element (the BlurFade-wrapped sections, in our
 * case) reaches its final visible state before axe inspects it.
 *
 * Without this, axe runs while wrappers are still at opacity 0 and skips
 * those nodes — masking real contrast issues underneath.
 *
 * Uses page.mouse.wheel + plain string-eval calls because tsx-compiled arrow
 * functions can include `__name()` instrumentation that breaks once they're
 * serialized into the browser's JS context.
 */
async function wakeAllSections(page: import("playwright").Page) {
  const dims = (await page.evaluate(
    "({ scroll: document.documentElement.scrollHeight, viewport: window.innerHeight })",
  )) as { scroll: number; viewport: number };

  const step = Math.max(200, Math.floor(dims.viewport / 2));
  for (let y = 0; y <= dims.scroll; y += step) {
    await page.evaluate(`window.scrollTo({ top: ${y}, behavior: "instant" })`);
    await page.waitForTimeout(80);
  }
  await page.waitForTimeout(200);
  await page.evaluate(`window.scrollTo({ top: 0, behavior: "instant" })`);
  await page.waitForTimeout(120);
}

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  const violations: ViolationRow[] = [];
  const failedPages: string[] = [];

  for (const route of PAGES) {
    const url = `${BASE_URL}${route}`;
    let pageOk = false;
    try {
      const resp = await page.goto(url, { waitUntil: "domcontentloaded" });
      pageOk = resp !== null && resp.ok();
    } catch (err) {
      console.error(`  ! ${route} navigation error:`, err);
    }
    if (!pageOk) {
      failedPages.push(route);
      continue;
    }

    await wakeAllSections(page);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();

    for (const v of results.violations) {
      violations.push({
        page: route,
        id: v.id,
        impact: v.impact ?? "unknown",
        description: v.description,
        nodes: v.nodes.length,
        firstSelector: String(v.nodes[0]?.target?.[0] ?? "").slice(0, 100),
      });
    }
  }

  await browser.close();

  const totalNodes = violations.reduce((acc, v) => acc + v.nodes, 0);
  console.log(
    `\nScanned ${PAGES.length} routes against ${BASE_URL} ` +
      `(${PAGES.length - failedPages.length} OK, ${failedPages.length} unreachable).`,
  );

  if (failedPages.length > 0) {
    console.warn(`\nUnreachable pages (skipped):`);
    for (const p of failedPages) {
      console.warn(`  - ${p}`);
    }
  }

  if (violations.length === 0 && failedPages.length === 0) {
    console.log(`\nPASS: zero axe violations across all routes.\n`);
    process.exit(0);
  }

  if (violations.length > 0) {
    console.error(
      `\nFAIL: ${violations.length} rule violation(s) covering ${totalNodes} node(s):`,
    );
    for (const v of violations) {
      console.error(
        `  [${v.impact.toUpperCase().padEnd(8)}] ${v.page.padEnd(45)} ` +
          `${v.id} — ${v.nodes} node(s) — ${v.firstSelector}`,
      );
    }
  }

  process.exit(1);
}

run().catch((err) => {
  console.error("axe-audit error:", err);
  process.exit(1);
});
