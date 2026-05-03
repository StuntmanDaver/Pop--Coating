# PRD — Pops Website (popsindustrial.com) Rebuild

> **Version:** 1.0
> **Date:** 2026-05-02
> **Owner:** Cultr Ventures (builder) → Pop's Industrial Coatings (Tenant 1)
> **Branch:** `ralph/pops-website`
> **Ralph harness:** `scripts/ralph-pops-website/`
> **Status:** Approved for Ralph autonomous execution

---

## 1. Why this exists

The current popsindustrial.com is a WordPress + Elementor site that the design audit at [`docs/design/popsindustrial-design-principles.md`](../design/popsindustrial-design-principles.md) found to have:

- **Mono-font** (Open Sans for everything — no display/text contrast)
- **No type scale** (`H2 {font-size: 25px; line-height: 25px}` — zero leading)
- **Bootstrap-3 leftover colors** leaking through (`#d9534f`, `#5cb85c`, `#5bc0de`, `#f0ad4e`)
- **Single button style** (no hierarchy between "Request a Quote" and "More")
- **Hero is content-light** (just a 3-slide tagline rotator, no value prop, no CTA above the fold)
- **17 of 18 pages have ZERO image alt text** — site-wide accessibility gap
- **Address ZIP code conflict**: footer says shipping = 33813, contact page main content says 33811. Confirm with client.

This rebuild ships a Next.js 16 + Tailwind v4 + shadcn replacement that **preserves the brand DNA** (industrial dark, yellow `#FECD08` accent, family heritage, real shop photography, uppercase confidence) while fixing the readability and craft problems.

The site lives at the same domain (`popsindustrial.com`) once shipped; the existing WordPress instance becomes a backup until cutover.

## 2. Where this lives in the repo

This is a **separate Next.js app** alongside the existing multi-tenant SaaS shell at `src/`. Final layout:

