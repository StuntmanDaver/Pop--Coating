# Claude Code — project guardrails

> Multi-tenant whitelabel SaaS for industrial finishing shops (powder coating, sandblasting, plating, galvanizing). **Pops Industrial Coatings** is the launch tenant (Tenant 1). Architected as multi-tenant from day 1. Built by **Cultr Ventures** for Pops; Pops is the customer.

## Canonical sources of truth (highest precedence)

These three documents are **law**. If anything in `.claude/agents/`, `.claude/skills/`, a generated suggestion, or an external tool conflicts with them — **follow the docs and surface the conflict to the user.** Do not silently override.

| Document | Role |
|---|---|
| [`PRD.md`](PRD.md) | What we're building, scope, success metrics. v3.0 (multi-tenant whitelabel pivot). |
| [`docs/DESIGN.md`](docs/DESIGN.md) | How we're building it. Architecture, full data model, modules, auth flows, roadmap, costs, risks, testing. v1.1. |
| [`docs/EXECUTION.md`](docs/EXECUTION.md) | How concurrent sub-agents accelerate the build. ~880 dispatches across 36 weeks. v1.0. |

When you start a task, **check whether it touches a decision in these docs**. If yes, follow the doc. If you think the doc is wrong, say so to the user before acting.

## Stack constraints (every agent must respect)

Hard rules — not preferences. Apply to all generated code.

