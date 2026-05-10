# Pops Industrial Coatings — Stripe-Inspired Redesign

**Date:** 2026-05-03  
**Status:** Approved for implementation  
**Scope:** Homepage + shared components (Header, Hero, Section layout)

---

## 1. What We Observed on Stripe.com

| Principle | What Stripe Does |
|-----------|-----------------|
| **Light foundation** | White/near-white (#F6F9FC) base; dark used sparingly for emphasis sections |
| **Typography scale** | Massive display text at 48–72px, tight letter-spacing (−0.02em), mixed bold+light weights in same headline |
| **Strategic color moments** | Purple gradient hero; rest of page is almost colorless — color appears in key UI moments only |
| **Feature rows, not card grids** | Features listed as horizontal rows divided by hairlines, not uniform icon+text cards |
| **Layered surfaces** | White cards float on colored backgrounds; depth through shadow + overlap not just flat color |
| **Trust bar** | Customer logo strip immediately below hero — authority signal before any product detail |
| **Navigation with CTA** | Full nav: logo left, links center, sign-in + filled CTA button right |
| **Breathing room** | Generous section padding (100px+), elements don't feel cramped |
| **Subtle borders** | 1px light borders on cards and dividers; nothing heavier than 1px as a decorative accent |
| **Product-in-design** | UI screenshots are the hero visual, not stock photography |

---

## 2. Current Pops Website Issues

| Issue | Severity |
|-------|----------|
| Entirely dark — no light sections, no contrast variation | High |
| Services shown as 5 identical image cards (banned pattern) | High |
| Header has only "Home" link — no real navigation | High |
| No trust signals / stats between hero and services | Medium |
| Section transitions feel monotonous (all dark on dark) | Medium |
| Typography hierarchy is flat — hero headline at 36px is too small | Medium |
| No CTA section before footer | Medium |
| Yellow used only for small labels + buttons, not as a design element | Low |

---

## 3. Design Direction

**Scene sentence:** A plant purchasing manager Googling "industrial coating Lakeland FL" at 10am from a well-lit office, evaluating 3 vendors before calling the one that looks most capable.

This forces: **light mode foundation.** The site must feel professional and credible, not like a dark-mode app.

**Color strategy: Committed** — the Pops yellow drives 40% of the hero energy and the final CTA section. The rest of the page is clean and light.

**Aesthetic lane:** Industrial-editorial with Swiss clarity. Think Stripe's precision applied to a manufacturing context. Not tech. Not fintech. Heavy industry that takes itself seriously.

---

## 4. Color System (OKLCH)

All new tokens added to `globals.css` alongside existing dark tokens.

```css
/* Light-mode surface tokens */
--color-canvas:       oklch(98.5% 0.005 88);   /* warm white — body bg */
--color-surface:      oklch(96.5% 0.006 88);   /* card bg */
--color-border:       oklch(90% 0.006 88);     /* dividers */

/* Light-mode text */
--color-ink-on-light:  oklch(13% 0.015 250);   /* near-black, slight blue */
--color-muted-on-light: oklch(42% 0.012 250);  /* secondary text */

/* Yellow hero variant */
--color-yellow-canvas: oklch(87% 0.18 90);     /* Pops yellow #FECD08 in OKLCH */
--color-yellow-dark:   oklch(76% 0.17 90);     /* hover / deeper yellow */
```

**Typography (no changes to font families — Archivo Black + Inter stay):**

| Role | Current | New |
|------|---------|-----|
| Hero headline | 36px / 56px | 48px / 72px |
| Hero letter-spacing | default | −0.02em |
| Hero line-height | 1.05 | 1.0 |
| Section h2 | 28px | 36px |
| Section letter-spacing | default | −0.01em |

---

## 5. Component Changes

### 5.1 Header — full navigation

**Before:** Logo + one "Home" link  
**After:** Logo left | Services, About Us, Contact center | Request a Quote (yellow filled CTA) right

```
[POP'S LOGO]  Services  About Us  Contact          [Request a Quote →]
```

- Background: `oklch(98.5% 0.005 88)` (warm white), border-bottom: 1px `--color-border`
- Active nav link: underline via `text-decoration` on hover, not background color changes
- CTA button: yellow filled, ink-900 text

### 5.2 Hero — improved overlay + type

**Before:** Uniform 60% dark overlay, standard text  
**After:** Gradient overlay (dark at bottom, lighter at top-right), larger type, stat chips below CTAs

```
[Full-bleed industrial photo]
[Gradient overlay — heavier at bottom, lighter at top]
  FAMILY OWNED · LAKELAND, FL · SINCE 1972
  Four generations of industrial
  finishing — done right.
  [Powder coating, blasting, wet paint for aerospace and defense]
  [Request a Quote →]  [See our work]

  ——— Since 1972  |  4 Generations  |  Aerospace Ready  |  Lakeland, FL ———
```

### 5.3 Services — numbered rows (replaces card grid)

**Before:** 5 identical image+text cards in a grid  
**After:** Horizontal numbered list rows separated by hairlines

Each row:
```
  01  ─────────────────────────────────────────────────────────────  [Photo]
      Wet Paint Coatings
      Precision & expertise for industrial wet paint applications.
      Learn more →
```

- Light section background (`--color-canvas`)
- Row height: `py-8 md:py-10`
- Number: `font-display text-5xl text-pops-yellow-500 opacity-60`
- Dividers: 1px `--color-border`
- Hover: entire row gets subtle `background: --color-surface`
- Photo: fixed 200×130px thumbnail, `object-cover`, subtle shadow

### 5.4 Trust / Stats bar

New section between Hero and Services:

```
  SINCE 1972    4 GENERATIONS    AEROSPACE READY    LARGE CAPACITY
  50+ years     Family owned     Defense work        25k sqft facility
```

- Light background
- Dividers between stats
- Font: Inter semibold for numbers, Inter regular for labels
- Subtle border-top and border-bottom

### 5.5 Commitment section (3-column → redesigned)

**Before:** 3 dark columns with flat text  
**After:** 2-column grid, light bg, left column has large pull-quote

```
  [ "Four generations means every       | Commitment
    promise has a name behind it."      | [body text...]
                                        |
                                        | Infrastructure
                                        | [body text...] [View Facilities]
                                        |
                                        | Certifications
                                        | [body text...] [Our Certifications]
  ]
```

### 5.6 New CTA Banner (before footer)

Yellow background section with dark text:

```
  [Yellow section]
  Ready to start your project?
  From powder coating to abrasive blasting — get a quote in 24 hours.
                    [Request a Quote →]
```

---

## 6. Section Rhythm (Light ↔ Dark alternation)

| # | Section | Background |
|---|---------|-----------|
| 1 | Header | Light (new) |
| 2 | Hero | Dark (photo) — keep |
| 3 | Stats bar | Light (new) |
| 4 | Services | Light (new layout) |
| 5 | Commitment/About | Light (converted) |
| 6 | Family photo | Dark (keep) |
| 7 | CTA banner | Yellow (new) |
| 8 | Footer | Dark (keep) |

This alternation creates visual rhythm and prevents the current monotony.

---

## 7. Files Changed

| File | Change Type |
|------|------------|
| `app/globals.css` | Add light-mode OKLCH tokens |
| `app/page.tsx` | Restructure sections, add Stats bar + CTA banner |
| `components/layout/header.tsx` | Full navigation, light bg, CTA button |
| `components/marketing/hero.tsx` | Larger type, gradient overlay, stat strip |
| `components/marketing/service-row.tsx` | New component — numbered row layout |
| `components/layout/section.tsx` | Add `tone="yellow"` variant |

---

## 8. What We Are NOT Changing

- Font families (Archivo Black + Inter stay — they're excellent)
- Pops Yellow as the brand accent
- Semantic HTML structure
- Accessibility patterns (focus rings, skip links, ARIA)
- Service page content
- The family photo section (works well)
- Footer structure (just converting to work on dark bg)
