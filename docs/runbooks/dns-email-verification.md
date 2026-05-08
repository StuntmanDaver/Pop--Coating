# DNS And Email Verification Runbook

## Domains

- `app.popsindustrial.com` points at Vercel and has a valid certificate.
- `track.popsindustrial.com` points at Vercel and has a valid certificate.
- Old or mistaken `popscoating.com` records are not attached to the production Vercel project unless the user explicitly re-approves that domain.

## Resend

- DKIM is verified for `popsindustrial.com`.
- SPF includes the Resend-required sender.
- MX is configured if Resend requires it for the sending domain.
- Send a test transactional email and confirm delivery headers pass SPF and DKIM.

## Supabase Auth

- Auth email templates point users back to the intended production hosts.
- Redirect allow-list includes `https://app.popsindustrial.com/**` and `https://track.popsindustrial.com/**`.
