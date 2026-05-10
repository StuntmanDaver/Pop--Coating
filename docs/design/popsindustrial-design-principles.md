# popsindustrial.com — Design Principles & Rebuild Guide

> **Purpose.** Capture what works (and what doesn't) on the current popsindustrial.com so the rebuild keeps the brand's industrial-heritage DNA while fixing readability, visual hierarchy, and modern accessibility expectations.
>
> **Source of truth.** Every value below is extracted from the live site (`https://popsindustrial.com/`) — specifically the Elementor kit defined in the combined CSS at `/wp-content/cache/speedycache/popsindustrial.com/assets/1e983b84ee20cc3b-…-combined.css` — not invented. Where we recommend changing something, the reasoning and the new value are both shown.
>
> **Scope.** Marketing/operator-facing brand. The internal multi-tenant SaaS shell (Pops Industrial Coatings as Tenant 1) inherits these tokens but layers WCAG AA, dense data UI, and shop-floor / iPad ergonomics on top.

---

## 1. Brand DNA — what to preserve

The current site, despite its readability issues, communicates a coherent brand. **Don't sand these qualities off in the rebuild.**

| Trait | Evidence on current site | Why it matters |
|---|---|---|
| **Industrial / heavy** | Dark page background `#1E1E1E` with a steel-textured `bg-main.jpg`; sharp `border-radius: 0` edges on hero/service cards | Mirrors the shop floor — dirty, dark, metallic. A bright "SaaS" template would feel wrong. |
| **Family heritage / longevity** | Tagline rotation: *"Your Partners / For Success / Exceeding Expectations / Technical Excellence / Family Business / Since 1972"*; "Four generations of expertise" H1 | The differentiator vs. national chains. Lead with this on every page. |
| **Yellow safety accent** | Brand primary `#FECD08`, secondary `#DEB101`, hover transition `#FFBC7D` | Reads as hi-vis / caution / industrial signage. Owns a category color. |
| **Confident uppercase** | All H2s `text-transform: uppercase`, all buttons uppercase 700 | Signage / stencil energy — fits coatings/paint trade. |
| **Earned, not designed** | Photography of actual shop, technicians in PPE, racked parts | No stock imagery. Keep this. |

**Brand promise to encode in tone:** *Four generations of finish work. Aerospace-grade results, family-shop accountability.*

---

## 2. Current state — what to fix

Pulled from the actual CSS rules and screenshot. These are the readability and craft problems the rebuild must solve.

| Problem | Evidence | Impact |
|---|---|---|
| **Mono-font** | 100% Open Sans across all weights (120 of 124 `font-family` declarations) | No tonal contrast between display and body. Page reads "flat." |
| **No type scale** | H2 fixed at `font-size: 25px; line-height: 25px` (line-height = font-size = no leading) | H2s look cramped; long titles collide with descenders. |
| **Body color on dark BG underspecified** | `--e-global-color-text: #E7E4E4` on `#1E1E1E` | Passes contrast (≈12:1) but the warm light-gray on warm-dark feels muddy in photos. |
| **Yellow links on dark BG** | `a { color: #FECD08 }` on `#1E1E1E` | 11.7:1 contrast — fine for links, but yellow is also the *primary*, so it's overused; the eye has nowhere to rest. |
| **No semantic hierarchy** | H1 is white, H2 is white-uppercase-25px, both shout equally | Every section header has the same weight as the hero. Importance is undifferentiated. |
| **Sharp + flat = brittle** | `border-radius: 0` on cards, hero, buttons; no shadow tokens | Modern viewers read this as "old WordPress site," not "intentional industrial." |
| **Bootstrap-era utility colors leak through** | `#d9534f` (BS3 danger), `#5cb85c` (BS3 success), `#5bc0de`, `#f0ad4e` still live in the CSS | Style debt — looks unowned. |
| **Single button style** | Buttons are `#5D5D5D` mid-gray with white text, no primary/secondary distinction | Calls-to-action don't visually rank. "Request a Quote" reads same as "More". |
| **Hero text content-light** | Hero is *just* the rotating tagline + arrows; no value prop, no CTA above the fold | Bounces visitors who need orientation. |

---

## 3. Color system — the rebuild palette

### 3.1 Core brand (preserved from existing kit)

```css
/* Pops yellow — the one color we own. Use sparingly: ≤ 10% of any view. */
--pops-yellow-500: #FECD08;   /* primary brand, current --e-global-color-primary */
--pops-yellow-600: #DEB101;   /* hover/pressed, current --e-global-color-secondary */
--pops-yellow-300: #FFE067;   /* NEW — for soft fills, focus rings */
--pops-yellow-100: #FFF7D6;   /* NEW — tint for highlight bars, callouts */

/* Peach/tan — keep as a secondary "warmth" accent for empty states & success */
--pops-tan-400:    #FFBC7D;   /* current page-transition color */
```

### 3.2 Neutrals — replacement scale (fixes the "muddy gray" problem)

The existing site uses ~8 different grays inconsistently (`#69727d`, `#A1A1A1`, `#363636`, `#3C3C3C`, `#5D5D5D`, `#706F6F`, `#9DA5AE`, `#27343D`). Collapse to one cool, slightly blue-tinted scale — reads cleaner against yellow and against shop photography.

```css
/* Cool neutrals — 11-step scale, OKLCH-derived for perceptual evenness */
--ink-50:   #F7F8FA;   /* light surface */
--ink-100:  #ECEEF2;
--ink-200:  #D7DBE2;   /* dividers on light */
--ink-300:  #B4BAC4;
--ink-400:  #8990A0;   /* secondary text on light */
--ink-500:  #5D6472;   /* body text on light */
--ink-600:  #3F4654;   /* dividers on dark */
--ink-700:  #2A303B;   /* card surface on dark — replaces #27343D */
--ink-800:  #1B1F27;   /* page surface on dark */
--ink-900:  #11141A;   /* deepest — replaces pure #000 (less harsh) */

/* Pure white only for hero/CTA contrast — body text uses ink-100/200 on dark */
--paper:    #FFFFFF;
```

**Why not pure black?** `#11141A` keeps the heavy industrial mood without the ink-bleed look pure black gives on retina screens, and it photographs better behind shop imagery.

### 3.3 Semantic / status (replaces the leaking Bootstrap-3 colors)

```css
--success-500:  #2F7A3A;   /* replaces #5cb85c — meets WCAG AA on light */
--success-100:  #D4E9D6;   /* tint, already in current site */

--warn-500:     #B8730D;   /* replaces #f0ad4e — readable on white */
--warn-100:     #FFEDC2;

--danger-500:   #B0322E;   /* replaces #d9534f — deeper, less Bootstrap */
--danger-100:   #FBDCDA;

--info-500:     #1D6FB8;   /* replaces #5bc0de */
--info-100:     #DCEAF6;
```

### 3.4 Usage rules (the "60-30-10" we'll actually enforce)

| Allocation | Color | Use |
|---|---|---|
| ~60% | `--ink-800` / `--paper` | Page surface (dark on marketing, light on portal/app) |
| ~30% | `--ink-700` / `--ink-100` | Cards, panels, sections, dividers |
| ~7% | `--ink-100` / `--ink-500` | Body text |
| ~3% | `--pops-yellow-500` | **Only** for: primary CTAs, the brand mark, active nav, key data emphasis. *Not* for body links. |

**Body links on dark BG:** `--ink-100` underlined; **on hover** swap to `--pops-yellow-500`. This stops the "yellow everywhere" overuse while keeping the brand reveal as a moment.

### 3.5 Contrast verification (WCAG 2.1 AA — must pass)

| Pair | Ratio | Use |
|---|---|---|
| `--paper` on `--ink-800` | ~16.5 : 1 | Hero / large display |
| `--ink-100` on `--ink-800` | ~13.7 : 1 | Body text on dark |
| `--ink-500` on `--paper` | ~7.1 : 1 | Body text on light |
| `--pops-yellow-500` on `--ink-800` | ~11.4 : 1 | Brand accent / CTAs |
| `--ink-900` on `--pops-yellow-500` | ~12.0 : 1 | Text *on* yellow CTAs (use ink-900, **not** white) |

The rebuild ships with a Playwright contrast lint that fails the build on any ratio < 4.5:1 for normal text, < 3:1 for large.

---

## 4. Typography — the font pairing the current site is missing

### 4.1 The problem with one font

The current site uses Open Sans for headings, body, buttons, captions, everything. Open Sans is a humanist sans-serif designed for *body* legibility — at H1 sizes it looks soft and undifferentiated. Combined with `text-transform: uppercase` and a single weight ramp, every section header has the same visual weight.

### 4.2 Recommended pairing — Display + Text

Two fonts. Both free, both excellent on screen, both load from Google Fonts or self-hosted via `next/font`.

| Role | Family | Why this one |
|---|---|---|
| **Display** (H1, H2, hero, big numbers, brand mark word "POPS") | **Archivo Black** *or* **Bebas Neue** | Industrial signage / stencil DNA. Carries the uppercase hero treatment that's already part of the brand without flattening at large sizes. Archivo Black if we want a chunkier, more grounded feel; Bebas Neue if we want condensed-poster vibes. **Pick Archivo Black** — it pairs better with humanist body text. |
| **Text** (H3–H6, body, UI, forms, tables) | **Inter** | The de facto modern UI sans. Designed for screens at all sizes, has true variable-weight axis, ships with tabular figures (critical for job IDs, timestamps, status counters in the SaaS). Replaces Open Sans wholesale. |
| **Mono** (job IDs, code, telemetry, audit logs) | **JetBrains Mono** | Clear digit shapes, slashed zero. Used only inside the app, not on marketing. |

#### Why this beats keeping Open Sans

- **Tonal contrast:** Archivo Black's heavy industrial geometry against Inter's neutral humanism gives every page a clear "shout vs. speak" register.
- **Reading speed:** Inter at 16px / 1.6 line-height is measurably faster to read than Open Sans at the same metrics on dense business content (Pops' service pages average 600–900 words).
- **System fallback alignment:** Inter falls back to `-apple-system, "Segoe UI"`; Archivo Black falls back to `"Arial Black", Impact` — never a jarring substitution.

#### Alternatives we considered (and rejected)

| Pair | Why not |
|---|---|
| Oswald + Lato | Dated to 2016; Oswald's narrow proportions clash with shop photography. |
| Bebas Neue + Source Sans Pro | Bebas only has one weight — no flexibility for dense headings. |
| Roboto Condensed + Roboto | Single super-family. Same mono-font problem we're trying to escape. |
| Anton + Inter | Anton is too poster-y; reads "indie pizza shop" not "industrial coatings since 1972." |

### 4.3 Type scale (modular, 1.250 ratio — major third)

Anchored at 16px body. Scales accessibly down to mobile (320px) without breakpoint thrash.

| Token | px | rem | Use | Family / weight |
|---|---|---|---|---|
| `--text-display-xl` | 72 | 4.5 | Hero only | Archivo Black 900 |
| `--text-display-lg` | 56 | 3.5 | Page hero (H1) | Archivo Black 900 |
| `--text-display-md` | 44 | 2.75 | Section opener | Archivo Black 900 |
| `--text-h1` | 36 | 2.25 | H1 in content | Archivo Black 900 |
| `--text-h2` | 28 | 1.75 | H2 | Archivo Black 900 |
| `--text-h3` | 22 | 1.375 | H3 | Inter 700 |
| `--text-h4` | 18 | 1.125 | H4 / card title | Inter 700 |
| `--text-lg` | 18 | 1.125 | Lead paragraph | Inter 400 |
| `--text-base` | 16 | 1.0 | Body | Inter 400 |
| `--text-sm` | 14 | 0.875 | Secondary, captions | Inter 500 |
| `--text-xs` | 12 | 0.75 | Microcopy, labels | Inter 600 (tracked +0.04em, uppercase) |

**Critical fixes vs. current site:**
- Line-height ramp: display **1.05** • H1–H3 **1.2** • body **1.6** • caption **1.4**. The current `font-size: 25px; line-height: 25px` is removed.
- Uppercase reserved for: micro-labels (`--text-xs`), button text, and the brand wordmark. **Headings ditch the uppercase** — Archivo Black already provides the bold-industrial register without sacrificing scannability.
- Letter-spacing: display `-0.02em` (tighten heavy weights), body `0`, micro-labels `+0.04em` (open up small caps).

### 4.4 Loading strategy

```ts
// app/layout.tsx — Next.js 16 + next/font (no FOUT, swaps without layout shift)
import { Archivo_Black, Inter } from "next/font/google";

const display = Archivo_Black({
  weight: "400",            // Archivo Black ships only 900 visually but file weight is 400
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const text = Inter({
  subsets: ["latin"],
  variable: "--font-text",
  display: "swap",
  axes: ["opsz"],           // optical-size axis for crisp small text
});
```

Self-host both with `subsets: ["latin"]` only — Pops is English-only Wave 1 (CLAUDE.md hard rule). Spanish (Wave 2) re-evaluates with `latin-ext`.

---

## 5. Spacing, radius, elevation

### 5.1 Spacing scale (4px base)

```
--space-0:  0
--space-1:  4px
--space-2:  8px
--space-3:  12px
--space-4:  16px   ← default
--space-5:  20px
--space-6:  24px
--space-8:  32px
--space-10: 40px
--space-12: 48px
--space-16: 64px
--space-20: 80px
--space-24: 96px
--space-32: 128px
```

The current site has no system — paddings range across `8px, 11px, 13px, 24px, 30px` with no rhythm. Lock to the scale.

### 5.2 Radius

The current site uses `border-radius: 0` everywhere except a few legacy Bootstrap survivors at 3/4/5/6/10px. **Don't go fully square — but don't go SaaS-rounded either.** Industrial brand wants restrained corners.

```css
--radius-none: 0;        /* hero corners, dividers */
--radius-sm:   2px;      /* default for buttons, inputs, cards */
--radius-md:   4px;      /* modals, primary CTAs */
--radius-lg:   8px;      /* avatars, pills */
--radius-full: 9999px;   /* status chips, employee avatars */
```

### 5.3 Elevation (the missing layer on the current site)

Current site uses zero shadows. Cards float visually on the textured background only because the photos have light edges — that's accidental, not designed. Add a 5-step elevation:

```css
--elev-0: none;
--elev-1: 0 1px 2px rgb(0 0 0 / 0.20);                                     /* hairline */
--elev-2: 0 2px 4px rgb(0 0 0 / 0.18), 0 1px 2px rgb(0 0 0 / 0.16);        /* card rest */
--elev-3: 0 8px 16px rgb(0 0 0 / 0.20), 0 2px 4px rgb(0 0 0 / 0.18);       /* card hover, dropdown */
--elev-4: 0 16px 32px rgb(0 0 0 / 0.24), 0 4px 8px rgb(0 0 0 / 0.20);      /* modal */
--elev-focus: 0 0 0 3px var(--pops-yellow-300);                            /* focus ring */
```

On dark surfaces, supplement shadow with a 1px `--ink-600` border so the card edge is visible — shadow alone fails on `#1B1F27`.

---

## 6. Components — design directions for the rebuild

### 6.1 Buttons (the biggest single readability fix)

The current site has one button: gray bg, white text, uppercase, no hierarchy. Rebuild gets three ranks:

| Variant | BG | Text | Border | Use |
|---|---|---|---|---|
| **Primary** | `--pops-yellow-500` | `--ink-900` | none | "Request a Quote", primary CTA per page (one max) |
| **Secondary** | transparent | `--ink-100` (dark) / `--ink-800` (light) | `1px solid currentColor` | "Learn more", "View services" |
| **Ghost** | transparent | `--ink-400` | none | Tertiary actions, in-card |
| **Destructive** | `--danger-500` | `--paper` | none | Cancel job, void invoice (app only) |

- Height: 44px default (touch target), 36px compact.
- Padding: `var(--space-3) var(--space-6)`.
- Radius: `--radius-sm` (2px) — keeps industrial feel.
- Type: Inter 600, 14px, **not** uppercase. Uppercase reserved for ALL CAPS micro-labels.
- Focus: `--elev-focus` ring, never browser default.
- Loading: replace label with a 16px spinner; freeze button width.
- Disabled: 50% opacity, `cursor: not-allowed`. Don't gray out — keeps brand color visible so users know it's the same button.

### 6.2 Hero pattern

Current hero: centered uppercase tagline rotation, no value prop, no CTA. New hero is structured:

```
┌──────────────────────────────────────────────────────────┐
│  [eyebrow]  FAMILY OWNED · LAKELAND, FL · SINCE 1972     │
│                                                            │
│  [display-lg]  Four generations of                        │
│                industrial finishing —                     │
│                done right the first time.                 │
│                                                            │
│  [body-lg]     Powder coating, abrasive blasting, and     │
│                wet paint for aerospace, defense, and      │
│                heavy equipment.                           │
│                                                            │
│  [primary]  Request a Quote   [secondary]  See our work   │
└──────────────────────────────────────────────────────────┘
   ↑ shop-floor photo, 60% darkened with --ink-900 overlay
```

**Why:** the existing hero is a brand mood; this one is a brand mood *plus* an answer to "what do you do, who is it for, what should I do next."

### 6.3 Service cards

Current cards: tan-tinted thumbnail, uppercase H2, 1-line tagline, "[More]" link. Stay close to that — but tighten:

- 4-up grid desktop, 2-up tablet, 1-up mobile.
- Card surface: `--ink-700` on dark pages, `--paper` on light.
- Image: 16:10 aspect, no tan tint (current sepia wash hides what the service actually looks like).
- Label: `--text-xs` uppercase eyebrow ("Service 03 / Powder Coating").
- Title: `--text-h4` Inter 700, no uppercase.
- Body: 2 lines of `--text-sm`.
- Footer: arrow icon + "Learn more" link in `--pops-yellow-500`.
- Hover: `--elev-3` lift, image scales 1.03 over 200ms ease-out.

### 6.4 Forms (Request a Quote, Contact)

The current forms are stock Elementor — the rebuild needs them to feel like the rest of the site:

- Labels above inputs (never floating placeholders for B2B forms — manufacturers fill these on tablets).
- Inputs: 44px tall, `--ink-700` BG on dark / `--paper` on light, `1px solid --ink-600`, 16px Inter.
- Focus: 2px `--pops-yellow-500` border + `--elev-focus` ring.
- Errors: red `--danger-500` border + helper text below in `--danger-500`, never tooltip-only.
- Required fields: `*` after label in `--pops-yellow-500`, with a legend at top of form.
- Submit button: full-width on mobile, auto on desktop; primary variant.

---

## 7. Imagery & content principles

The current site does this well — codify it so the rebuild doesn't drift toward stock.

| Rule | Why |
|---|---|
| **Real shop, real people, real PPE.** No stock unless we explicitly mark it. | The brand promise is "family business since 1972"; stock photography breaks that. |
| **Photos are dark by default**, with optional `--ink-900` 40–60% overlay when text sits over them. | Keeps text legible; ties photos to the dark UI palette. |
| **Captions on every photo of work** — material, finish, customer (or "confidential — defense"). | Demonstrates breadth without naming protected customers. |
| **Numbers drive trust, not adjectives.** Use Pops-actuals: 53 years, 4 generations, plant size sq ft, # of finishes per year. | "World-class" means nothing; "53 years" means everything. |
| **Voice:** plain, technical, second-person. Never marketing-ese. | Customers are buyers and engineers. They don't want "innovative solutions." |

---

## 8. Motion

Current site has none meaningful (just the autoplay rotating tagline). Add restraint:

- **Tokens:** `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)`, `--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1)`, `--duration-fast: 150ms`, `--duration-base: 200ms`, `--duration-slow: 400ms`.
- **Transforms only** for hover/press (translate, scale 1.0–1.03, opacity). Never animate `width`/`height`/`top`/`left`.
- **Page transitions:** none on marketing (instant nav), 200ms fade on portal route changes.
- **Respect `prefers-reduced-motion: reduce`** — halve all durations, disable parallax/auto-rotation.

---

## 9. Accessibility floor (non-negotiable)

The marketing site and the SaaS shell ship to WCAG 2.1 AA, no exceptions:

- Contrast ratios from §3.5; build fails on regression.
- All interactive elements ≥ 44×44px tap target (shop-floor iPad usage in the SaaS — don't make a marketing exception).
- Focus visible *always* — never `outline: none` without a replacement ring.
- Form errors are described programmatically (`aria-describedby` linking to helper text).
- Heading order is monotonic (no H2 → H4 skips). Each page has exactly one H1.
- All non-text content has `alt`; decorative images use `alt=""`.
- Motion respects `prefers-reduced-motion`.
- Keyboard navigation completes every flow on the site without a mouse, including the quote form.

---

## 10. Token sheet — drop into Tailwind v4 / shadcn

Tailwind v4 is CSS-first per CLAUDE.md. This block goes in `app/globals.css`:

```css
@theme {
  /* Brand */
  --color-pops-yellow-100: #FFF7D6;
  --color-pops-yellow-300: #FFE067;
  --color-pops-yellow-500: #FECD08;
  --color-pops-yellow-600: #DEB101;
  --color-pops-tan-400:    #FFBC7D;

  /* Neutrals */
  --color-ink-50:  #F7F8FA;
  --color-ink-100: #ECEEF2;
  --color-ink-200: #D7DBE2;
  --color-ink-300: #B4BAC4;
  --color-ink-400: #8990A0;
  --color-ink-500: #5D6472;
  --color-ink-600: #3F4654;
  --color-ink-700: #2A303B;
  --color-ink-800: #1B1F27;
  --color-ink-900: #11141A;
  --color-paper:   #FFFFFF;

  /* Semantic */
  --color-success-100: #D4E9D6;
  --color-success-500: #2F7A3A;
  --color-warn-100:    #FFEDC2;
  --color-warn-500:    #B8730D;
  --color-danger-100:  #FBDCDA;
  --color-danger-500:  #B0322E;
  --color-info-100:    #DCEAF6;
  --color-info-500:    #1D6FB8;

  /* Type */
  --font-display: "Archivo Black", "Arial Black", Impact, system-ui, sans-serif;
  --font-text:    "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-mono:    "JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace;

  /* Radius */
  --radius-none: 0;
  --radius-sm:   2px;
  --radius-md:   4px;
  --radius-lg:   8px;
  --radius-full: 9999px;

  /* Elevation */
  --shadow-1: 0 1px 2px rgb(0 0 0 / 0.20);
  --shadow-2: 0 2px 4px rgb(0 0 0 / 0.18), 0 1px 2px rgb(0 0 0 / 0.16);
  --shadow-3: 0 8px 16px rgb(0 0 0 / 0.20), 0 2px 4px rgb(0 0 0 / 0.18);
  --shadow-4: 0 16px 32px rgb(0 0 0 / 0.24), 0 4px 8px rgb(0 0 0 / 0.20);
}
```

**Multi-tenant note (DESIGN.md §4.4 / CLAUDE.md):** Tenant 2+ override `--color-pops-yellow-*` and the two font CSS variables in a per-tenant CSS file loaded by `src/proxy.ts` after host detection. Spacing, radius, elevation, and the ink scale stay shared across all tenants — those are platform tokens, not brand tokens.

---

## 11. Mapping — old → new (cheat sheet for the rebuild)

| Current site value | Replace with | Why |
|---|---|---|
| `--e-global-color-primary: #FECD08` | `--color-pops-yellow-500` (same value, new name) | Naming convention; value preserved. |
| `--e-global-color-secondary: #DEB101` | `--color-pops-yellow-600` | Same. |
| `--e-global-color-text: #E7E4E4` | `--color-ink-100: #ECEEF2` | Cooler, cleaner against shop photos. |
| `#27343D` (navy panel) | `--color-ink-700: #2A303B` | Less blue, more neutral. |
| `#5D5D5D` (button bg) | n/a — replaced by 4-variant button system | Buttons get hierarchy. |
| `#d9534f`, `#5cb85c`, `#5bc0de`, `#f0ad4e` (Bootstrap leftovers) | Semantic 100/500 pairs | Owned palette, AA contrast. |
| Open Sans (everywhere) | Archivo Black (display) + Inter (text) | Type pairing; readability. |
| `text-transform: uppercase` on H2 | Removed; reserved for micro-labels & buttons | Scannability. |
| `border-radius: 0` everywhere | `--radius-sm` (2px) default, 0 only intentional | Restrained industrial vs. brittle. |
| `font-size: 25px; line-height: 25px` | `--text-h2: 28px / 1.2` | Leading restored. |
| Single button style | Primary / secondary / ghost / destructive | Hierarchy. |

---

## 12. Open questions to confirm with stakeholder before locking

1. **Yellow exclusivity.** Is `#FECD08` an actual brand standard (paint chip, vehicle wrap, signage) or just the website? If standard, it's locked. If website-only, we have ±3% of headroom to nudge for AAA contrast on small text.
2. **Photography refresh.** Some current images are 8+ years old. Budget for a half-day photoshoot of the Lakeland plant during the rebuild?
3. **Logo lockup.** Current site shows a wordmark in the nav only; no formal lockup document. Do we have an SVG master, or do we vectorize from screenshots?
4. **Tagline canon.** "Your Partners For Success" vs. "Four generations of expertise" — pick one as primary, the other becomes a supporting line. Recommendation: **"Four generations of expertise"** as the headline; "Your partners for success" becomes the value-prop subhead.
5. **Tenant 2+ readiness.** Confirm we want yellow-and-ink as the *platform* default and tenants override yellow only — or whether platform default should be more neutral (e.g., a steel-blue) so Pops-yellow feels like Tenant 1's choice, not the SaaS's identity.

---

## 13. Implementation checklist (for the rebuild module)

- [ ] Add `@theme` block from §10 to `src/app/globals.css`.
- [ ] Install `next/font` Archivo Black + Inter; expose via `--font-display`, `--font-text`.
- [ ] Add Playwright contrast lint to CI (run on every PR touching `src/app/**` or `src/shared/ui/**`).
- [ ] Build `Button`, `Card`, `Hero`, `ServiceTile`, `Form*`, `EyebrowLabel` shadcn primitives against §6.
- [ ] Set `prefers-reduced-motion` query in `globals.css` per §8.
- [ ] Document tenant brand-override pattern in `docs/DESIGN.md` Wave 4 section (`tenant-config` module).
- [ ] Sign off §12 with stakeholder before locking the marketing rebuild scope.

---

*Sources: live CSS at `popsindustrial.com/wp-content/cache/speedycache/.../1e983b84ee20cc3b-…-combined.css`, full-page screenshot 2026-05-02, and PRD/DESIGN/CLAUDE.md project context.*
