# Phase 1: Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-29
**Phase:** 1-Foundation
**Areas discussed:** Resend + Auth email routing, Phase 1 workstation scope, Branch DB + CI setup, Tenant 1 bootstrap scope

---

## Resend + Auth Email Routing

### Should Supabase Auth emails route through Resend SMTP from Phase 1?

| Option | Description | Selected |
|--------|-------------|----------|
| Resend SMTP from day 1 | Supabase Auth routes magic links/invites through Resend; from noreply@popsindustrial.com; SPF/DKIM/DMARC from day 1 | ✓ |
| Supabase built-in for auth only | Two email systems temporarily; auth uses Supabase native, Resend for custom transactionals | |
| You decide | Claude picks most production-appropriate option | |

**User's choice:** Resend SMTP from day 1

### What from-address for Supabase Auth emails?

| Option | Description | Selected |
|--------|-------------|----------|
| noreply@popsindustrial.com | Standard no-reply; simple SPF/DKIM; customers see shop domain | ✓ |
| hello@popsindustrial.com | Friendlier sender; requires mailbox/catch-all for replies | |
| You decide | Claude picks conventional B2B option | |

**User's choice:** noreply@popsindustrial.com

### Resend API key environment strategy?

| Option | Description | Selected |
|--------|-------------|----------|
| Single key, all envs | One Resend project/key for local + preview + production; simplest | ✓ |
| Separate keys per env | Test key for local/preview (no real emails); live key for prod; more isolated | |
| You decide | Claude picks for Phase 1 simplicity | |

**User's choice:** Single Resend API key, all environments

---

## Phase 1 Workstation Scope

### What does Phase 1 deliver for AUTH-02 (workstation enrollment)?

| Option | Description | Selected |
|--------|-------------|----------|
| DB schema + RPCs + createWorkstation action | Tables + SECURITY DEFINER functions + server action that creates synthetic user and returns enrollment token; success criterion testable via script | ✓ |
| DB schema + RPCs only | Tables and functions only; createWorkstation and enrollment QR deferred to Phase 3 | |
| You decide | Claude picks based on verifiability of success criterion | |

**User's choice:** DB schema + RPCs + createWorkstation server action

### How does the workstation session refresh on 1-hour token expiry?

| Option | Description | Selected |
|--------|-------------|----------|
| Silent refresh via @supabase/ssr | Near-expiry auto-detected; refresh token used silently; no UI interruption | ✓ |
| Force re-enroll on expiry | Tablet shows enrollment screen; requires admin intervention | |
| You decide | Claude picks to keep shop floor running | |

**User's choice:** Silent refresh (matches CLAUDE.md "tablet re-authenticates silently")

### Is PIN idle timeout (4-hour) a Phase 1 concern?

| Option | Description | Selected |
|--------|-------------|----------|
| Phase 3 — PIN logic lives with scanner UI | Phase 1 builds workstation JWT/session; PIN state belongs with scan event attribution | ✓ |
| Phase 1 — implement idle timeout now | Session-within-session logic in Phase 1 even without UI | |
| You decide | Claude picks cleaner architectural split | |

**User's choice:** Phase 3 — PIN logic belongs with scanner UI

---

## Branch DB + CI Setup

### Should Phase 1 set up Supabase branch databases for PR CI?

| Option | Description | Selected |
|--------|-------------|----------|
| Branch DBs from Phase 1 | Every PR gets isolated Supabase branch DB; tests run against real Supabase Auth + RLS + SECURITY DEFINER | ✓ |
| Start with local Postgres in CI | GitHub Actions runs supabase start; no branch billing; only Postgres layer available in CI | |
| You decide | Claude picks for auth + RLS confidence | |

**User's choice:** Branch databases from Phase 1

### Which tests are required CI merge gates?

| Option | Description | Selected |
|--------|-------------|----------|
| TypeScript strict type-check | pnpm type-check; non-negotiable INFRA-07 requirement | ✓ |
| ESLint + madge circular check | pnpm lint + madge --circular src/modules; enforces module boundaries | ✓ |
| Vitest unit tests | pnpm test; covers auth helpers, RLS helper functions, pure logic | ✓ |
| pgTAP RLS tests in CI | Full RLS suite against branch DB; formally OPS-02 (Phase 4) but started in Phase 1 | ✓ |

**User's choice:** All four (TypeScript + ESLint/madge + Vitest + pgTAP)

### Should Playwright E2E run in Phase 1 CI?

| Option | Description | Selected |
|--------|-------------|----------|
| Phase 2+ for E2E | No E2E in Phase 1; add when CRM pages exist in Phase 2 | ✓ |
| Phase 1 includes basic E2E | Auth flow E2E (sign-in, magic link, enrollment) from Phase 1 | |
| You decide | Claude picks useful signal without over-investing | |

**User's choice:** Phase 2+ for Playwright E2E

---

## Tenant 1 Bootstrap Scope

### Should seed-tenant.ts be run as a Phase 1 deliverable?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — Phase 1 includes the seed run | Write AND run; creates Tenant 1 (Pops) with real admin in Supabase Cloud; success criteria verifiable against live data | ✓ |
| No — script written but not run | Manual pre-flight step; Phase 1 criteria verified against local supabase/seed.sql only | |
| You decide | Claude picks based on verifiable completion | |

**User's choice:** Phase 1 writes and runs seed-tenant.ts

### What should supabase/seed.sql include?

| Option | Description | Selected |
|--------|-------------|----------|
| 1 test tenant (fixed UUID) | Known UUID for test constants; required for any auth test | ✓ |
| 1 test office staff user | auth.users + staff row, audience=office; enables local office sign-in testing | ✓ |
| 1 test workstation row | Synthetic auth user + workstations row; enables local scanner auth testing | ✓ |
| Sample companies/contacts/jobs | Visual testing fixture data; unused in Phase 1 but available for Phase 2+ | ✓ |

**User's choice:** All four (tenant + office staff + workstation + sample business data)

### How does the first admin get credentials after seed-tenant.ts runs?

| Option | Description | Selected |
|--------|-------------|----------|
| Supabase inviteUserByEmail | auth.admin.inviteUserByEmail; admin receives invite via Resend; sets password on first sign-in | ✓ |
| Create user with known password | Direct admin API; dev password from env var; simpler but less production-appropriate | |
| You decide | Claude picks most secure approach | |

**User's choice:** Supabase inviteUserByEmail (requires Resend configured first)

---

## Claude's Discretion

No areas were deferred to Claude — all gray areas were answered explicitly by the user.

## Deferred Ideas

None raised during discussion. All topics stayed within Phase 1 scope.
