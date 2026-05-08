# DNS And Email Verification Runbook

## Domains

Canonical production domain: `popsindustrial.com`.

- `app.popsindustrial.com` points at Vercel and has a valid certificate.
- `track.popsindustrial.com` points at Vercel and has a valid certificate.
- Stale or mistaken `popscoating.com` aliases and DNS records are removal-only; do not add them as active app, portal, or sender domains.

## Resend

- DKIM is verified for `popsindustrial.com`.
- SPF includes the Resend-required sender.
- MX is configured if Resend requires it for the sending domain.
- Send a test transactional email and confirm delivery headers pass SPF and DKIM.

## Supabase Auth

- Auth email templates point users back to the intended production hosts.
- Redirect allow-list includes `https://app.popsindustrial.com/**` and `https://track.popsindustrial.com/**`.
