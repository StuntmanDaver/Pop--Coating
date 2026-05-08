# Phase 1 Success Walkthrough Harness

Use this checklist after the automated gate in `docs/runbooks/phase-1-production-readiness.md`. Do not record cookie values, access tokens, magic-link URLs, passwords, or raw workstation enrollment tokens in notes.

## Automated Coverage

| Criterion | Harness | Credential Gate |
| --- | --- | --- |
| Local dev and app shell render | `pnpm type-check`, `pnpm lint`, `pnpm test`, `pnpm build` | None |
| Office staff sign-in and reload persistence | `src/modules/auth/actions/sign-in.test.ts`; `tests/e2e/phase1-auth-smoke.spec.ts` verifies the office host renders the password form; credentialed smoke verifies dashboard access and reload persistence | Host-form smoke has no credential gate; dashboard smoke requires `E2E_STAFF_EMAIL`, `E2E_STAFF_PASSWORD` |
| Workstation auth and office-shell denial | `src/modules/settings/actions/workstation.test.ts`; `src/modules/scanning/actions/workstation-lifecycle.test.ts`; `supabase/tests/rls/test_function_authorization.sql`; `tests/e2e/phase1-auth-smoke.spec.ts` | Optional `E2E_WORKSTATION_EMAIL`, `E2E_WORKSTATION_PASSWORD`; dashboard JWT expiry check remains manual |
| Customer magic-link request and portal boundary | `src/modules/auth/actions/magic-link.test.ts`; `src/modules/portal/queries/portal.test.ts`; `tests/e2e/phase1-auth-smoke.spec.ts` verifies the portal host renders only the magic-link form and no office password controls | Portal form render runs without customer secrets; POST smoke is registered only when `E2E_RUN_MAGIC_LINK_POST=true`; real email receipt remains manual |
| RLS tenant denial | `supabase/tests/rls/test_cross_tenant_isolation.sql`; `supabase/tests/rls/test_audience_isolation.sql`; `supabase/tests/rls/test_authenticated_no_tenant_denial.sql` | Supabase test database |

Run:

```bash
pnpm type-check
pnpm lint
pnpm test
pnpm build
supabase test db
pnpm test:e2e
```

Run `pnpm test:e2e` only when the required staff E2E credentials and public Supabase env vars are configured. The workstation E2E smoke is registered only when its dedicated workstation credentials are configured. The portal POST smoke is registered only when `E2E_RUN_MAGIC_LINK_POST=true`.

## Manual-Only Proof Points

These checks need dashboard access, production DNS/email delivery, or one-time session material. They are not fully automated by the harness. Record only PASS/FAIL, hostnames, timestamps, and approved non-secret IDs.

- Supabase Authentication JWT expiry, Custom Access Token Hook registration, and Custom SMTP status.
- Resend/DNS DKIM, SPF, and MX verification for `popsindustrial.com`.
- Vercel domain attachment and TLS status for `app.popsindustrial.com` and `track.popsindustrial.com`.
- Real customer magic-link delivery and link-open flow, because the email link is sensitive session material.
- Browser cookie host scope for staff and customer sessions. Record cookie names, domain, path, `HttpOnly`, `Secure`, and `SameSite` only; never record values.
- JWT claim presence for office, workstation, and customer users. Record whether required `app_metadata` keys exist; do not paste JWTs or refresh tokens.
- Workstation admin QR enrollment ceremony. Synthetic workstation credentials can smoke-test auth, but the production QR token must not be recorded in docs, tickets, terminal output, or chat.
- Live RLS spot check against production. Use an approved SQL console/session, avoid exporting result sets, and record only row counts.

## Manual Checklist

- [ ] Supabase Dashboard: Authentication JWT expiry is `3600` seconds.
- [ ] Supabase Dashboard: Custom Access Token Hook is registered to `app.custom_access_token_hook`.
- [ ] Supabase Dashboard: Custom SMTP through Resend is active.
- [ ] Resend/DNS: DKIM, SPF, and MX pass for `popsindustrial.com`.
- [ ] Vercel: `app.popsindustrial.com` and `track.popsindustrial.com` are attached to the production project and TLS is healthy.
- [ ] Office sign-in: owner can sign in at `https://app.popsindustrial.com/sign-in`, reaches Dashboard, refreshes without returning to sign-in, and the Supabase cookie is host-scoped to `app.popsindustrial.com`.
- [ ] Office claims: `supabase.auth.getUser()` returns `app_metadata.tenant_id`, `audience = staff_office`, `role`, and `staff_id`. Record only PASS/FAIL and IDs already approved for planning notes.
- [ ] Workstation auth: a seeded or newly created synthetic workstation user authenticates, has `app_metadata.audience = staff_shop` and `workstation_id`, can reach the scan surface, and cannot reach the office Dashboard.
- [ ] Workstation TTL: JWT expiry verification still reports `3600`; record that workstation TTL is active and office/customer felt sessions rely on refresh-token rotation.
- [ ] Customer magic link: a provisioned customer receives the email, opens the link, lands on `track.popsindustrial.com`, and the Supabase cookie is host-scoped to `track.popsindustrial.com`.
- [ ] Portal claims: the customer JWT has `app_metadata.tenant_id`, `audience = customer`, `company_id`, and `customer_user_id`.
- [ ] Portal boundary: staff or workstation session material copied to `track.popsindustrial.com` redirects back to the app host; customer session material copied to `app.popsindustrial.com` redirects back to the portal host.
- [ ] RLS live smoke: with `SET ROLE authenticated` and no `request.jwt.claims`, unfiltered `SELECT count(*)` on tenant-scoped business tables returns `0`.

## Notes Template

```text
Phase 1 walkthrough date:
Environment:
Production deploy:
Supabase project ref:

Criterion 1 local dev:
Criterion 2 office auth:
Criterion 3 workstation auth:
Criterion 4 customer portal:
Criterion 5 RLS tenant denial:

Dashboard-only checks:
Deferred follow-ups:
```
