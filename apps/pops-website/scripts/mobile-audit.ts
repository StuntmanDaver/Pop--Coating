#!/usr/bin/env node
/**
 * Mobile responsive audit at 375x844 viewport (iPhone 14 Pro).
 * Checks: no horizontal overflow, touch targets ≥44px, body text ≥14px.
 *
 * Usage: npx tsx scripts/mobile-audit.ts [--base-url http://localhost:3002]
 * Exits 0 on PASS, 1 on FAIL.
 */
import { chromium } from "playwright";

const BASE_URL =
  process.argv.find((a) => a.startsWith("--base-url="))?.split("=")[1] ??
  process.env.MOBILE_BASE_URL ??
  "http://localhost:3002";

const PAGES: { route: string; slug: string }[] = [
  { route: "/", slug: "home" },
  { route: "/about-us", slug: "about-us" },
  { route: "/about-us/history", slug: "about-us-history" },
  { route: "/about-us/leadership", slug: "about-us-leadership" },
  { route: "/industrial-coatings-services", slug: "industrial-coatings-services" },
  { route: "/industrial-coatings-services/wet-paint-coatings", slug: "wet-paint-coatings" },
  { route: "/industrial-coatings-services/powder-coating", slug: "powder-coating" },
  { route: "/industrial-coatings-services/abrasive-media-blasting", slug: "abrasive-media-blasting" },
  { route: "/industrial-coatings-services/complex-coating", slug: "complex-coating" },
  { route: "/industrial-coatings-services/large-capacity-powder-coating", slug: "large-capacity-powder-coating" },
  { route: "/request-a-quote", slug: "request-a-quote" },
  { route: "/request-a-quote/facilities-equipment", slug: "facilities-equipment" },
  { route: "/request-a-quote/standards-specifications-certifications", slug: "standards-specifications-certifications" },
  { route: "/request-a-quote/terms-conditions", slug: "terms-conditions" },
  { route: "/contact", slug: "contact" },
  { route: "/check-in", slug: "check-in" },
  { route: "/check-out", slug: "check-out" },
  { route: "/guest-safety-rules", slug: "guest-safety-rules" },
];

type Failure = { page: string; issue: string };

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 375, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();

  const failures: Failure[] = [];

  for (const { route } of PAGES) {
    const url = `${BASE_URL}${route}`;
    await page.goto(url, { waitUntil: "domcontentloaded" });

    // 1. Check horizontal overflow
    const hasOverflow = await page.evaluate(() => {
      return document.body.scrollWidth > document.body.clientWidth;
    });
    if (hasOverflow) {
      failures.push({ page: route, issue: "horizontal overflow detected" });
    }

    // 2. Check body text font-size ≥14px
    const fontSize = await page.evaluate(() => {
      const el = document.body;
      return parseFloat(window.getComputedStyle(el).fontSize);
    });
    if (fontSize < 14) {
      failures.push({
        page: route,
        issue: `body font-size too small: ${fontSize}px (min 14px)`,
      });
    }

    // 3. Check interactive element touch target sizes ≥44px in at least one dimension
    const smallTargets = await page.evaluate(() => {
      const selectors = "button, a, input, select, textarea";
      const elements = Array.from(document.querySelectorAll(selectors));
      const issues: string[] = [];
      for (const el of elements) {
        const htmlEl = el as HTMLElement;
        // Skip visually-hidden elements (sr-only, clip, etc.) — intentional keyboard-only targets
        const style = window.getComputedStyle(htmlEl);
        const isClipped = style.clip === "rect(0px, 0px, 0px, 0px)" || style.clipPath === "inset(50%)";
        const isHidden = style.visibility === "hidden" || style.display === "none" || style.opacity === "0";
        const isPointerNone = style.pointerEvents === "none";
        if (isClipped || isHidden || isPointerNone) continue;

        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) continue; // off-screen or collapsed
        if (rect.width < 2 && rect.height < 2) continue; // sr-only 1px clip trick

        if (rect.width < 44 && rect.height < 44) {
          const tag = el.tagName.toLowerCase();
          const text = htmlEl.innerText?.trim().slice(0, 30) ?? "";
          issues.push(`${tag}[${text}] — ${Math.round(rect.width)}x${Math.round(rect.height)}px`);
        }
      }
      return issues.slice(0, 5); // Cap at 5 per page to keep output readable
    });
    for (const t of smallTargets) {
      failures.push({ page: route, issue: `touch target too small: ${t}` });
    }
  }

  await browser.close();

  if (failures.length === 0) {
    console.log(`PASS: All ${PAGES.length} pages pass mobile responsive audit (375px).`);
    process.exit(0);
  } else {
    console.error(`FAIL: ${failures.length} issue(s) across ${PAGES.length} pages:`);
    for (const f of failures) {
      console.error(`  ${f.page} — ${f.issue}`);
    }
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("mobile-audit error:", err);
  process.exit(1);
});
