#!/usr/bin/env node
/**
 * Audit all <Image> and <img> tags in app/ and components/ for missing alt props.
 * Exits 0 on PASS, 1 on FAIL.
 *
 * Run: tsx scripts/audit-alt.ts (from apps/pops-website)
 */
import { readdirSync, readFileSync, statSync } from "fs";
import path from "path";

const ROOT = process.cwd();

function collectTsxFiles(dir: string, results: string[] = []): string[] {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    if (entry === "node_modules" || entry === ".next" || entry === "dev") continue;
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      collectTsxFiles(full, results);
    } else if (entry.endsWith(".tsx")) {
      results.push(full);
    }
  }
  return results;
}

const appDir = path.join(ROOT, "app");
const compDir = path.join(ROOT, "components");
const files = [
  ...collectTsxFiles(appDir),
  ...collectTsxFiles(compDir),
];

// Skip dev pages — they're scaffolding, not production
const productionFiles = files.filter((f) => !f.includes("/app/dev/"));

const failures: string[] = [];

for (const file of productionFiles) {
  const content = readFileSync(file, "utf8");
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    if (!/<Image\b|<img\b/.test(line)) continue;
    if (line.trim().startsWith("//") || line.trim().startsWith("*")) continue;

    // Look ahead up to 5 lines for an alt= attribute
    const chunk = lines.slice(i, i + 6).join(" ");
    if (!/\balt=/.test(chunk)) {
      const rel = path.relative(ROOT, file);
      failures.push(`${rel}:${i + 1} — missing alt prop`);
    }
  }
}

if (failures.length === 0) {
  console.log("PASS: All images have alt props.");
  process.exit(0);
} else {
  console.error(`FAIL: ${failures.length} image(s) missing alt prop:`);
  for (const f of failures) {
    console.error(`  ${f}`);
  }
  process.exit(1);
}