```
Pops--Coating/
├── apps/
│   └── pops-website/               ← NEW: this PRD ships here
│       ├── app/
│       ├── components/
│       ├── content/
│       ├── public/
│       ├── package.json
│       ├── tsconfig.json
│       ├── next.config.ts
│       ├── tailwind config (CSS-first in app/globals.css)
│       └── vercel.ts
├── src/                            ← UNCHANGED: SaaS multi-tenant shell
├── supabase/
├── scripts/
│   ├── ralph/                      ← UNCHANGED: existing foundation work
│   └── ralph-pops-website/            ← NEW: this rebuild's autonomous loop
│       ├── prd.json
│       ├── progress.txt
│       ├── CLAUDE.md
│       └── ralph.sh
└── pnpm-workspace.yaml             ← UPDATED: add `apps/*`
```

**Why a separate app, not a module under `src/modules/`:** The marketing site has different concerns (pure SSG, no Supabase, no auth, no RLS) and a different deploy lifecycle (cut over to popsindustrial.com vs. the SaaS at `app.popsindustrial.com` / `track.popsindustrial.com`). Splitting them lets the marketing site deploy on its own, without dragging the SaaS dependency tree, and lets either be replaced independently.

## 3. Source materials Ralph reads

Every story in this PRD points back to one or more of these inputs. Ralph must consult them; **don't invent content or design values**.

| Source | What it provides | Path |
|---|---|---|
| **Design principles** | Color tokens, type scale, spacing, components, accessibility floor | [`docs/design/popsindustrial-design-principles.md`](../design/popsindustrial-design-principles.md) |
| **Per-page clean markdown** | Content body for each of 18 pages | `.firecrawl/popsindustrial/pages/<slug>.md` |
| **Per-page raw HTML** | Original markup for any layout/structure references | `.firecrawl/popsindustrial/pages/<slug>.html` |
| **Desktop reference screenshots** | Visual baseline 1440w | `.firecrawl/popsindustrial/screenshots/desktop/<slug>.png` |
| **Mobile reference screenshots** | Visual baseline 375w | `.firecrawl/popsindustrial/screenshots/mobile/<slug>.png` |
| **Site-wide globals** | Footer text, nav columns, slider, JSON-LD, meta tags, alt-text audit | `.firecrawl/popsindustrial/_raw/site-globals.json` |
| **Manifest** | Per-page artifact map + `company_facts` (addresses, phones, emails, hours) | `.firecrawl/popsindustrial/manifest.json` |
| **Asset bundle** | 194 images + 4 PDFs ready to copy into `apps/pops-website/public/` | `.firecrawl/popsindustrial/assets/` |
| **Project guardrails** | Stack rules, package manager, commit conventions | [`CLAUDE.md`](../../CLAUDE.md) |

## 4. Stack (locked, no deviations)

These match [`CLAUDE.md`](../../CLAUDE.md) — same as the SaaS app — except where the marketing site doesn't need a feature.

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16 App Router | Same as SaaS |
| Language | TypeScript strict | `"strict": true`, no `any` |
| Styling | Tailwind v4 (CSS-first in `globals.css`) | All design tokens from principles §10 |
| Fonts | `next/font/google` Archivo Black + Inter | Self-hosted via next/font |
| Components | shadcn/ui primitives | Installed via CLI into `components/ui/` |
| Forms | React Hook Form + Zod | Same as SaaS |
| Email | Resend | For form submissions |
| Captcha | Google reCAPTCHA v3 | The current site already has it |
| Hosting | Vercel Pro | Per `CLAUDE.md` |
| Package manager | pnpm | Per `CLAUDE.md` |
| Analytics | Vercel Analytics + Vercel Speed Insights | Track Core Web Vitals |
| Monitoring | Sentry | Reuse existing `@sentry/nextjs` config |
| **NOT used** | Supabase, Auth, RLS, i18n | Static marketing site; Spanish (Wave 2+) is for the SaaS |

## 5. Design contract — what Ralph must enforce on every story

These are pulled forward from the design principles so each story can quote them as acceptance criteria. All paths are inside `apps/pops-website/`.

### 5.1 Token sheet (drops into `app/globals.css` `@theme {}` block)

The full block is in [`docs/design/popsindustrial-design-principles.md` §10](../design/popsindustrial-design-principles.md#10-token-sheet--drop-into-tailwind-v4--shadcn). Ralph copies it verbatim in US-002.

### 5.2 Type scale (rendered + verifiable)

| Token | px | Use | Family |
|---|---|---|---|
| `--text-display-lg` | 56 | Page hero (H1) | Archivo Black 900 |
| `--text-h1` | 36 | H1 in content | Archivo Black 900 |
| `--text-h2` | 28 | H2 | Archivo Black 900 |
| `--text-h3` | 22 | H3 | Inter 700 |
| `--text-base` | 16 | Body | Inter 400 |
| `--text-xs` | 12 | Micro-labels (uppercase, tracked +0.04em) | Inter 600 |

### 5.3 Component contract (Ralph builds once, every page reuses)

| Component | File | Used by |
|---|---|---|
| `Button` (primary/secondary/ghost/destructive) | `components/ui/button.tsx` | All pages — primary CTA exactly once per page |
| `Card` | `components/ui/card.tsx` | Service cards, leadership tiles, certification cards |
| `Hero` (eyebrow + display + lede + CTA pair + photo) | `components/marketing/hero.tsx` | Home, every service page |
| `ServiceTile` | `components/marketing/service-tile.tsx` | Home services grid, services index |
| `EyebrowLabel` (uppercase, tracked, micro-size) | `components/marketing/eyebrow.tsx` | Above every section heading |
| `Container` / `Section` | `components/layout/container.tsx`, `section.tsx` | Layout primitives |
| `Header` (HOME link + brand mark) | `components/layout/header.tsx` | All pages |
| `Footer` (3-column nav + addresses + hours + CTA) | `components/layout/footer.tsx` | All pages |
| `FormField`, `FormInput`, `FormTextarea`, `FormCheckbox` | `components/forms/*.tsx` | Quote, Contact, Check-in, Check-out |
| `MapEmbed` | `components/marketing/map-embed.tsx` | Contact page |
| `PdfLink` | `components/marketing/pdf-link.tsx` | Standards/certs page (FDOT QCPIR + SSPC + T&C downloads) |

### 5.4 Accessibility floor (build-failing if violated)

- Every interactive element ≥ 44×44px tap target
- Focus visible always (use `--shadow-focus`, never `outline: none` without replacement)
- Heading order monotonic, exactly one H1 per page
- All non-decorative images have `alt`; decorative use `alt=""`
- Form errors described programmatically (`aria-describedby`)
- WCAG 2.1 AA contrast on every token pair (verified by Playwright lint in US-045)
- `prefers-reduced-motion: reduce` halves all durations + disables auto-rotation

## 6. Page-by-page content map (18 pages)

For every page, the source markdown at `.firecrawl/popsindustrial/pages/<slug>.md` is the canonical content. Ralph rewrites/restructures only where the principles document mandates it (e.g., new hero pattern in §6.2, alt text everywhere, button hierarchy).

| # | Slug | Route | Content source | Notes |
|---|---|---|---|---|
| 1 | `home` | `/` | `pages/home.md` | **Hero replaced** per design §6.2 — value prop + dual CTA + dark-overlay photo. 3-slide rotator stays as supporting visual. |
| 2 | `about-us` | `/about-us` | `pages/about-us.md` | Two facility photos, 4-generations narrative |
| 3 | `about-us-history` | `/about-us/history` | `pages/about-us-history.md` | Marcus Woods bio + founder photo |
| 4 | `about-us-leadership` | `/about-us/leadership` | `pages/about-us-leadership.md` | 4 leadership cards (Mark, Jamie, Kaitlyn, Chris) — full-res photos now on disk |
| 5 | `request-a-quote` | `/request-a-quote` | `pages/request-a-quote.md` | Quote form (Resend + reCAPTCHA) |
| 6 | `request-a-quote/facilities-equipment` | `/request-a-quote/facilities-equipment` | `pages/request-a-quote-facilities-equipment.md` | Aerial photo + facility list |
| 7 | `request-a-quote/standards-specifications-certifications` | `/request-a-quote/standards-specifications-certifications` | `pages/request-a-quote-standards-specifications-certifications.md` | SSPC/FDOT logos + 2 PDF downloads |
| 8 | `request-a-quote/terms-conditions` | `/request-a-quote/terms-conditions` | `pages/request-a-quote-terms-conditions.md` | Legal text (longest page; ~16KB) + PDF download |
| 9 | `industrial-coatings-services` | `/industrial-coatings-services` | `pages/industrial-coatings-services.md` | Services index — 5 ServiceTile grid |
| 10 | `industrial-coatings-services/wet-paint-coatings` | `/industrial-coatings-services/wet-paint-coatings` | `pages/industrial-coatings-services-wet-paint-coatings.md` | Only page with proper alt text on live site |
| 11 | `industrial-coatings-services/complex-coating` | `/industrial-coatings-services/complex-coating` | `pages/industrial-coatings-services-complex-coating.md` | |
| 12 | `industrial-coatings-services/abrasive-media-blasting` | `/industrial-coatings-services/abrasive-media-blasting` | `pages/industrial-coatings-services-abrasive-media-blasting.md` | |
| 13 | `industrial-coatings-services/powder-coating` | `/industrial-coatings-services/powder-coating` | `pages/industrial-coatings-services-powder-coating.md` | |
| 14 | `industrial-coatings-services/large-capacity-powder-coating` | `/industrial-coatings-services/large-capacity-powder-coating` | `pages/industrial-coatings-services-large-capacity-powder-coating.md` | |
| 15 | `contact` | `/contact` | `pages/contact.md` | Form + Google Maps embed (3515 Airport Road) |
| 16 | `check-in` | `/check-in` | `pages/check-in.md` | Visitor check-in form |
| 17 | `check-out` | `/check-out` | `pages/check-out.md` | Visitor check-out form |
| 18 | `guest-safety-rules` | `/guest-safety-rules` | `pages/guest-safety-rules.md` | Static rules text |

## 7. Business facts to surface (from manifest `company_facts`)

These render in the footer, contact page, and JSON-LD. **Single source of truth — don't hardcode anywhere else.**

```ts
// content/company.ts
export const company = {
  name: "Pop's Industrial Coatings",
  founded: 1972,
  generations: 4,
  mainOffice: { street: "3805 Drane Field Road", city: "Lakeland", state: "FL", zip: "33811" },
  shippingReceiving: { street: "3515 Airport Road", city: "Lakeland", state: "FL", zip: "33811" },
  // ⚠ Footer of live site says 33813 — confirm with client. PRD uses 33811 from contact page until confirmed.
  phone: "863.644.7473",
  fax: "863.644.5926",
  emails: { info: "info@popsindustrial.com", invoices: "invoices@popsindustrial.com" },
  hours: "Monday–Friday 8am–4pm. Saturday & Sunday closed.",
  tagline: "Four generations of expertise in industrial coatings",
  taglineSecondary: "Your partners for success",
  services: ["Wet Paint Coatings", "Complex Coating", "Abrasive Media Blasting", "Powder Coating", "Large Capacity Powder Coating"],
} as const;
```

## 8. Forms & integrations

Three forms, all using the same pattern: React Hook Form + Zod → Server Action → Resend transactional email + reCAPTCHA v3 verification.

| Form | Page | Recipient | Confirmation |
|---|---|---|---|
| **Request a Quote** | `/request-a-quote` | `info@popsindustrial.com` | Inline success message + auto-reply to submitter |
| **Contact** | `/contact` | `info@popsindustrial.com` | Inline success message |
| **Check-In** | `/check-in` | `info@popsindustrial.com` | Inline success — staff sees the visitor record |
| **Check-Out** | `/check-out` | `info@popsindustrial.com` | Inline success |

Server actions live in `apps/pops-website/app/actions/`. Each action validates the Zod schema, verifies reCAPTCHA, then calls a single shared `sendFormEmail()` helper.

## 9. SEO & metadata strategy

- **Per-page Metadata**: every `page.tsx` exports a `metadata` object with `title`, `description`, `openGraph.image` set to a page-specific or default OG image (default = `Pops-no-border.png` from JSON-LD).
- **JSON-LD**: home page emits the Organization + WebSite + ImageObject graph from `site-globals.json#json_ld`. Service pages add `Service` schema with `provider` linking back to the Organization.
- **Sitemap**: `app/sitemap.ts` generates an XML sitemap of all 18 pages.
- **Robots**: `app/robots.ts` allows everything except `/api/*`.
- **Alt text**: every `<Image>` gets meaningful alt text. Decorative-only images use `alt=""`. The `alt_text_audit` in `site-globals.json` flags 17 of 18 pages on the live site as zero-alt — this rebuild fixes that.

## 10. Performance budgets (Vercel Analytics enforces, CI gates ship)

| Metric | Budget | Why |
|---|---|---|
| Lighthouse Performance | ≥ 95 mobile, ≥ 98 desktop | This is a static marketing site |
| LCP | < 2.5s | Hero image preload + AVIF |
| CLS | < 0.05 | All images have explicit dimensions; fonts use `display: swap` |
| Total transfer (home) | < 800 KB | Includes hero photo |
| First contentful paint | < 1.5s | |

## 11. Out of scope for this PRD

- Spanish localization — Wave 2+, not in this rebuild
- Customer portal — that lives in the SaaS shell at `track.popsindustrial.com`
- Office staff dashboard — SaaS shell
- Tenant 2+ branding overrides (the marketing site stays Pops-only; multi-tenant lives in the SaaS)
- A/B testing harness
- Headless CMS (content is committed markdown — change requires a deploy, which is fine for an 18-page site)

## 12. Open questions (Ralph flags these in `progress.txt`, doesn't guess)

1. **Shipping ZIP discrepancy** — footer 33813 vs contact 33811. PRD locks 33811; flag for client confirmation.
2. **Photoshoot refresh** — design principles §12 raises this. Scope decision before shipping; not blocking.
3. **Logo lockup** — we have multiple logo files (`logo.png`, `Pops-no-border.png`, `pops-circle-logo-000-241x241-1.png`, etc.). PRD picks `Pops-no-border.png` as the canonical wordmark; flag for client lockup-doc confirmation.
4. **Resend API key + Resend sender domain** — Vercel env var must be set before forms work. Document in deploy story.
5. **Google reCAPTCHA v3 site key** — same.

## 13. Story map (49 stories across 6 phases)

Full story breakdown is in `scripts/ralph-pops-website/prd.json`. High-level phases:

| Phase | Stories | Goal |
|---|---|---|
| **A. Workspace + foundation** | US-001 → US-005 | `apps/pops-website/` boots; tokens + fonts + assets in place |
| **B. Design primitives** | US-006 → US-016 | Every shared component lives in `components/`; storybook-grade |
| **C. Page implementations** | US-017 → US-034 | All 18 pages render with content + screenshots match |
| **D. Forms + integrations** | US-035 → US-039 | Quote, Contact, Check-in, Check-out wired to Resend + reCAPTCHA |
| **E. SEO + accessibility** | US-040 → US-044 | Metadata, JSON-LD, sitemap, alt-text everywhere |
| **F. Quality + ship** | US-045 → US-049 | Contrast lint, Lighthouse, mobile audit, Vercel deploy |

Each story is sized to fit one Ralph iteration (one context window). Schema and content stories are first; UI stories come later (and require browser verification).

## 14. Definition of done (the whole rebuild)

- [ ] All 49 stories in `scripts/ralph-pops-website/prd.json` show `passes: true`
- [ ] `pnpm --filter marketing build` succeeds
- [ ] `pnpm --filter marketing lint` clean
- [ ] `pnpm --filter marketing test` clean (if tests exist)
- [ ] Playwright contrast lint (US-045) passes — zero AA failures
- [ ] All 18 pages have desktop + mobile screenshots that pass parity check vs `.firecrawl/popsindustrial/screenshots/`
- [ ] Lighthouse mobile ≥ 95, desktop ≥ 98 on `/` and one service page
- [ ] Sentry initialized, no console errors on any page
- [ ] Vercel preview deploy succeeds
- [ ] Owner review on staging deploy: open questions §12 resolved
- [ ] Production deploy gated on owner sign-off

## 15. Running Ralph

```bash
cd scripts/ralph-pops-website
./ralph.sh --tool claude 50    # 50 iterations max (49 stories + buffer)
```

Ralph picks the lowest-priority story with `passes: false`, implements it on a fresh `ralph/pops-website` branch, runs typecheck + lint + (when applicable) browser verification, commits, and marks the story `passes: true`. When all stories pass it emits `<promise>COMPLETE</promise>`.

If Ralph gets stuck (a story fails 3+ iterations), pause the loop, read `progress.txt`, and split or unblock the offending story manually before resuming.
