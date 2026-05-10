# Deploy And Rollback Runbook

## Deploy

- Confirm the readiness checklist in `docs/runbooks/phase-1-production-readiness.md`.
- Merge only after CI passes: type-check, lint, Vitest, pgTAP, and E2E when credentials are configured.
- Verify the production Vercel deployment serves both `app.popsindustrial.com` and `track.popsindustrial.com`.
- Smoke test staff sign-in, customer magic-link request, job creation, packet PDF generation, scanner lookup, and portal job detail.

## Rollback

- In Vercel, promote the previous known-good production deployment.
- If the deploy included migrations, do not rollback the database blindly. Follow `docs/DESIGN.md` disaster-recovery guidance and create a forward fix unless a restore drill is explicitly approved.
- Confirm Sentry error volume returns to baseline.
- Record the incident, root cause, rollback deployment id, and follow-up owner in the project log.

## Production Support Window

- Keep an operator available during the first half-day of production use.
- Watch Sentry, Vercel runtime logs, Supabase Auth logs, and Resend delivery events.
- If scanner failures exceed the Wave 1 threshold, switch staff to manual packet entry while the issue is triaged.
