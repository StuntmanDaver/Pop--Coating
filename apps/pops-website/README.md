# Pop's Industrial Coatings — Website

The marketing website for **Pop's Industrial Coatings** (`popsindustrial.com`), rebuilt as a Next.js 16 App Router application inside the Pops--Coating monorepo.

---

## Overview

- **Framework:** Next.js 16 (App Router, Server Actions)
- **Styling:** Tailwind v4 (CSS-first), shadcn/ui primitives
- **Fonts:** Archivo Black (display) + Inter (text) via `next/font/google`
- **Forms:** React Hook Form + Zod, Resend for email, Google reCAPTCHA v3
- **Deployment:** Vercel Pro at `popsindustrial.com`

---

## Quickstart

```bash
# From monorepo root
pnpm install

# Start the dev server (opens http://localhost:3001)
pnpm --filter pops-website dev
```

The app listens on port **3001** by default.

---

## Project Structure

```
apps/pops-website/
├── app/                     # Next.js App Router pages
│   ├── layout.tsx           # Root layout (fonts, metadata, globals.css)
│   ├── page.tsx             # Homepage
│   ├── about-us/
│   ├── check-in/            # Visitor check-in form + Server Action
│   ├── check-out/           # Visitor check-out form + Server Action
│   ├── contact/             # Contact form + Server Action
│   ├── guest-safety-rules/  # Static safety rules page
│   ├── industrial-coatings-services/
│   │   ├── page.tsx         # Services hub
│   │   ├── wet-paint-coatings/
│   │   ├── powder-coating/
│   │   ├── abrasive-media-blasting/
│   │   ├── complex-coating/
│   │   └── large-capacity-powder-coating/
│   ├── request-a-quote/     # Quote form + Server Action
│   │   ├── facilities-equipment/
│   │   ├── standards-specifications-certifications/
│   │   └── terms-conditions/
│   ├── sitemap.ts           # /sitemap.xml (Next.js built-in)
│   └── robots.ts            # /robots.txt (Next.js built-in)
├── components/
│   ├── forms/               # FormField, Input, Textarea, Checkbox
│   ├── layout/              # Container, Header, Footer, Section
│   ├── marketing/           # Hero, EyebrowLabel, ServiceTile
│   ├── seo/                 # JsonLd
│   └── ui/                  # Button
├── lib/
│   ├── email.ts             # sendFormEmail + buildEmailHtml (Resend)
│   ├── jsonld.ts            # getOrgJsonLd, getServiceJsonLd
│   ├── recaptcha.ts         # verifyRecaptcha (server-side)
│   └── utils.ts             # cn()
├── scripts/
│   ├── audit-alt.ts         # Image alt-text audit (npx tsx)
│   ├── audit-headings.ts    # Heading-order audit (npx tsx)
│   ├── contrast-lint.ts     # WCAG AA contrast check (Playwright)
│   └── mobile-audit.ts      # 375px mobile responsive check (Playwright)
├── .env.example             # Required environment variables
├── .lighthouserc.json       # Lighthouse CI budget config
└── vercel.json              # Vercel deploy config
```

---

## Design System Reference

All visual decisions (color tokens, type scale, spacing, component contracts) are defined in:

```
docs/design/popsindustrial-design-principles.md
```

The Tailwind v4 tokens live in `app/globals.css`. Do not hardcode color values — always reference token names (`text-ink-100`, `bg-pops-yellow-500`, etc.).

---

## Content Sources

Page content was captured via Firecrawl and stored at:

```
.firecrawl/popsindustrial/
├── pages/          # Per-page clean markdown (frontmatter: url, title, description)
├── pages/*.html    # Raw HTML for markup disambiguation
├── screenshots/    # Desktop + mobile reference screenshots
├── assets/         # Images and PDFs (already copied to public/)
│   ├── images/
│   └── pdfs/
├── _raw/
│   └── site-globals.json  # Footer nav, JSON-LD, alt-text audit
└── manifest.json   # Per-page artifact map + business facts
```

To refresh content from the live site, re-run the Firecrawl scrape and re-copy assets to `public/`.

---

## Forms

All three public forms (Contact, Request a Quote, Check-In, Check-Out) send email via **Resend** and are protected by **Google reCAPTCHA v3**.

### Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

| Variable | Description |
|---|---|
| `RESEND_API_KEY` | Resend API key (provision at resend.com) |
| `RESEND_FROM` | Sender address (e.g. `noreply@popsindustrial.com`) — must be a verified Resend domain |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | reCAPTCHA v3 site key (browser-side) |
| `RECAPTCHA_SECRET_KEY` | reCAPTCHA v3 secret key (server-side verification) |
| `SENTRY_DSN` | Sentry DSN for server-side error tracking |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN for client-side error tracking |

### Dev Without Keys

- **Resend:** Forms will error gracefully if `RESEND_API_KEY` is missing (Server Action returns `serverError`).
- **reCAPTCHA:** If `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` is unset, the script doesn't load and forms submit with an empty token. Server-side `verifyRecaptcha()` passes through in `NODE_ENV=development` when `RECAPTCHA_SECRET_KEY` is unset.

---

## Deploy (Vercel)

1. In the Vercel dashboard, create a new project and set the **Root Directory** to `apps/pops-website`.
2. Vercel will detect Next.js automatically. The `vercel.json` sets `buildCommand` and `installCommand` for the monorepo pnpm workspace.
3. Add environment variables from `.env.example` in the Vercel project settings.
4. Add the custom domain `popsindustrial.com`. Set up a CNAME/A record per Vercel's instructions.
5. Redirect `www.popsindustrial.com` → `popsindustrial.com` (301) via the Vercel Domains UI.

---

## Audit Scripts

These scripts run against the dev server (port 3002 by default). Start it with `pnpm --filter pops-website dev` first.

```bash
# Check every <Image> has an alt prop
pnpm --filter pops-website audit:alt

# Check every production page has exactly one H1
pnpm --filter pops-website audit:headings

# WCAG AA color contrast check via axe-core (requires running server)
pnpm --filter pops-website contrast-lint

# 375px mobile responsive audit (requires running server)
pnpm --filter pops-website mobile-audit
```

---

## Troubleshooting

**Fonts not loading / Flash of unstyled text**
Next.js caches font downloads in `.next/cache`. Delete `.next` and restart the dev server.

**Resend 401 / forms returning server error**
`RESEND_API_KEY` is missing or invalid. Check `.env.local`. The sender domain must also be verified in Resend.

**reCAPTCHA always failing in production**
`NEXT_PUBLIC_RECAPTCHA_SITE_KEY` and `RECAPTCHA_SECRET_KEY` must be from the same reCAPTCHA site. A mismatch (e.g. different domains or v2 key used with v3) causes all verifications to fail. Re-provision both keys from the same site in the Google reCAPTCHA admin.

**TypeScript errors after pulling**
Run `pnpm install` from the monorepo root to sync workspace packages.
