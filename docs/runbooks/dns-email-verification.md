# DNS And Email Verification Runbook

Status as of 2026-05-20: registrar access is still the blocking production action. Vercel domains are attached but public DNS for `app.popsindustrial.com` and `track.popsindustrial.com` returns no records from this shell. Resend verification and Supabase custom SMTP remain deferred until the exact DNS records from the Resend dashboard are added and verified.

## Domains

Canonical production domain: `popsindustrial.com`.

- `app.popsindustrial.com` must point at Vercel and show a valid certificate before sign-off.
- `track.popsindustrial.com` must point at Vercel and show a valid certificate before sign-off.
- Stale or mistaken `popscoating.com` aliases and DNS records are removal-only; do not add them as active app, portal, or sender domains.

Current public DNS observation from 2026-05-20:

- `dig +short app.popsindustrial.com` returned no records.
- `dig +short track.popsindustrial.com` returned no records.
- `dig +short TXT popsindustrial.com` returned existing Microsoft/SparkPost-style records, not Resend DKIM verification records.
- `dig +short MX popsindustrial.com` returned Microsoft mail routing, not a Resend return-path MX.

### Tomorrow Registrar Checklist

Use the registrar/DNS provider for `popsindustrial.com`. Copy exact values from the service dashboards when they differ from the examples below.

#### Vercel App Domains

Before adding records, inspect each domain in Vercel and use the exact required target shown there. Vercel's current public guidance says subdomains use a CNAME, with a general-purpose target such as `cname.vercel-dns-0.com`.

| Host/name | Type | Value/target | Priority | Purpose |
| --- | --- | --- | --- | --- |
| `app` | `CNAME` | Vercel-provided CNAME target for `app.popsindustrial.com` | n/a | Staff app and scanner |
| `track` | `CNAME` | Vercel-provided CNAME target for `track.popsindustrial.com` | n/a | Customer portal |

After saving:

1. Wait for DNS propagation.
2. In Vercel → `pops--coating` → Domains, click Refresh for `app.popsindustrial.com` and `track.popsindustrial.com`.
3. Confirm both show valid DNS and healthy TLS/certificate status.
4. Only after both canonical domains are valid, remove stale `app.popscoating.com` and `track.popscoating.com` from the Vercel project and registrar if present.

## Resend

The Resend dashboard is the source of truth for exact record values. Do not infer or hand-type long DKIM values from screenshots.

| Host/name | Type | Value/target | Priority | Purpose |
| --- | --- | --- | --- | --- |
| Resend DKIM host, usually `resend._domainkey` | `TXT` | Exact DKIM TXT value from Resend | n/a | Domain verification and DKIM signing |
| Resend SPF return-path host, usually `send` | `TXT` | Exact SPF TXT value from Resend | n/a | Authorize Resend/SES sender |
| Resend MX return-path host, usually `send` | `MX` | Exact MX target from Resend | Exact Resend priority | Bounce/complaint feedback |

After saving:

1. In Resend → Domains → `popsindustrial.com`, click Verify DNS Records.
2. Confirm DKIM, SPF, and MX are verified.
3. Send a test transactional email and confirm delivery headers pass SPF and DKIM.
4. Keep optional DMARC as a follow-up after DKIM/SPF pass if the client does not already have a DMARC policy.

## Supabase Auth

- Auth email templates point users back to the intended production hosts.
- Redirect allow-list includes `https://app.popsindustrial.com/**` and `https://track.popsindustrial.com/**`.
- Custom SMTP uses the Resend SMTP credential, not the Resend API key:
  - host: `smtp.resend.com`
  - port: `465`
  - username: `resend`
  - password: generated in Resend SMTP settings
  - from address: `noreply@popsindustrial.com`
- Configure SMTP only after Resend DNS verification is healthy.

## Final Verification

- `https://app.popsindustrial.com/sign-in` renders the office password form.
- `https://track.popsindustrial.com/sign-in` renders the customer magic-link form.
- Supabase Auth email links resolve to the correct canonical host.
- Do not run `pnpm seed:tenant` until DNS, SMTP, and the real owner email/name are ready.