- **Next.js 16** — App Router, Server Actions, `src/proxy.ts` (renamed from `middleware.ts` in Next.js 16) for multi-domain + multi-tenant routing. No Pages Router. No client-side data fetching where a Server Action / RSC works.
- **Next.js 16 specifics (DESIGN.md §102):** `cookies()` from `next/headers` is **async** — `await cookies()`. For auth checks, **always** use `supabase.auth.getUser()` (validates with auth server). **Never** `getSession()` for auth decisions — it can return stale/forged data.
- **TypeScript strict** — `tsconfig` has `"strict": true`. No `any`. No non-null assertions (`!`) without justification in a comment. Discriminated unions over loose types.
- **Tailwind v4** + **shadcn/ui** — Tailwind v4 (CSS-first config in `app/globals.css`, no `tailwind.config.ts`). shadcn primitives via CLI. Per-tenant branding via CSS variables, not hardcoded colors.
- **Supabase** — Postgres + Auth + Realtime + Storage. Pro plan. Single instance. **Multi-tenant via `tenant_id` column on every business table + RLS policy that filters by tenant.** Auth uses Supabase Auth; `tenant_id` lives in JWT **`app_metadata`** (not raw token claims).
- **RLS is non-negotiable.** Every new business table gets `tenant_id uuid not null references public.tenants(id)` + an RLS policy filtering on the `app.tenant_id()` SECURITY DEFINER helper (defined in `docs/DESIGN.md` §3.2 — reads `app_metadata.tenant_id` from the request JWT). Use `tenant_id = app.tenant_id()` in policies, **never** parse JWT inline. Service-role usage is gated by ESLint `no-restricted-imports` to: `src/modules/{settings,portal,auth}/**`, `src/shared/audit/**`, `supabase/functions/**`. **Forbidden** in `src/modules/scanning/**`.
- **Vercel** — Pro plan. Deploys + custom domains + per-tenant SSL + edge runtime where appropriate.
- **Resend** for transactional email; per-tenant from-identity with SPF/DKIM/DMARC.
- **Upstash Redis** via Vercel Marketplace for rate limiting (`@upstash/ratelimit` sliding-window).
- **Sentry** for error tracking (cross-tenant; tag every event with `tenant_id`).
- **`@react-pdf/renderer`** + **`qrcode`** for job packet PDFs.
- **`@zxing/browser`** for camera-based QR scanning. Target: iPad Safari (workstation tablets).
- **`next-intl`** for i18n. **English-only Wave 1.** Spanish lands in Wave 2+.
- **Stripe** — Wave 4 only. Per-tenant billing.
- **Cross-cutting code** lives in `src/shared/`. The canonical tree (DESIGN.md §4.4) is exactly: `audit/`, `auth-helpers/`, `db/`, `rate-limit/`, `realtime/`, `storage/`, `ui/`. Don't invent new top-level dirs without a decision.
- **Modules** live in `src/modules/<name>/` with a strict layout (DESIGN.md §4.2): `index.ts` is the only public surface; cross-module imports go through `index.ts` only (enforced via ESLint `no-restricted-imports` + `madge --circular src/modules` in CI). Wave-1 modules: `auth`, `crm`, `jobs`, `packets`, `scanning`, `timeline`, `dashboard`, `settings`, `portal`, `tags`. Wave-2: `inventory`, `quality`, `alerts`, `notifications`. Wave-3: `quotes`, `invoices`, `messaging`, `analytics`. Wave-4: `tenant-config`, `workflow-templates`, `agency-console`.
- **App routing layout** (DESIGN.md §117): `src/app/(office)/` for staff CRM/dashboards, `src/app/scan/` (NOT a route group — explicit URL `/scan`) for shop-floor PIN+scanner, `src/app/(portal)/` for customer portal, `src/app/api/webhooks/` for inbound (Resend, Stripe).
- **Project SQL helpers (DESIGN.md §3.2):** `app.tenant_id()`, `app.audience()`, `app.role()`, `app.staff_id()`, `app.workstation_id()`, `app.company_id()`, `app.set_updated_at()`, `app.has_consent_for()` (Wave 4). Plus SECURITY DEFINER wrappers for shop-staff writes: `app.validate_employee_pin`, `app.claim_workstation`, `app.record_workstation_heartbeat`, `app.release_workstation`, `app.record_scan_event`.
- **Project app helpers (DESIGN.md §4.4):** `withAudit()` HOF from `src/shared/audit/`; `requireOfficeStaff()` / `requireShopStaff()` / `requireCustomer()` from `src/shared/auth-helpers/require.ts`; `getCurrentClaims()` from `src/shared/auth-helpers/claims.ts`.
- **Auth library:** `@supabase/ssr` for cookie storage (`httpOnly`, `secure`, `sameSite=lax`, scoped to host — separate cookies for `app.*` vs `track.*`). Session refresh windows: office + customer = 30 days; **workstation = 1 hour** (stolen-tablet mitigation; tablet re-authenticates silently).
- **Hidden invariants (silent-failure landmines):**
  - **`jobs.production_status` direct UPDATE is forbidden** (DESIGN.md §4.3 Module 3). Column-level grant `REVOKE UPDATE (production_status) ON jobs FROM authenticated` enforces it. Status changes go *only* through `app.record_scan_event()`.
  - **`supabase_auth_admin` role must keep `BYPASSRLS`** — the Auth Hook depends on it. Don't modify role attributes.
  - **`app.custom_access_token_hook` must not write to any tables** (Supabase Issue #29073 deadlock). User-row linking happens in a separate `AFTER INSERT` trigger.
- **Photo upload standard:** canvas → JPEG quality 0.7, max 1024px longest edge. Applies to scanner photos and any future image uploads. Same compression for offline-queued and online uploads.
- **Package manager:** `pnpm`. Use `pnpm install`, `pnpm test`, `pnpm gen:types`, etc. Never `npm` or `yarn`.

## Sub-agent dispatch convention

Source of truth: [`docs/EXECUTION.md` §1](docs/EXECUTION.md). Summary:

- The orchestrator (you/Claude or the user-as-orchestrator) batches `Agent` tool uses in a single message for parallel execution.
- Each agent's brief should be self-contained (the agent has no conversation history).
- Agents return findings/code; orchestrator integrates and commits.
- Agent type catalog: [`docs/EXECUTION.md` §2](docs/EXECUTION.md). Each named type has a definition file in [`.claude/agents/`](.claude/agents/).
- An agent definition is a **floor**, not a ceiling. Per-dispatch briefs may add task-specific constraints; they may not weaken stack constraints.

## Planning convention (`phase-planner` + briefs)

Before dispatching the first batch of any week's work:

1. Dispatch `phase-planner` to expand `docs/EXECUTION.md` week N into per-dispatch briefs.
2. Briefs land in `docs/briefs/WEEK-NN-BRIEFS.md` (one file per week, committed).
3. Orchestrator reviews briefs; dispatches builders by copy-pasting briefs into `Agent` tool calls.
4. Briefs are point-in-time records; not amended after dispatch.

Wave contracts (template at `docs/superpowers/templates/wave-contract.md`, filled instances at `docs/contracts/WAVE-N-CONTRACT.md`) are signed off by the user before any wave begins. Ship gate dispatches all three audit agents and requires PASS on each.

## Quality gates convention (verdict-driven)

Five evaluator agents act as merge/advance gates:

- `security-auditor` — blocks on **Critical** or **High** findings.
- `code-reviewer` — blocks on **Blocker** or **Major** findings.
- `performance-auditor` — blocks on any **Blocker** finding.
- `accessibility-auditor` — blocks on any **Blocker** (WCAG 2.1 AA fail).
- `dependency-auditor` — blocks on **Critical** or **High** advisories.

Each returns a verdict on the first line of output:

```
VERDICT: <PASS | FAIL | FAIL-WITH-FOLLOW-UP>
```

`FAIL-WITH-FOLLOW-UP` requires explicit user sign-off in the dispatch brief (issue + owner + deadline). Agents do not self-grant. PR/wave-advance is gated on PASS or signed-off `FAIL-WITH-FOLLOW-UP`. The wave contract (`docs/contracts/WAVE-N-CONTRACT.md`) specifies which auditors run when.

**Enforcement:** pipe evaluator output through [`scripts/check-verdict.sh`](scripts/check-verdict.sh) to verify the verdict line is well-formed before deciding to advance. Exit 0 = PASS, exit 1 = FAIL, exit 2 = format error (agent forgot the verdict line). See [`scripts/README.md`](scripts/README.md).

## Optional runtime: ruflo (memory + swarm)

The project optionally uses two [ruflo](https://github.com/ruvnet/ruflo) plugins for orchestration features. Installation is **user-side** (Claude Code plugin marketplace), not in the repo. See [`docs/runbooks/ruflo-install.md`](docs/runbooks/ruflo-install.md) for setup.

**Installed plugins (when used):**

- `ruflo-core` — provides `mcp__claude-flow__memory_usage` for persistent memory across dispatches.
- `ruflo-swarm` — provides `mcp__claude-flow__swarm_init` / `agent_spawn` / `task_orchestrate` / `swarm_status` for parallel batch coordination.

**Other ruflo plugins are deliberately not installed** (autopilot, intelligence, agentdb, aidefence, browser, jujutsu, wasm, workflows). Adding any of them requires a project decision (ADR).

**ruflo is optional.** All 23 agents in `.claude/agents/` work without ruflo. Use the MCP tools when one of these patterns applies (full guide in the runbook):

- **Memory:** caching expensive lookups across dispatches in a wave; carrying decisions from earlier dispatches forward; wave-to-wave continuity for things not captured in canonical docs.
- **Swarm:** parallel batches that need shared state (independent parallel batches use the standard `Agent` tool batching, not swarm).

**Don't put in ruflo memory** what belongs in canonical docs (PRD/DESIGN/EXECUTION), wave contracts, or weekly briefs. Memory is for ephemeral cross-dispatch hints, not source-of-truth content.

**Memory key namespace convention:** `<wave>/<week>/<agent>/<topic>` (e.g., `wave1/week4/schema-writer/jobs-table-decisions`). Wave-end retrospectives prune stale entries.

## Repo state

- **No application code yet.** Wave 1 Week 0 pre-flight is next.
- Git repo initialized; remote `origin` → `https://github.com/StuntmanDaver/Pop--Coating.git`. Default branch `main`.
- `.claude/skills/` — 93 design/UX/process skills (pre-loaded via Claude Code skill plugins; gitignored as plugin-managed).
- `.claude/agents/` — 23 project sub-agent definitions (committed): every agent type referenced in `docs/EXECUTION.md` (catalog in §2 plus `infrastructure-builder` / `devops` / `shadcn-installer` / `design-token-integrator` cited elsewhere) plus `phase-planner` from the Tier-1 harness work.
- `docs/superpowers/specs/` — design specs for cross-cutting decisions.
- `docs/superpowers/templates/` — reusable templates (wave contracts, etc.).
- `docs/briefs/` — per-week dispatch briefs produced by `phase-planner`.
- `docs/contracts/` — per-wave contracts (filled from template; user-signed before wave starts).
- `docs/runbooks/` — operational runbooks (ruflo install, future DR/incident-response).
- `scripts/` — bash utilities (verdict parser + tests).

## What NOT to do

- Don't introduce dependencies outside the stack listed above without surfacing it as a decision.
- Don't write code yet. The current phase is planning + tooling.
- Don't bypass RLS. Ever. If you think you need to, you don't — you need an audited admin path.
- Don't invent agent type names. Use the catalog in EXECUTION.md §2.

<!-- GSD:project-start source:PROJECT.md -->
## Project

**Pops Industrial Coatings — Operations Platform (Wave 1)**

A multi-tenant whitelabel SaaS for industrial finishing shops (powder coating, sandblasting, plating, galvanizing). Every job gets a printed QR-code packet; shop floor staff scan it at each workstation to advance the job through production stages, creating a timestamped, employee-attributed record. Customers see real-time status via a magic-link portal branded as the shop's own. **Pops Industrial Coatings** is the launch tenant (Tenant 1); the platform is architected for Tenant 2+ from day 1. Built by Cultr Ventures.

**Core Value:** Replace paper-based job tracking with a QR scan loop that gives shop owners live production visibility and eliminates "where is my job?" calls — both for office staff and customers.

### Constraints

- **Stack (hard)**: Next.js 16 App Router, TypeScript strict, Tailwind v4, shadcn/ui, Supabase, Vercel Pro, Resend, Upstash Redis, Sentry — no deviations without an explicit decision
- **Package manager**: pnpm only — no npm or yarn
- **Auth**: always `supabase.auth.getUser()` for auth decisions; never `getSession()`; `cookies()` from `next/headers` is async
- **RLS**: non-negotiable — every business table gets `tenant_id` + RLS policy; service-role usage gated to allowed modules only
- **Production status**: direct UPDATE forbidden; transitions only via `app.record_scan_event()` SECURITY DEFINER function
- **i18n**: English-only Wave 1; `next-intl` infrastructure in place from Day 1
- **Multi-tenant**: `tenant_id` on every business table; `app.tenant_id()` SECURITY DEFINER helper reads JWT `app_metadata`
- **Workstation session**: 1-hour TTL (stolen-tablet mitigation); office + customer = 30 days
- **Photo upload**: canvas → JPEG 0.7, max 1024px longest edge
<!-- GSD:project-end -->

<!-- GSD:stack-start source:STACK.md -->
## Technology Stack

Technology stack not yet documented. Will populate after codebase mapping or first phase.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

| Skill | Description | Path |
|-------|-------------|------|
| a-b-test-design | Design rigorous A/B tests with hypotheses, variants, metrics, and sample size calculations. | `.claude/skills/a-b-test-design/SKILL.md` |
| accessibility-audit | Conduct a comprehensive accessibility audit against WCAG guidelines with severity ratings and remediation steps. | `.claude/skills/accessibility-audit/SKILL.md` |
| accessibility-test-plan | Create accessibility testing plans covering assistive technologies and WCAG criteria. | `.claude/skills/accessibility-test-plan/SKILL.md` |
| affinity-diagram | Organize qualitative research data into an affinity diagram with themes, clusters, and insight statements. Use when synthesizing large amounts of qualitative data from interviews, observations, or surveys. | `.claude/skills/affinity-diagram/SKILL.md` |
| aframe-webxr | Declarative web framework for building browser-based 3D, VR, and AR experiences using HTML and entity-component architecture. Use this skill when creating WebXR applications, VR experiences, AR experiences, 360-degree media viewers, or immersive web content with minimal JavaScript. Triggers on tasks involving A-Frame, WebXR, VR development, AR development, entity-component-system, declarative 3D, or HTML-based 3D scenes. Built on Three.js with accessible HTML-first approach. | `.claude/skills/aframe-webxr/SKILL.md` |
| animated-component-libraries | Pre-built animated React component collections combining Magic UI (150+ TypeScript/Tailwind/Motion components) and React Bits (90+ minimal-dependency animated components). Use this skill when building landing pages, marketing sites, dashboards, or interactive UIs requiring pre-made animated components instead of hand-crafting animations. Triggers on tasks involving animated UI components, Magic UI, React Bits, shadcn/ui integration, Tailwind CSS components, or component library selection. Alternative to manually implementing animations with Framer Motion or GSAP. | `.claude/skills/animated-component-libraries/SKILL.md` |
| animation-principles | Apply animation principles to UI motion for purposeful, polished interactions. | `.claude/skills/animation-principles/SKILL.md` |
| animejs | Versatile JavaScript animation engine for DOM, CSS, SVG, and JavaScript objects. Use when creating timeline-based animations, stagger effects, SVG morphing, keyframe sequences, or complex choreographed animations. Triggers on tasks involving Anime.js, timeline animations, staggered sequences, SVG path animations, morphing, or multi-step animation choreography. Alternative to GSAP for SVG-heavy animations and React-independent projects. | `.claude/skills/animejs/SKILL.md` |
| babylonjs-engine | Comprehensive skill for Babylon.js 3D web rendering engine. Use this skill when building real-time 3D experiences, browser-based games, interactive visualizations, or immersive web applications. Triggers on tasks involving Babylon.js, 3D scenes, WebGL/WebGPU rendering, entity-component systems, physics simulations, PBR materials, shadow mapping, or 3D model loading. Alternative to Three.js with built-in editor integration and game engine features. | `.claude/skills/babylonjs-engine/SKILL.md` |
| ckm:banner-design | "Design banners for social media, ads, website heroes, creative assets, and print. Multiple art direction options with AI-generated visuals. Actions: design, create, generate banner. Platforms: Facebook, Twitter/X, LinkedIn, YouTube, Instagram, Google Display, website hero, print. Styles: minimalist, gradient, bold typography, photo-based, illustrated, geometric, retro, glassmorphism, 3D, neon, duotone, editorial, collage. Uses ui-ux-pro-max, frontend-design, ai-artist, ai-multimodal skills." | `.claude/skills/banner-design/SKILL.md` |
| barba-js | Page transitions library for creating fluid, smooth transitions between website pages. Use this skill when implementing page transitions, creating SPA-like experiences, adding animated route changes, or building websites with smooth navigation. Triggers on tasks involving Barba.js, page transitions, routing, view management, transition hooks, GSAP integration, or smooth page navigation. Works with gsap-scrolltrigger for transition animations. | `.claude/skills/barba-js/SKILL.md` |
| blender-web-pipeline | Blender to web export workflows for 3D models and animations. Use this skill when exporting Blender models to glTF for web, optimizing 3D assets for Three.js or Babylon.js, batch processing models with Python scripts, automating Blender workflows, or creating web-ready 3D pipelines. Triggers on tasks involving Blender glTF export, bpy scripting, 3D asset optimization, model compression, texture baking, or Blender automation. Exports models for threejs-webgl, react-three-fiber, and babylonjs-engine skills. | `.claude/skills/blender-web-pipeline/SKILL.md` |
| ckm:brand | Brand voice, visual identity, messaging frameworks, asset management, brand consistency. Activate for branded content, tone of voice, marketing assets, brand compliance, style guides. | `.claude/skills/brand/SKILL.md` |
| card-sort-analysis | Analyze card sorting results to inform information architecture and navigation structure. Use after conducting open or closed card sort studies. | `.claude/skills/card-sort-analysis/SKILL.md` |
| case-study | Craft portfolio-ready case studies that tell the story of a design project. | `.claude/skills/case-study/SKILL.md` |
| click-test-plan | Design click/first-click tests to evaluate navigation and information findability. | `.claude/skills/click-test-plan/SKILL.md` |
| color-system | Build a comprehensive color system with palette generation, semantic mapping, and accessibility compliance. | `.claude/skills/color-system/SKILL.md` |
| competitive-analysis | Conduct a structured competitive analysis comparing UX patterns, features, strengths, and gaps across rival products. | `.claude/skills/competitive-analysis/SKILL.md` |
| component-spec | Write a detailed component specification including props, states, variants, accessibility requirements, and usage guidelines. | `.claude/skills/component-spec/SKILL.md` |
| dark-mode-design | Design effective dark mode interfaces with proper color adaptation, contrast, and elevation. | `.claude/skills/dark-mode-design/SKILL.md` |
| data-visualization | Design clear, accessible data visualizations with appropriate chart selection and styling. | `.claude/skills/data-visualization/SKILL.md` |
| ckm:design | "Comprehensive design skill: brand identity, design tokens, UI styling, logo generation (55 styles, Gemini AI), corporate identity program (50 deliverables, CIP mockups), HTML presentations (Chart.js), banner design (22 styles, social/ads/web/print), icon design (15 styles, SVG, Gemini 3.1 Pro), social photos (HTML→screenshot, multi-platform). Actions: design logo, create CIP, generate mockups, build slides, design banner, generate icon, create social photos, social media images, brand identity, design system. Platforms: Facebook, Twitter, LinkedIn, YouTube, Instagram, Pinterest, TikTok, Threads, Google Ads." | `.claude/skills/design/SKILL.md` |
| design-brief | Write a comprehensive design brief that defines the problem space, constraints, audience, and success criteria. | `.claude/skills/design-brief/SKILL.md` |
| design-critique | Facilitate structured design critiques with clear feedback frameworks and actionable outcomes. | `.claude/skills/design-critique/SKILL.md` |
| design-principles | Define a set of actionable design principles that guide decision-making and resolve trade-offs. | `.claude/skills/design-principles/SKILL.md` |
| design-qa-checklist | Create QA checklists for verifying design implementation accuracy. | `.claude/skills/design-qa-checklist/SKILL.md` |
| design-rationale | Write clear design rationale connecting decisions to user needs, business goals, and principles. | `.claude/skills/design-rationale/SKILL.md` |
| design-review-process | Establish design review gates with criteria, checklists, and approval workflows. | `.claude/skills/design-review-process/SKILL.md` |
| design-sprint-plan | Plan and facilitate design sprints from challenge framing through prototype testing. | `.claude/skills/design-sprint-plan/SKILL.md` |
| ckm:design-system | Token architecture, component specifications, and slide generation. Three-layer tokens (primitive→semantic→component), CSS variables, spacing/typography scales, component specs, strategic slide creation. Use for design tokens, systematic design, brand-compliant presentations. | `.claude/skills/design-system/SKILL.md` |
| design-system-adoption | Create adoption strategies and materials to drive design system usage across teams. | `.claude/skills/design-system-adoption/SKILL.md` |
| design-token | Define and organize design tokens (color, spacing, typography, elevation) with naming conventions and usage guidance. | `.claude/skills/design-token/SKILL.md` |
| design-token-audit | Audit design token usage across a product for consistency and coverage. | `.claude/skills/design-token-audit/SKILL.md` |
| diary-study-plan | Design a diary study plan with prompts, duration, participant criteria, and analysis framework. Use when you need to understand user behavior over time in natural contexts. | `.claude/skills/diary-study-plan/SKILL.md` |
| documentation-template | Generate structured documentation templates for components, patterns, or guidelines within a design system. | `.claude/skills/documentation-template/SKILL.md` |
| empathy-map | Build a 4-quadrant empathy map (Says, Thinks, Does, Feels) to synthesize user research into actionable insights. Use when you need to quickly capture and share user understanding across the team. | `.claude/skills/empathy-map/SKILL.md` |
| error-handling-ux | Design error prevention, detection, and recovery experiences. | `.claude/skills/error-handling-ux/SKILL.md` |
| experience-map | Create a holistic experience map showing the full ecosystem of user touchpoints, channels, and relationships. | `.claude/skills/experience-map/SKILL.md` |
| feedback-patterns | Design system feedback for user actions including confirmations, status updates, and notifications. | `.claude/skills/feedback-patterns/SKILL.md` |
| gesture-patterns | Design gesture-based interactions for touch and pointer devices. | `.claude/skills/gesture-patterns/SKILL.md` |
| gsap-scrolltrigger | Comprehensive skill for GSAP (GreenSock Animation Platform) and ScrollTrigger plugin. Use this skill when creating web animations, scroll-driven experiences, timelines, tweens, scroll-triggered animations, pinning, scrubbing, parallax effects, or animating DOM elements, SVG, Canvas, WebGL, or Three.js. Triggers on tasks involving GSAP, ScrollTrigger, smooth animations, scroll effects, or animation sequencing. | `.claude/skills/gsap-scrolltrigger/SKILL.md` |
| handoff-spec | Create developer handoff specifications with measurements, behaviors, assets, and edge cases. | `.claude/skills/handoff-spec/SKILL.md` |
| heuristic-evaluation | Conduct expert heuristic evaluations using Nielsen's heuristics and domain-specific criteria. | `.claude/skills/heuristic-evaluation/SKILL.md` |
| icon-system | Create an icon system specification covering grid, sizing, naming, categories, and implementation guidance. | `.claude/skills/icon-system/SKILL.md` |
| illustration-style | Define an illustration style guide with visual language, color usage, and application rules. | `.claude/skills/illustration-style/SKILL.md` |
| impeccable | Use when the user wants to design, redesign, shape, critique, audit, polish, clarify, distill, harden, optimize, adapt, animate, colorize, extract, or otherwise improve a frontend interface. Covers websites, landing pages, dashboards, product UI, app shells, components, forms, settings, onboarding, and empty states. Handles UX review, visual hierarchy, information architecture, cognitive load, accessibility, performance, responsive behavior, theming, anti-patterns, typography, fonts, spacing, layout, alignment, color, motion, micro-interactions, UX copy, error states, edge cases, i18n, and reusable design systems or tokens. Also use for bland designs that need to become bolder or more delightful, loud designs that should become quieter, live browser iteration on UI elements, or ambitious visual effects that should feel technically extraordinary. Not for backend-only or non-UI tasks. | `.claude/skills/impeccable/SKILL.md` |
| interview-script | Create a structured user interview script with warm-up, core exploration, and wrap-up sections. Use when preparing for user research interviews to ensure consistent, insightful conversations. | `.claude/skills/interview-script/SKILL.md` |
| jobs-to-be-done | Map user Jobs-to-Be-Done with functional, emotional, and social dimensions plus outcome expectations. Use when reframing product decisions around user motivations rather than features. | `.claude/skills/jobs-to-be-done/SKILL.md` |
| journey-map | Create an end-to-end user journey map with stages, touchpoints, emotions, pain points, and opportunity areas. Use when mapping the full user experience for a product, feature, or service. | `.claude/skills/journey-map/SKILL.md` |
| layout-grid | Define responsive layout grid systems with columns, gutters, margins, and breakpoint behavior. | `.claude/skills/layout-grid/SKILL.md` |
| lightweight-3d-effects | Lightweight 3D effects for decorative elements and micro-interactions using Zdog, Vanta.js, and Vanilla-Tilt.js. Use this skill when adding pseudo-3D illustrations, animated backgrounds, parallax tilt effects, decorative 3D elements, or subtle depth effects without heavy frameworks. Triggers on tasks involving Zdog pseudo-3D, Vanta.js backgrounds, Vanilla-Tilt parallax, card tilt effects, hero section animations, or lightweight landing page visuals. Ideal for performance-focused designs. | `.claude/skills/lightweight-3d-effects/SKILL.md` |
| loading-states | Design loading, skeleton, and progressive content reveal patterns. | `.claude/skills/loading-states/SKILL.md` |
| locomotive-scroll | Comprehensive skill for Locomotive Scroll smooth scrolling library with parallax effects, viewport detection, and scroll-driven animations. Use this skill when implementing smooth scrolling experiences, creating parallax effects, building scroll-triggered animations, or developing immersive scrolling websites. Triggers on tasks involving Locomotive Scroll, smooth scrolling, parallax, scroll detection, scroll events, sticky elements, horizontal scrolling, or GSAP ScrollTrigger integration. Integrates with GSAP for advanced scroll-driven animations. | `.claude/skills/locomotive-scroll/SKILL.md` |
| lottie-animations | After Effects animation rendering for web and React applications. Use this skill when implementing Lottie animations, JSON vector animations, interactive animated icons, micro-interactions, or loading animations. Triggers on tasks involving Lottie, lottie-web, lottie-react, dotLottie, After Effects JSON export, bodymovin, animated SVG alternatives, or designer-created animations. Complements GSAP ScrollTrigger and Framer Motion for scroll-driven and interactive animations. | `.claude/skills/lottie-animations/SKILL.md` |
| metrics-definition | Define UX metrics and KPIs that connect design decisions to measurable business and user outcomes. | `.claude/skills/metrics-definition/SKILL.md` |
| micro-interaction-spec | Specify micro-interactions with trigger, rules, feedback, and loop/mode definitions. | `.claude/skills/micro-interaction-spec/SKILL.md` |
| modern-web-design | Modern web design trends, principles, and implementation patterns for 2024-2025. Use this skill when designing websites, creating interactive experiences, implementing design systems, ensuring accessibility, or building performance-first interfaces. Triggers on tasks involving modern design trends, micro-interactions, scrollytelling, bold minimalism, cursor UX, glassmorphism, accessibility compliance, performance optimization, or design system architecture. References animation skills (GSAP, Framer Motion, React Spring), 3D skills (Three.js, R3F, Babylon.js), and component libraries for implementation guidance. | `.claude/skills/modern-web-design/SKILL.md` |
| motion-framer | Modern animation library for React and JavaScript. Create smooth, production-ready animations with motion components, variants, gestures (hover/tap/drag), layout animations, AnimatePresence exit animations, spring physics, and scroll-based effects. Use when building interactive UI components, micro-interactions, page transitions, or complex animation sequences. | `.claude/skills/motion-framer/SKILL.md` |
| naming-convention | Establish a naming convention system for design elements, components, and tokens with clear rules and examples. | `.claude/skills/naming-convention/SKILL.md` |
| north-star-vision | Articulate a compelling north-star product vision that aligns teams and inspires strategic design decisions. | `.claude/skills/north-star-vision/SKILL.md` |
| opportunity-framework | Identify, evaluate, and prioritize design opportunities using impact-effort frameworks and strategic criteria. | `.claude/skills/opportunity-framework/SKILL.md` |
| pattern-library | Structure a pattern library entry with problem context, solution pattern, usage examples, and related patterns. | `.claude/skills/pattern-library/SKILL.md` |
| pixijs-2d | Fast, lightweight 2D rendering engine for creating interactive graphics, particle effects, and canvas-based applications using WebGL/WebGPU. Use this skill when building 2D games, particle systems, interactive canvases, sprite animations, or UI overlays on 3D scenes. Triggers on tasks involving PixiJS, 2D rendering, sprite sheets, particle effects, filters, or high-performance canvas graphics. Alternative to Canvas2D with WebGL acceleration for rendering thousands of sprites at 60 FPS. | `.claude/skills/pixijs-2d/SKILL.md` |
| playcanvas-engine | Lightweight WebGL/WebGPU game engine with entity-component architecture and visual editor integration. Use this skill when building browser-based games, interactive 3D applications, or performance-critical web experiences. Triggers on tasks involving PlayCanvas, entity-component systems, game engine development, WebGL games, 3D browser applications, editor-first workflows, or real-time 3D rendering. Alternative to Three.js with game-specific features and integrated development environment. | `.claude/skills/playcanvas-engine/SKILL.md` |
| presentation-deck | Structure compelling design presentations for stakeholders, reviews, and showcases. | `.claude/skills/presentation-deck/SKILL.md` |
| prototype-strategy | Choose the right prototyping fidelity and method for the design question. | `.claude/skills/prototype-strategy/SKILL.md` |
| react-spring-physics | Physics-based animation library combining React Spring (spring dynamics, gesture integration, 60fps animations) and Popmotion (low-level composable animation utilities, reactive streams). Use when building fluid, natural-feeling UI animations, gesture-driven interfaces, physics simulations, or spring-loaded interactions. Triggers on tasks involving React Spring hooks, spring physics, inertia scrolling, physics-based motion, animation composition, or natural UI movements. Alternative physics approach to motion-framer for more physically accurate animations. | `.claude/skills/react-spring-physics/SKILL.md` |
| react-three-fiber | Build declarative 3D scenes with React Three Fiber (R3F) - a React renderer for Three.js. Use when building interactive 3D experiences in React applications with component-based architecture, state management, and reusable abstractions. Ideal for product configurators, portfolios, games, data visualization, and immersive web experiences. | `.claude/skills/react-three-fiber/SKILL.md` |
| responsive-design | Design adaptive layouts and interactions that work across all screen sizes and input methods. | `.claude/skills/responsive-design/SKILL.md` |
| rive-interactive | State machine-based vector animation with runtime interactivity and web integration. Use this skill when creating interactive animations, state-driven UI, animated components with logic, or designer-created animations with runtime control. Triggers on tasks involving Rive, state machines, interactive vector animations, animation with input handling, ViewModel data binding, or React Rive integration. Alternative to Lottie for animations requiring state machines and two-way interactivity. | `.claude/skills/rive-interactive/SKILL.md` |
| scroll-reveal-libraries | Simple scroll-triggered reveal animations using AOS (Animate On Scroll). Use this skill when building marketing pages, landing pages, or content-heavy sites requiring basic fade/slide effects without complex animation orchestration. Triggers on tasks involving scroll animations, scroll-triggered reveals, AOS, simple animations, or basic scroll effects. Alternative to GSAP ScrollTrigger and Locomotive Scroll for simpler use cases. Compare with motion-framer for React-specific animations. | `.claude/skills/scroll-reveal-libraries/SKILL.md` |
| ckm:slides | Create strategic HTML presentations with Chart.js, design tokens, responsive layouts, copywriting formulas, and contextual slide strategies. | `.claude/skills/slides/SKILL.md` |
| spacing-system | Create a consistent spacing system based on a base unit with contextual application rules. | `.claude/skills/spacing-system/SKILL.md` |
| spline-interactive | Browser-based 3D design tool with visual editor, animation, and web export. Use this skill when creating 3D scenes without code, designing interactive web experiences, prototyping 3D UI, exporting to React/web, or building designer-friendly 3D content. Triggers on tasks involving Spline, no-code 3D, visual 3D editor, 3D animation, state-based interactions, React Spline integration, or scene export. Alternative to Three.js for designers who prefer visual tools over code. | `.claude/skills/spline-interactive/SKILL.md` |
| stakeholder-alignment | Create stakeholder alignment artifacts including responsibility matrices, decision frameworks, and communication plans. | `.claude/skills/stakeholder-alignment/SKILL.md` |
| state-machine | Model complex UI behavior as finite state machines with states, events, and transitions. | `.claude/skills/state-machine/SKILL.md` |
| substance-3d-texturing | Comprehensive skill for Adobe Substance 3D Painter texturing and material creation workflow. Use this skill when creating PBR materials, exporting textures for web/game engines, optimizing 3D assets for real-time rendering, or automating texture workflows. Triggers on tasks involving Substance 3D Painter, PBR texturing, material creation, texture export for Three.js, Babylon.js, Unity, Unreal, glTF optimization, or Python API automation. Creates optimized textures for threejs-webgl, react-three-fiber, and babylonjs-engine materials. | `.claude/skills/substance-3d-texturing/SKILL.md` |
| summarize-interview | Summarize a user interview transcript into structured insights with key themes, quotes, and action items. Use after conducting user interviews to extract and share findings efficiently. | `.claude/skills/summarize-interview/SKILL.md` |
| team-workflow | Design team workflows covering task management, collaboration rituals, and tooling. | `.claude/skills/team-workflow/SKILL.md` |
| test-scenario | Write usability test scenarios with tasks, success criteria, and observation guides. | `.claude/skills/test-scenario/SKILL.md` |
| theming-system | Design a theming architecture that supports brand variants, dark mode, and high-contrast modes with token mapping. | `.claude/skills/theming-system/SKILL.md` |
| threejs-webgl | Comprehensive skill for Three.js 3D web development. Use this skill when building interactive 3D scenes, WebGL/WebGPU applications, product configurators, 3D visualizations, or immersive web experiences. Triggers on tasks involving Three.js, 3D rendering, scenes, cameras, meshes, materials, lights, animations, textures, or WebGL/WebGPU rendering. | `.claude/skills/threejs-webgl/SKILL.md` |
| typography-scale | Create a modular typography scale with size, weight, and line-height relationships. | `.claude/skills/typography-scale/SKILL.md` |
| ckm:ui-styling | Create beautiful, accessible user interfaces with shadcn/ui components (built on Radix UI + Tailwind), Tailwind CSS utility-first styling, and canvas-based visual designs. Use when building user interfaces, implementing design systems, creating responsive layouts, adding accessible components (dialogs, dropdowns, forms, tables), customizing themes and colors, implementing dark mode, generating visual designs and posters, or establishing consistent styling patterns across applications. | `.claude/skills/ui-styling/SKILL.md` |
| ui-ux-pro-max | "UI/UX design intelligence for web and mobile. Includes 50+ styles, 161 color palettes, 57 font pairings, 161 product types, 99 UX guidelines, and 25 chart types across 10 stacks (React, Next.js, Vue, Svelte, SwiftUI, React Native, Flutter, Tailwind, shadcn/ui, and HTML/CSS). Actions: plan, build, create, design, implement, review, fix, improve, optimize, enhance, refactor, and check UI/UX code. Projects: website, landing page, dashboard, admin panel, e-commerce, SaaS, portfolio, blog, and mobile app. Elements: button, modal, navbar, sidebar, card, table, form, and chart. Styles: glassmorphism, claymorphism, minimalism, brutalism, neumorphism, bento grid, dark mode, responsive, skeuomorphism, and flat design. Topics: color systems, accessibility, animation, layout, typography, font pairing, spacing, interaction states, shadow, and gradient. Integrations: shadcn/ui MCP for component search and examples." | `.claude/skills/ui-ux-pro-max/SKILL.md` |
| usability-test-plan | Design a usability test plan with tasks, success metrics, participant criteria, and facilitation guide. Use when planning moderated or unmoderated usability testing sessions. | `.claude/skills/usability-test-plan/SKILL.md` |
| user-flow-diagram | Create user flow diagrams showing paths, decisions, and branch logic. | `.claude/skills/user-flow-diagram/SKILL.md` |
| user-persona | Create refined user personas from research data with demographics, goals, frustrations, and behavioral patterns. Use when synthesizing user research into actionable persona profiles for design decisions. | `.claude/skills/user-persona/SKILL.md` |
| ux-writing | Write effective UI copy including microcopy, error messages, empty states, and CTAs. | `.claude/skills/ux-writing/SKILL.md` |
| version-control-strategy | Define version control strategies for design files, components, and libraries. | `.claude/skills/version-control-strategy/SKILL.md` |
| visual-hierarchy | Establish clear visual hierarchy through size, weight, color, spacing, and positioning. | `.claude/skills/visual-hierarchy/SKILL.md` |
| web3d-integration-patterns | Meta-skill for combining Three.js, GSAP ScrollTrigger, React Three Fiber, Motion, and React Spring for complex 3D web experiences. Use when building applications that integrate multiple 3D and animation libraries, requiring architecture patterns, state management, and performance optimization across the stack. Triggers on tasks involving library integration, multi-library architectures, scroll-driven 3D experiences, physics-based 3D animations, or complex interactive 3D applications. | `.claude/skills/web3d-integration-patterns/SKILL.md` |
| wireframe-spec | Specify wireframe layouts with content priority, component placement, and annotation. | `.claude/skills/wireframe-spec/SKILL.md` |
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
