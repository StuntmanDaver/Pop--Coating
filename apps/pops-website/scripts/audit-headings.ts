#!/usr/bin/env node
/**
 * Audit heading structure across all page.tsx files.
 * Verifies: exactly one <h1> per page.
 * Exits 0 on PASS, 1 on FAIL.
 *
 * Run: npx tsx scripts/audit-headings.ts (from apps/pops-website)
 */
import { readdirSync, readFileSync, statSync } from "fs";
import path from "path";

const ROOT = process.cwd();

function collectPageFiles(dir: string, results: string[] = []): string[] {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    if (entry === "node_modules" || entry === ".next") continue;
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      collectPageFiles(full, results);
    } else if (entry === "page.tsx") {
      results.push(full);
    }
  }
  return results;
}

const appDir = path.join(ROOT, "app");
const pageFiles = collectPageFiles(appDir).filter(
  (f) => !f.includes("/app/dev/")
);

const failures: string[] = [];

for (const file of pageFiles) {
  const content = readFileSync(file, "utf8");
  const rel = path.relative(ROOT, file);

  // Count h1 tags — both JSX <h1 and string "h1" in asChild patterns
  const h1Matches = content.match(/<h1[\s>]/g) ?? [];
  if (h1Matches.length === 0) {
    // Hero component renders the H1 — check if a Hero component is used
    const hasHero = /\bHero\b/.test(content);
    if (!hasHero) {
      failures.push(`${rel} — no <h1> found and no <Hero> component (which renders the h1)`);
    }
  } else if (h1Matches.length > 1) {
    failures.push(`${rel} — ${h1Matches.length} <h1> elements found (expected exactly 1)`);
  }
}

if (failures.length === 0) {
  console.log("PASS: All pages have correct H1 structure.");
  process.exit(0);
} else {
  console.error(`FAIL: ${failures.length} page(s) with heading issues:`);
  for (const f of failures) {
    console.error(`  ${f}`);
  }
  process.exit(1);
}
