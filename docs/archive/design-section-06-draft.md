## 6. Operational Concerns

This section captures the operational realities that surround the codebase: hardware procurement, IT setup at Pops's facility, legal/IP considerations, disaster recovery, on-call coverage, backup strategy, bus factor mitigation, training, and maintenance windows. Each of these is load-bearing — a missed step here can sink a launch even if the code is perfect.

### 6.1 Hardware Procurement Plan

The shop floor experience depends entirely on physical iPads being where they need to be, mounted, charged, and on the network. Procurement must start early because lead times stack: order iPads, wait for delivery, order brackets, wait, install brackets, wire power/network, mount tablets, validate.

**iPad inventory**

Five production tablets are required for Wave 1, one per workstation:

- **Receiving** — used for initial intake QR generation and first scan
- **Prep** — sandblasting, masking, surface treatment
- **Coating Booth 1** — powder application
- **Curing Oven** — load/unload tracking
- **QC Inspection** — final inspection, snap photos, pass/fail

Plus **one spare** kept boxed in the office for immediate failure replacement, bringing the total to **six iPads**.

Recommended model: standard 10th-generation iPad (A14 Bionic, 64 GB, WiFi only). Cellular is unnecessary because the shop has WiFi (see 6.2). Purchase from Apple Business directly to enroll in Apple Business Manager from day one, or B&H Photo as a backup if Apple direct lead times are unacceptable. Unit cost: $400–500 each. Lead time: 1–3 business days from Apple Business, 1–2 days from B&H.

**Wall mounts and brackets**

Each tablet must be mounted in a lockable, theft-resistant bracket with a cable pass-through for power. Recommended brands:

- **Heckler Design** — premium, secure, cable management built in. ~$120 each.
- **Maclocks (Compulocks)** — solid mid-range, screw-locked enclosures. ~$80 each.
- **Generic Amazon brands** — avoid for production; use only as a temporary fallback.

Budget **$80 per mount** as the minimum viable spend; spec Heckler if Pops wants the more polished install. Lead time: 3–7 business days from Amazon, 5–10 days direct from Heckler.

**Cable runs (power and optional Ethernet)**

Each workstation needs:

- A nearby 110V outlet on a circuit that won't be killed by the booth's fan motors or oven contactors
- A USB-C power supply (use Apple's 20W minimum) wired through the bracket pass-through
- Optional: hardwired Ethernet via Lightning/USB-C-to-Ethernet adapter if WiFi survey results are marginal at any workstation

Pops's electrician handles outlet additions and conduit runs. Lead time variable — schedule during Week 1–4 so installation is complete by Week 8. Budget conservatively: **$500–1,500** depending on how many new outlets are needed.

**Procurement timeline**

| Week | Action |
| --- | --- |
| 0 | Confirm with Pops which workstations need tablets; finalize bracket selection |
| 1 | Order one development iPad (in dev's hands by Week 2) |
| 4 | Order remaining 5 production iPads + 6 brackets + cables |
| 5 | Schedule electrician work for any new outlets |
| 6 | Dev tests dev iPad with kiosk mode and PWA install — validate before bulk order works |
| 8 | Brackets and tablets on-site at Pops; electrician finishes any outlet work |
| 9–10 | Mount tablets, wire power, enroll in MDM, install PWA |
| 11 | All five production stations live for QA week |

**Procurement risks**

- Apple iPad supply can spike during product transition cycles (typically September–November). Order early.
- Brackets occasionally back-order. Have a fallback brand identified.
- If electrician is booked out, schedule the visit by Week 1 even if the work isn't until Week 8.

### 6.2 Pops's IT Setup (Hidden Dependencies)

These are not coding tasks, but they will block the launch if missed. Treat them as Week 0 deliverables.

**Identify the IT contact**

Pops likely has no dedicated IT staff. The owner is probably the de facto IT contact, possibly with an external consultant on retainer. Identify this person in **Week 0**, get them in writing as the point of contact for:

- WiFi credentials and router admin access
- DNS records (for `popscoating.com`)
- Apple ID / Apple Business Manager organizational account
- Email infrastructure decisions
- Future MDM enrollment

If the owner is the contact and is non-technical, schedule a 30-minute setup call during Week 0 to walk through what credentials we'll need.

**WiFi survey at the shop**

Coating shops are radio-hostile environments: large metal ovens, metal racks, fans, exhaust ductwork, and concrete walls all degrade 2.4 GHz and 5 GHz signal. Conduct a survey in **Week 0**:

- Walk every planned workstation with an iPhone or iPad running a WiFi analyzer (e.g., Airport Utility's scan mode, NetSpot)
- Measure RSSI; anything weaker than **-67 dBm** is marginal for sustained use
- Note dead zones; these are candidates for a wired drop or a mesh node

If signal is poor, plan a WiFi upgrade alongside the project. **Recommended: Ubiquiti UniFi** (U6-Lite or U6-Pro access points, $99–199 each) with a UDM-SE or USG router. Deploy 2–3 APs depending on shop layout. Total budget: **$500–1,200** for hardware plus a half-day install.

**iPad management (MDM)**

Production tablets must be locked down to a single PWA — they cannot be allowed to browse the open web, install apps, or be repurposed by a curious employee.

- Enroll in **Apple Business Manager** (free, requires a D-U-N-S number for the business — get it now if Pops doesn't have one)
- Choose an MDM:
  - **Apple Configurator** — free, manual, fine for 5 devices but tedious
  - **Jamf School** (free for under 100 devices) — overkill for a powder shop but offers proper Single App Mode (kiosk mode), guided access, restricted Safari
  - **Mosyle Manager** — free tier available, well-suited for small deployments
- Configure each iPad:
  - Single App Mode pinned to Safari with an allow-list for `app.popscoating.com` and `track.popscoating.com`
  - Auto-rejoin on WiFi disconnect
  - Disable AirDrop, AirPlay, screenshot sharing
  - Disable App Store, Settings access, Control Center
  - Set screen lock to "Never" while charging (iPads are perpetually plugged in)
  - Auto-launch the PWA on wake

**Email infrastructure**

Pops's owner likely uses a personal email (Comcast, Yahoo, Gmail). A `noreply@popscoating.com` sender will be flagged as phishing if the domain has no SPF/DKIM/DMARC records.

- Recommend **Google Workspace** ($6/user/mo, Business Starter) for Pops's owner and any office staff who need authoritative `@popscoating.com` addresses
- Configure SPF, DKIM, DMARC records when DNS is set up
- Resend will use the same domain for transactional sends (see 9.1 for cost)

Budget: **$12/mo** for two seats (owner + bookkeeper).

**Power management**

iPads default to sleeping after 2 minutes. In Single App Mode with Auto-Lock disabled via MDM profile, they will stay awake indefinitely as long as they're charging. Verify this works during dev iPad testing in Week 6.

Charging: leaving an iPad plugged in 24/7 is fine; iOS manages charge cycles intelligently. Battery wear over 2–3 years is acceptable for the cost.

### 6.3 Domain & Legal/IP

**Domain ownership**

In **Week 0**, verify `popscoating.com` is available or already owned by Pops. If owned by a third party (parked, cybersquatter), negotiate or pivot to an alternative (`popscoatings.com`, `popsindustrialcoatings.com`).

Subdomains:
- `app.popscoating.com` — internal staff
- `track.popscoating.com` — customer portal
- `www.popscoating.com` — marketing (out of scope)

Registrar recommendation: **Cloudflare Registrar** (at-cost pricing, ~$10/yr for `.com`, free WHOIS privacy, integrated DNS). Avoid GoDaddy.

**Ownership transfer at Wave 1 ship gate**

When Wave 1 ships, transfer:

- Domain registration → **Pops's account**
- Cloudflare DNS zone → Pops's account (or shared account with dev as collaborator)
- Apple Business Manager → **Pops's account**
- Supabase project → owned by Pops, dev added as admin collaborator
- Vercel project → owned by Pops, dev added as admin
- Resend account → Pops's account, dev added
- 1Password vault → shared between Pops and dev

This protects both sides. If the developer relationship ends, Pops keeps the system. If Pops fails to pay, the developer's leverage is the source code, not the production credentials.

**Code IP ownership (decide before Wave 1 starts)**

Three options, must be agreed in writing:

1. **Owned by Pops** — work-for-hire arrangement. Pops owns all code. Developer keeps no rights. Common for pure agency work.
2. **Owned by developer with usage license to Pops** — developer retains the code (potentially to license to other shops later) and grants Pops a perpetual, royalty-free license to use it. Most flexible if the SaaS dream is real.
3. **Open source** — released under MIT or Apache 2.0. Both parties can use freely; neither has exclusive rights.

**Recommendation**: Option 2 (developer-owned with perpetual license to Pops) if the multi-tenant SaaS path is being seriously pursued. Option 1 if Pops is paying full rate and wants exclusivity.

Document in the Master Service Agreement (MSA) — see 9.3.

**Privacy policy**

Required for the customer portal. Even at one shop, customers entering personal contact info on a website triggers privacy disclosure obligations.

- **CCPA** applies if any California residents are customers (very likely — annual revenue threshold is now low)
- **GDPR** applies if any EU customers — Pops is a single-state shop, so likely N/A, but verify
- Use a generic template (Termly, Iubenda, or a $300 lawyer review) for Wave 1
- Update for Wave 3 when payments and analytics expand the data collected

**Terms of Service**

Only required for Wave 3 if Pops will charge customers via the portal (online payment, deposits). Wave 1 has no commercial transactions through the portal, so a ToS is optional but a one-pager is still good practice.

**Customer data ownership**

The MSA must explicitly state: **all customer data entered into the system is owned by Pops, not by the developer.** The developer has no right to use, sell, or share customer data. This is non-negotiable for trust and is also the answer to any future tenant's first question when SaaS launches.

### 6.4 Disaster Recovery Runbook

A 1-page document committed to the repo at `docs/runbooks/disaster-recovery.md`. Updated after every incident or twice yearly, whichever comes first. Practiced in Week 11 dry-run before launch.

**Scenarios covered**

1. **Production database corruption or accidental destructive query**
   - Detect: Sentry alert on query failures, or Pops reporting "I can't see anything"
   - Action: Open Supabase dashboard → Database → Backups → PITR. Restore to a timestamp 5 minutes before the corruption event.
   - PITR is a Pro plan feature; window is 7 days on the base Pro tier.
   - Communicate to Pops: "Restoring database to <timestamp>. ETA: 15 minutes." After restore, verify recent jobs are intact; manually re-enter anything lost.

2. **Bad Vercel deploy (broken build, runtime errors in production)**
   - Detect: Sentry error spike, or Pops reporting "site is down"
   - Action: Vercel dashboard → Deployments → previous good deploy → "Promote to Production". Instant rollback, ~5 seconds to propagate.
   - Then debug the broken deploy in a preview branch.

3. **Resend account suspended or API key compromised**
   - Detect: emails not arriving (Sentry alert on `mail.send` failures), or Resend support email
   - Action: Switch `MAIL_PROVIDER` env var to `postmark` (pre-configured backup); rotate the Resend key in 1Password and the Vercel env. Document the suspension cause and resolve with Resend support.
   - Postmark is the recommended fallback (similar pricing, similar deliverability, fast signup).

4. **Supabase outage (regional)**
   - Detect: Supabase status page, Sentry errors on database calls
   - Action: Display global banner ("Temporary system outage — scans will be queued offline"). Tablets continue to function in offline mode (Wave 2). Office staff cannot create new jobs until restored.
   - Outages are typically <1 hour. Communicate ETA from Supabase status to Pops.

5. **Compromised admin credential**
   - Detect: unfamiliar login email from Supabase, suspicious activity in audit log
   - Action: Supabase dashboard → Authentication → revoke session for the user, force password reset. Rotate any related service-role keys. Audit recent activity. Notify all staff to re-authenticate.

6. **Lost workstation tablet**
   - Detect: Pops reports a tablet missing/stolen
   - Action: Settings → Workstations → invalidate the device's `device_token`. Create a new workstation entry for the replacement tablet. The lost device's residual session expires at next refresh (configure short refresh window for shop tokens — recommend 1 hour).
   - If theft is suspected, Apple Business Manager can issue a remote lock/wipe.

**Runbook discipline**

- Print the runbook and tape it inside Pops's office
- Rehearse each scenario in Week 11 (use test Supabase project for #1, separate Vercel branch for #2)
- After every real incident: update the runbook with what actually happened, what worked, what didn't

### 6.5 On-Call / Support Model

**Solo dev is on-call.** No way around this for the foreseeable future. Define expectations clearly to protect both sides.

**Defined hours**

- **Primary support**: 8 AM – 8 PM Eastern Time, Monday through Friday
- **Best-effort weekend coverage**: response within 4 hours during daylight hours
- **After-hours emergency**: only for "system completely down, shop cannot operate" events. Pops's owner has a "break-glass" contact (mobile number + email).

Document this in the MSA. Reset expectations: "I am one person. If you need 24/7 coverage, we need to discuss a multi-person retainer model."

**Alert routing**

- Sentry → Pushover (mobile push notifications, $5 one-time per platform) for P1 alerts
- Sentry → email for P2/P3
- Define P1: error rate spike >10x baseline, scan failure rate >5%, auth completely failing, database unavailable
- Pushover lets the dev see alerts on the watch and triage in 30 seconds

**Status page**

Not needed for Wave 1 (one shop). For Wave 2+, set up `status.popscoating.com` via a free service (BetterStack, Uptime Robot's status page). Display Supabase, Vercel, and Resend status alongside the app's own uptime.

### 6.6 Backup Strategy (Operational)

Defense in depth: never rely on a single backup mechanism.

**Layer 1: Supabase Pro automated backups**

- Daily snapshots, 7-day retention (Pro plan)
- Point-in-Time Recovery (PITR) within the 7-day window — restore to any second
- Stored in Supabase's infrastructure (us-east-2 by default)

**Layer 2: Weekly offsite backup**

- A GitHub Actions cron runs every Sunday at 03:00 UTC
- Calls `pg_dump` against the production database (using a read-only role)
- Encrypts the dump with `age` or `gpg` using a key stored in 1Password
- Uploads to **Backblaze B2** (cheaper than S3: ~$0.005/GB/mo) or **AWS S3** with lifecycle policy (Glacier after 30 days)
- Retention: 12 weekly backups + 12 monthly backups + 7 yearly backups
- Estimated storage: 50 GB at scale = ~$0.25/mo on B2

**Layer 3: Monthly restore drill**

- First Monday of each month, restore the most recent offsite backup to a temporary Supabase project
- Run a smoke-test SQL script that checks: row counts roughly correct, latest jobs present, no schema drift
- If restore fails, escalate immediately
- This catches silent backup corruption before it matters

**Layer 4: Storage backups**

- Supabase Storage holds job photos and PDFs
- Daily sync via `rclone` from Supabase Storage S3-compatible API → Backblaze B2
- Retain 90 days
- Cost: negligible at expected volume

### 6.7 Bus Factor Mitigation

Bus factor of 1 is the single largest risk in this project. Mitigations are imperfect but mandatory:

**Documentation discipline**

- This spec lives in the repo and is updated as decisions change
- Per-module READMEs in `apps/web/`, `apps/portal/`, `packages/db/`
- Disaster recovery runbook (6.4)
- Incident postmortems committed under `docs/incidents/`
- Architecture Decision Records (ADRs) committed under `docs/adr/` for any major design choice

**Shared credential vault**

- 1Password Family or Business plan ($8/mo)
- Shared vault between Pops's owner and the developer
- Contains: Supabase project credentials, Vercel team access, Resend API keys, registrar login, AWS/B2 credentials, MDM credentials, all third-party service logins
- Pops's owner has emergency access — can recover the vault even if dev disappears

**Successor-friendly code**

- TypeScript strict mode
- ESLint + Prettier enforced in CI
- Conventional commits for searchable history
- No clever tricks — boring, readable code

**Rotation drills**

- Every quarter, deliberately rotate one credential (e.g., the Resend API key) using the runbook
- Validates the runbook actually works and no hardcoded keys exist

**Open source dependencies**

- Avoid niche or unmaintained packages
- Quarterly `npm audit` and dependency upgrade pass

### 6.8 Pops-Side Training & Onboarding

**Office staff training**

- **Duration**: half day, hands-on, in Pops's office, with the actual production system
- **Audience**: owner + any office staff (likely 1–2 people total)
- **Curriculum**:
  - Logging in, password reset
  - Creating a company, contact, and job
  - Generating and printing the job packet
  - Marking a job scheduled, putting it on hold, releasing it
  - Reviewing job photos and QC notes
  - Inviting another staff member
  - Customer portal preview (so they understand what customers see)
- **Deliverable**: signed sheet acknowledging training completion

**Shop staff training**

- **Duration**: half to full day per shift
- **Audience**: every shop floor worker who will scan
- **Format**: hands-on at the actual workstations once tablets are mounted (Week 11)
- **Curriculum**:
  - PIN tap to identify yourself
  - Switching users mid-shift
  - Scanning a job from a workstation
  - Snapping a photo (when required)
  - Marking a job on hold
  - QC fail flow
  - What to do when the camera won't read a QR (manual entry fallback)
  - What to do when WiFi drops (tablet shows offline indicator; scans queue)
  - Who to call when stuck

**Cheat sheets**

- One-page laminated reference, posted at every workstation
- Covers the 5 most common actions and the troubleshooting tree
- Includes the dev's break-glass phone number

**Training video**

- Record a single 5-minute screencast during Week 11 covering the shop workflow
- Host on YouTube as unlisted; link in the cheat sheet via QR code
- Use as onboarding for future hires

### 6.9 Maintenance Windows

**Postgres migrations**

- Run after **6 PM Eastern Time on weekdays** (Pops typically closed)
- Migrations are tested on Supabase branch databases and against the staging environment first
- Use `supabase db push` with the `--include-roles=false` flag for safe production migrations
- Long-running migrations (large data backfills) scheduled for Saturday mornings
- Always notify Pops's owner 24 hours before any migration that requires downtime

**Vercel deploys**

- Zero-downtime, can happen any time
- Preview deploys on every PR, production deploy on merge to `main`
- Feature flags via env vars or LaunchDarkly's free tier let risky changes ship dark

**Breaking changes**

- Coordinated with Pops's owner
- 7-day notice for any UI change that affects daily workflow
- Provide a side-by-side comparison screenshot before deploying

---

## 7. Risk Register

The risk register below is exhaustive but not paranoid: each entry has a realistic probability, realistic impact, concrete mitigation, and a trigger condition that should escalate the risk to a re-plan or slip the timeline. Probability and impact are scored Low / Medium / High.

| # | Risk | Probability | Impact | Mitigation | Trigger to escalate |
| --- | --- | --- | --- | --- | --- |
| 1 | iOS Safari camera permission UX broken or revokes between sessions | Medium | High | Prototype the camera flow in Week 2 on a real iPad in Single App Mode; design a permission-prompt screen with a "what to do if you don't see a prompt" fallback; document MDM camera-permission profile | If after Week 6 the dev iPad still requires manual permission re-grant per session, escalate: re-evaluate native shell (Capacitor) wrapping the PWA |
| 2 | Offline mode harder than estimated — iOS Safari has no Background Sync API | High | Medium | Implement a simple in-page queue with IndexedDB + foreground replay on visibility change; ship Wave 1 without Background Sync; document the limitation and the "tap to sync" pattern for shop staff | If two consecutive shop floor sessions lose scan data due to backgrounding, escalate: explore Capacitor wrapper or service worker periodic sync fallback |
| 3 | Per-workstation Supabase auth has unexpected quirks (token refresh, multi-tab) | Medium | High | Build the workstation auth flow in Week 3; test refresh behavior across long sessions (8+ hours); use a custom JWT claim for `workstation_id`; have a clear "tablet stale, re-enroll" recovery flow | If refresh fails silently in production after Week 11, escalate: shorten refresh window and add explicit re-enroll banner |
| 4 | Custom SMTP delivery flagged as spam by Gmail/Outlook | Medium | High | Use Resend with verified domain, full SPF + DKIM + DMARC records; warm up sending volume gradually; monitor bounce rate via Resend dashboard; have Postmark as warm backup | If bounce rate >5% in any week, escalate: rotate provider, audit content for spam-trigger phrases |
| 5 | PDF generation slow on Vercel cold starts | Medium | Medium | Use `@react-pdf/renderer` or `pdf-lib` (lighter than Puppeteer); precompile templates; consider a separate Vercel function with `runtime: 'nodejs'` and warm-up pings; cache generated PDFs in Storage | If P95 packet generation latency >5s in production, escalate: move to background job with email-when-ready |
| 6 | Pops's actual workflow differs significantly from the PRD | Medium | High | Schedule shadowing day in Week 1 — dev spends a full shift at the shop observing actual workflow; weekly check-ins with owner during Wave 1; flexible stage transitions in DB schema reduce risk of being wrong about the workflow | If shadowing reveals >2 stages we didn't model, escalate: pause feature work, rework the schema before continuing |
| 7 | Real-time subscription costs/limits at scale | Low | Medium | Wave 1 has 1 shop; Supabase Realtime free tier covers thousands of concurrent subscribers; design with channel scoping (per-tenant, per-job) to avoid fan-out; budget for Realtime add-on at Wave 3 | If Wave 2 exceeds free tier limits, escalate: upgrade Realtime add-on, audit subscription patterns for over-fetching |
| 8 | Scope creep from Pops feedback during Wave 1 | High | High | Strict change-control process: any feature request goes into a backlog, prioritized at end-of-wave reviews; written agreement that Wave 1 scope is frozen at signing; demo working software every 2 weeks to absorb feedback in small chunks | If three consecutive weeks slip due to in-flight scope additions, escalate: stop new features, ship what works, push remainder to Wave 2 |
| 9 | Solo dev burnout (24+ weeks of full-time solo work) | High | High | Build in 2-week buffer between waves; deliberately work 40-hour weeks, not 60; one full day off per week minimum; quarterly week-long break; have a "designated griper" friend who is not Pops to vent to | If energy drops noticeably in any 2-week window or sleep quality drops, escalate: take a week off, re-baseline timeline with Pops |
| 10 | Wave 1 ship gate fails (multiple criteria miss) | Medium | High | Define exit criteria clearly upfront (this spec); weekly self-grading against criteria starting Week 8; have a "minimum acceptable" version of each gate that can be shipped if "ideal" version slips | If 3+ gates miss in Week 11 review, escalate: extend by 2 weeks, communicate honestly to Pops, do not ship broken |
| 11 | Pops's owner doesn't actually use the system after launch | Medium | High | Owner involvement during all of Wave 1 — daily 15-minute syncs, weekly 1-hour walkthrough; design office UX with owner's specific habits in mind; provide cheat sheet pinned at desk | If owner skips 3+ scheduled walkthroughs, escalate: have a hard conversation about commitment, possibly pause development |
| 12 | WiFi unreliable on shop floor (offline mode burden increases) | Medium | High | WiFi survey in Week 0; plan WiFi upgrade if signal poor; implement offline mode early in Wave 1, not late; instrument scan-failure metrics from day 1 | If scan failure rate >2% in any week post-launch, escalate: deploy additional APs or hardwire workstations |
| 13 | DST transition causes timestamp bugs | Low | Medium | Use `TIMESTAMPTZ` everywhere in Postgres; never store local time; format on the client using `Intl.DateTimeFormat` with explicit timezone; add tests around DST boundary dates | If any user reports "the time is wrong" within a week of a DST change, escalate: audit all date-handling code paths |
| 14 | Domain registrar issues (typo, slow transfer, expiration) | Low | High | Use Cloudflare Registrar (reliable, transparent); enable auto-renew with backup payment method; set calendar reminder 60 days before expiration; share registrar credentials with Pops in 1Password | If domain expires or registrar suspends, escalate: emergency restoration, communicate downtime to all parties |
| 15 | Vercel KV / Upstash deprecation or rebrand | Low | Medium | Wrap KV calls in a thin abstraction (`packages/cache/`) so we can swap providers; monitor Vercel changelog; if rebrand happens, evaluate migration cost vs sticking with successor product | If Vercel deprecates KV with <90 days notice, escalate: migrate to Upstash Redis directly |
| 16 | Supabase Auth Hook has undocumented quirks (custom JWT claims) | Medium | High | Test the Auth Hook in Week 2 with concrete claim shapes; have RLS policies that fail closed if claims are missing; monitor Auth Hook latency (it's in the critical path for every login) | If Auth Hook latency P95 >500ms, escalate: refactor to lighter-weight implementation |
| 17 | Resend account suspended (deliverability issues or ToS violation) | Low | High | Use clean transactional content (no marketing); monitor deliverability dashboard; have Postmark configured as warm backup; respond quickly to abuse reports | If Resend suspends account, escalate: switch to Postmark within 1 hour, file appeal with Resend |
| 18 | Hardware procurement delays (iPads back-ordered, brackets out of stock) | Medium | Medium | Order iPads in Week 4 with 8-week buffer; have alternative bracket vendor identified; B&H as Apple Store backup | If iPads not on-site by Week 8, escalate: borrow tablets from Pops's existing inventory or rent for QA week |
| 19 | iPad falls or breaks at workstation | Medium | Medium | Lockable bracket reduces risk; spare iPad in office for immediate swap; AppleCare+ on each device ($30/yr) for accidental damage | If 2+ tablets break in 6 months, escalate: re-evaluate bracket design, consider impact-resistant cases |
| 20 | Camera lens gets coated with overspray or scratched | Medium | Medium | Clear protective lens covers ($5 each, replaceable monthly); manual job-number entry as fallback (always available in UI); train staff to clean lens daily | If camera failure rate >5%, escalate: schedule lens cover replacement weekly; reposition tablets away from spray |
| 21 | Employee forgets PIN repeatedly (lockout becomes operational pain) | Medium | Low | PIN reset flow is one tap by office staff; document the flow on the cheat sheet; PIN policy is "just memorable enough" — 4 digits, no complexity rules | If >10% of employees lock out weekly, escalate: revisit PIN length or add NFC fob option |
| 22 | Customer portal performance degrades under subscription scaling | Low | Medium | Index foreign keys aggressively; paginate customer portal job list (default 25); use Supabase Realtime selectively (one channel per active job, not all jobs) | If portal P95 >2s, escalate: profile queries, add caching layer for read-heavy paths |
| 23 | Cross-tenant data leak via service-role bug | Low | High | Per-workstation auth is the primary mitigation (RLS enforces tenant boundary on every query); strict ban on service-role usage in routes; quarterly security audit; pgtap RLS test suite (see Section 8) | If any cross-tenant data appears in logs/output, escalate: stop the deploy, root-cause within 4 hours, full incident report |
| 24 | Vendor lock-in becomes painful (need to migrate off Supabase or Vercel) | Low | High | Standard Postgres schema (no Supabase-specific extensions for core data); Vercel-agnostic Next.js code (no Vercel-only APIs); document the migration playbook in `docs/runbooks/migration.md` | If pricing or features push us off, escalate: 90-day migration plan to Railway+self-hosted Postgres or AWS+RDS |
| 25 | Solo dev gets sick mid-Wave (no bus factor) | Medium | High | 1Password vault is shared; documentation is current; preview deploys mean Pops can see what's in flight; 2-week buffer between waves absorbs short illnesses | If illness exceeds 5 working days, escalate: notify Pops, slip the timeline by the duration, no heroics |
| 26 | Compliance demand from a customer (CCPA data export, GDPR right to deletion) | Low | Medium | Build a self-service "download my data" feature in Wave 3; have a manual SQL-based delete process for Wave 1–2; ensure backups have a known retention so deletion can propagate | If a request arrives in Wave 1, escalate: handle manually within statutory deadline (45 days CCPA, 30 days GDPR) |
| 27 | Integration request from Pops (QuickBooks, etc.) — out of Wave 1 scope | High | Medium | Defer to Wave 3 backlog; document the request; never start implementation without scope agreement | If Pops insists during Wave 1, escalate: change order with explicit cost and timeline impact |
| 28 | Power outage at Pops kills tablets mid-shift | Low | Medium | Tablets have 4–6 hours of battery if unplugged; offline mode queues scans; unplug brackets are an option for portable use during outage | If multi-hour outage during peak production, escalate: communicate to customers about delays |
| 29 | Pops's ISP outage = entire system down (offline mode helps but isn't perfect) | Low | High | Offline mode covers shop scans; office work pauses (no job creation, no email); WiFi cellular failover via a small modem ($50/mo backup) is an option for Wave 2 | If outages exceed 4 hours twice in a quarter, escalate: deploy cellular failover |
| 30 | Owner-developer relationship friction over scope/cost/timeline | Medium | High | Weekly written status updates with what shipped, what slipped, what's next; transparent burn-down; pre-agreed change-control process; quarterly relationship retrospective | If trust erodes (owner stops attending walkthroughs, payments slow), escalate: pause work, have a frank in-person conversation |
| 31 | Magic link emails arrive too slowly to be usable | Low | Medium | Resend P95 send latency is <2s; monitor via Sentry; have a fallback "request another link" flow with rate limiting | If link arrival latency >30s consistently, escalate: switch provider |
| 32 | Print packet QR code unscannable (low ink, smudged, wrong size) | Medium | Medium | Generate QR at high error-correction level (H, 30%); minimum print size 1.5" square; test with the actual printer at Pops in Week 11; provide alternate manual entry path | If scan failure on printed packets >2%, escalate: increase QR size, reformat packet template |
| 33 | New employee added during shift, can't be onboarded fast | Low | Low | Office staff can create employee + PIN in <1 minute; document this flow on the cheat sheet | n/a — operational, not technical |
| 34 | Job photo storage costs unexpectedly high | Low | Medium | Compress photos client-side before upload (max 1280px, JPEG quality 0.8); cap photos per job at 10 (configurable); estimate ~50KB per photo | If Storage usage exceeds 10 GB in first quarter, escalate: lower compression quality or add cleanup policy for completed jobs >90 days old |
| 35 | Pops decides to add a second shop mid-Wave (multi-tenant becomes urgent) | Low | High | Multi-tenant from day 1 means schema is ready; UX is the gap (tenant switcher, billing) — defer to a Wave 4 if needed; protect Wave 1–3 commitment | If request is firm with deadline, escalate: change order, scope and timeline negotiation |

---

## 8. Testing Strategy

The testing strategy is pragmatic, not aspirational. Two areas demand high rigor: **RLS policies** (cross-tenant isolation is unforgiving) and **critical user flows** (a broken scan or print flow stops production at Pops). Everything else gets reasonable coverage with no apologies for not chasing 100%.

### 8.1 Test Infrastructure

**Tooling**

- **pgTAP** — installed in Supabase Postgres for SQL-level unit tests of functions and RLS policies. Available as a Supabase extension; enable via the dashboard.
- **Vitest** — unit tests for Server Actions, helpers, validators. Fast, ESM-native, TypeScript-friendly.
- **Playwright** — end-to-end tests against a live Supabase + Next.js stack. Lives in repo as `e2e/`.
- **GitHub Actions CI** — runs on every PR: `lint` + `typecheck` + pgTAP + Vitest. Playwright runs nightly + on `main` branch deploys (slower, expensive to run on every PR).
- **Supabase branch databases** (Pro feature) — every PR gets an isolated branch DB with the schema migrations applied. Tests run against this rather than a shared dev DB.
- **Local development** — `supabase start` runs the full stack locally (Postgres, Auth, Realtime, Storage) via Docker. All tests can run against local before PR.

**Test data isolation**

- pgTAP tests run inside transactions that roll back automatically. No test pollutes the database.
- Vitest unit tests are pure (no DB dependency) where possible; when DB needed, use the local Supabase + per-test fixtures.
- Playwright uses a dedicated test tenant with a known fixture set; cleaned and re-seeded before each run.

### 8.2 RLS Test Suite (Load-Bearing Security)

The RLS test suite is non-negotiable. Every policy must be covered by at least one test that proves it denies what it should deny. Organized by file under `supabase/tests/rls/`.

**`supabase/tests/rls/test_cross_tenant_isolation.sql`**

Setup: tenant A has 3 companies, 5 contacts, 4 jobs. Tenant B has 2 companies, 3 contacts, 2 jobs. Distinct staff users for each.

```sql
BEGIN;
SELECT plan(6);

-- Test 1: staff JWT for tenant A cannot SELECT tenant B's companies
SELECT set_jwt_for_staff('tenant_a_staff_id');
SELECT is(
    (SELECT count(*)::int FROM companies WHERE tenant_id = 'tenant_b_id'),
    0,
    'Tenant A staff cannot see Tenant B companies'
);

-- Test 2: staff JWT for tenant A cannot UPDATE tenant B's jobs
SELECT throws_ok(
    $$ UPDATE jobs SET status = 'completed' WHERE tenant_id = 'tenant_b_id' $$,
    NULL,
    'Tenant A staff cannot UPDATE Tenant B jobs'
);

-- Test 3: customer JWT for tenant A's company X cannot SELECT tenant B's data
SELECT set_jwt_for_customer('tenant_a_company_x_customer');
SELECT is(
    (SELECT count(*)::int FROM jobs WHERE tenant_id = 'tenant_b_id'),
    0,
    'Tenant A customer cannot see Tenant B jobs'
);

-- Test 4: customer JWT for tenant A's company X cannot SELECT tenant A's company Y
SELECT is(
    (SELECT count(*)::int FROM jobs WHERE company_id = 'tenant_a_company_y_id'),
    0,
    'Tenant A customer X cannot see Tenant A company Y jobs'
);

-- Test 5: anonymous JWT cannot SELECT any tenant data
SELECT set_jwt_anon();
SELECT is(
    (SELECT count(*)::int FROM jobs),
    0,
    'Anonymous JWT cannot read any jobs'
);

-- Test 6: forged JWT with arbitrary tenant_id is rejected by Auth Hook
SELECT throws_ok(
    $$ SELECT auth.set_forged_jwt_with_tenant('arbitrary_tenant_id') $$,
    NULL,
    'Forged JWT with non-existent tenant_id is rejected'
);

SELECT * FROM finish();
ROLLBACK;
```

**`supabase/tests/rls/test_audience_isolation.sql`**

Tests that customer/shop/staff audiences cannot bleed across role boundaries.

- Test 1: customer JWT cannot SELECT from `staff` table
- Test 2: customer JWT cannot SELECT contacts from another company at the same tenant
- Test 3: customer JWT cannot UPDATE jobs (only SELECT customer-visible columns)
- Test 4: shop JWT cannot UPDATE companies (read-only for shop)
- Test 5: shop JWT can SELECT jobs but not staff records
- Test 6: shop JWT cannot SELECT pricing or quote data (Wave 3)

**`supabase/tests/rls/test_function_authorization.sql`**

Tests that SECURITY DEFINER functions enforce their own authorization (don't trust the caller).

- Test 1: `record_scan_event(job_id, employee_id, station_id, stage)` refuses cross-tenant inputs (job belongs to tenant A, employee belongs to tenant B)
- Test 2: `record_scan_event` refuses non-staff JWT (e.g., customer trying to scan)
- Test 3: `validate_employee_pin(employee_id, pin)` enforces row lock (concurrent attempts handled atomically with `FOR UPDATE`)
- Test 4: `validate_employee_pin` lockout activates after 5 consecutive failures within 15 minutes
- Test 5: `get_public_job_view(token)` (Wave 3) refuses invalid or expired tokens
- Test 6: `get_public_job_view` is rate-limited per token (≤10 calls/min) — uses a counter table
- Test 7: `transition_job_stage(job_id, new_stage, employee_id)` checks the employee belongs to the job's tenant

**`supabase/tests/rls/test_inactive_user.sql`**

Tests the `is_active` flag is enforced at multiple layers.

- Test 1: staff with `is_active = false` — Auth Hook rejects token issuance
- Test 2: customer with `is_active = false` — Auth Hook rejects token
- Test 3: user is active during sign-in but deactivated mid-session → next refresh token request fails
- Test 4: deactivating an employee invalidates any in-flight PIN session for that employee within 60 seconds (configurable)

**`supabase/tests/rls/test_polymorphic_attachments.sql`**

Photos and PDFs can attach to multiple parent types (jobs, quotes, invoices). RLS must walk the polymorphic FK to enforce the parent's permissions.

- Test 1: customer can SELECT photos attached to their own jobs
- Test 2: customer cannot SELECT photos attached to another customer's jobs
- Test 3: shop staff can SELECT all photos at their tenant
- Test 4: signed Storage URL respects RLS (test by attempting direct fetch)

### 8.3 Vitest Unit Test Priorities

Vitest covers TypeScript code: Server Actions, helpers, validators. Priority order is by blast radius.

**Every Server Action**

For each action, test:
1. Happy path with valid input
2. Validation failure (Zod schema rejects bad input)
3. Auth gate (action refuses unauthenticated calls)
4. Audience gate (e.g., customer Action refuses staff JWT and vice versa)
5. Database error path (mock DB throws)
6. Idempotency where applicable (e.g., scan replay should not double-record)

**Auth helpers**

- `requireOfficeStaff(req)` — passes for staff, throws for customer/shop/anon
- `requireShopStaff(req)` — passes for shop session, throws for staff/customer/anon
- `requireCustomer(req)` — passes for customer, throws for staff/shop/anon
- `requireWorkstationContext(req)` — passes when `workstation_id` claim present, throws otherwise

**PIN handling**

- PIN hashing uses `bcrypt` with cost factor 10 (or `argon2id`)
- Test: same PIN hashed twice produces different hashes (salt is random)
- Test: comparing correct PIN against hash returns true
- Test: comparing wrong PIN returns false
- Test: timing of comparison is constant within tolerance (no early exit)

**Job number format generator**

- `generateJobNumber(tenant_id, year)` produces `YY-NNNNN` format
- Test: monotonic across many calls (no duplicates)
- Test: zero-padded correctly
- Test: rolls over at end of year
- Test: tenant scoped (tenant A's `25-00001` does not collide with tenant B's `25-00001`)

**Polymorphic attachment access checker**

- `canAccessAttachment(attachment_id, user_id)` — walks parent_type / parent_id and applies parent's RLS logic
- Test for each parent type (job, quote, invoice)
- Test denial for cross-tenant
- Test denial for cross-customer

**Validators**

- Every Zod schema gets a happy-path test and 2–3 failure-path tests
- Email, phone, address normalizers tested with edge cases (international phone, multi-line address)

### 8.4 Playwright E2E Critical Flows

E2E tests cover the flows that, if broken, stop Pops's business. Each flow is a single test file.

**Flow 1: Office onboarding and job creation**
- Sign in as staff
- Invite a new staff member (assert email sent)
- Create a new company
- Add a contact to that company
- Create a new job for that company
- Print the job packet PDF (assert it downloads, contains a QR code)

**Flow 2: Shop floor scan workflow**
- Enroll a workstation (one-time setup, generates `device_token`)
- Tap an employee PIN (assert correct employee in session)
- Scan a job QR code via simulated camera input
- Walk the job through 7 stages (Received → Prep → Coating → Curing → QC → Completed → Picked Up)
- Snap a photo at QC
- Mark a job on hold
- Release the hold
- Switch users mid-session

**Flow 3: Customer portal**
- Customer requests magic link
- Customer clicks magic link in email (Playwright intercepts)
- Customer sees their job list
- Customer drills into a job
- Stage transition occurs in another tab; customer view updates within 5 seconds (Realtime)

**Flow 4: Multi-color (parent/child jobs)**
- Create a parent job
- Split into two child jobs (each with its own color spec)
- Scan child A through Coating without affecting child B
- Both children visible under parent in office view

**Flow 5: Concurrent scan conflict**
- Tablet A scans job X at Coating
- Within 5 seconds, tablet B scans the same job X
- Tablet B sees a "moved by" warning showing tablet A's recent action
- Both scan events are recorded for audit, but only one stage transition occurs

**Flow 6: Offline scan replay (Wave 2)**
- Take tablet offline (intercept network)
- Scan 5 jobs through different stages
- Bring tablet online
- All 5 events replay in order, all visible in audit log
- No duplicates (idempotency key prevents double-write)

### 8.5 Manual QA Checklist (Week 11)

Before production launch, a one-week manual QA pass at Pops's actual shop. Cannot be skipped.

**On-site iPad testing**

- Scan a printed packet under typical shop lighting (fluorescent, dusty)
- Scan with work gloves on (capacitive screens through nitrile gloves)
- Scan from 6", 12", and 24" distance — note minimum reliable QR size
- Scan a packet that's been on the floor for 30 minutes (smudges, dust)
- Test near the curing oven (heat doesn't kill the tablet)

**Network testing**

- Use Charles Proxy or Network Link Conditioner to throttle WiFi to 3G speeds
- Simulate intermittent disconnect (drop WiFi for 30s mid-scan)
- Verify offline mode kicks in correctly
- Verify replay on reconnect

**Print testing**

- Print 10 packets on Pops's actual printer
- Scan all 10 with the actual production tablet
- Verify 10/10 scan success on first attempt
- If any fail, increase QR size or error correction level

**Owner sign-off**

- Owner walks through the office workflow on a laptop while dev observes silently
- Owner walks through a shop scan on a tablet while dev observes
- Document any "wait, how do I…?" moments — these are UX bugs

**Full production day shadow**

- Dev on-site for one full production day in Week 11 or Week 12
- Observation only — no fixes, no coaching
- Note every workflow gap, edge case, weird question
- Triage post-shift; fix critical issues before launch, defer rest to Wave 2

### 8.6 Test Data Seeding

Reproducible test data is essential for both automated tests and manual QA.

**`scripts/seed-tenant.ts`**

Programmatic seed for new tenant:
- Creates a tenant
- Creates 3 staff users with different roles (owner, office, manager)
- Creates 5 employees with PINs
- Creates 5 workstations with device tokens
- Creates 10 customer companies, each with 1–3 contacts and 1–5 jobs in various stages
- Used for E2E tests, manual demos, and initial production tenant bootstrap

**`supabase/seed.sql`**

Local dev seed: smaller fixture set for fast local development. Sample companies, jobs, packets that demonstrate every feature.

**`supabase/tests/fixtures/*.sql`**

Per-test fixtures for pgTAP. Each test that needs specific data has a `setup_<test_name>.sql` file.

**Fake scanner endpoint**

A `/api/dev/simulate-scan` endpoint (dev environment only) that accepts a job number and station ID and triggers the scan flow without requiring a physical camera. Critical for Playwright E2E and for testing without an iPad.

### 8.7 Coverage Targets (Modest, Not Dogmatic)

Coverage as a metric is misleading; coverage as a backstop is useful. Targets reflect what we care about most.

| Area | Target | Rationale |
| --- | --- | --- |
| pgTAP | 100% of RLS policies | Cross-tenant isolation is unforgiving |
| pgTAP | 100% of SECURITY DEFINER functions | These bypass RLS by design; must be airtight |
| Vitest | 80% of Server Actions | Primary write path; high blast radius |
| Vitest | 60% overall | Catches regressions without chasing trivia |
| Playwright | All critical flows pass | Required for production deploy gate |
| Playwright | Run nightly + on `main` | Too slow for every PR |
| Manual QA | Full Week 11 pass | No coverage substitute for human eyes |

**Coverage is monitored but not gated.** A PR that drops Vitest coverage from 81% to 80% does not block merge. A PR that breaks an RLS test does. Pragmatism over cargo-culting.

---

## 9. Cost & Commercial

This section covers monthly recurring infrastructure costs, one-time hardware costs, owner-developer commercial terms, future SaaS pricing models, cost of goods sold at scale, and Pops's return on investment. All numbers are estimates as of 2026-04-26 — pricing changes; verify against vendor sites at procurement time.

### 9.1 Monthly Recurring Costs (Production, Wave 1)

These are the irreducible infrastructure costs to run the production system for one shop.

| Service | Plan | Cost | Required from | Notes |
| --- | --- | --- | --- | --- |
| Supabase | Pro | $25/mo | Week 1 | Required for daily backups, PITR, branch DBs, higher quotas. Free tier insufficient for production. |
| Vercel | Pro | $20/mo | Week 1 | Required for serverless function timeout extension, custom domains with team features, analytics |
| Resend | Pro | $20/mo for 50,000 emails | Wave 1 | Free tier (3k emails/mo) likely sufficient initially; upgrade when transactional volume grows |
| Vercel KV / Upstash Redis | Pay-as-you-go | $10–15/mo | Wave 1 | Used for rate limiting magic links, scan throttling. Free tier may suffice for a single shop |
| Sentry | Free → Team | $0 → $26/mo | Wave 1 → Wave 2 | Free tier covers 5k events/mo. Upgrade when error volume grows or team grows |
| Domain (`popscoating.com`) | Cloudflare Registrar | $10/yr ≈ $0.85/mo | Week 0 | At-cost pricing |
| Google Workspace | Business Starter | $6/user/mo × 2 = $12/mo | Week 1 | For Pops's owner + bookkeeper email infrastructure |
| Backup storage (B2) | Pay-as-you-go | $2–5/mo | Week 8 | Offsite backup retention; cheaper than S3 |
| 1Password Business | Business plan | $8/mo | Week 0 | Shared credential vault between dev and Pops |
| AppleCare+ | Per device, prorated | ~$13/mo for 6 iPads | Week 8 | $30/yr per iPad × 6 ÷ 12 ≈ $15/mo combined |

**Total recurring (Wave 1)**: approximately **$80–130/mo**

**Total recurring (Wave 3)**: approximately **$150–200/mo** as Sentry upgrades, Resend volume increases, and Realtime usage grows

This is genuinely affordable for a single coating shop and is dwarfed by the labor savings (see 9.6).

### 9.2 One-Time Hardware Costs

| Item | Quantity | Unit cost | Subtotal |
| --- | --- | --- | --- |
| iPad (10th gen, 64 GB, WiFi) | 5 | $450 | $2,250 |
| Spare iPad | 1 | $450 | $450 |
| Heckler / Maclocks bracket | 6 | $80 | $480 |
| USB-C power supplies (20W, Apple) | 6 | $20 | $120 |
| USB-C cables (3m, MFi-certified) | 6 | $20 | $120 |
| Lens protector covers | 12 (2/iPad initial stock) | $5 | $60 |
| Surge protectors (per workstation) | 5 | $25 | $125 |
| Misc cables, zip ties, mounting hardware | — | — | $200 |
| Optional: WiFi upgrade (UniFi U6-Lite × 3 + UDM-SE) | 1 set | — | $800 |
| Optional: electrician for new outlets | 1 visit | — | $1,000 |

**Total hardware (without WiFi/electrician)**: ~**$3,300**

**Total hardware (with WiFi upgrade and electrician)**: ~**$5,100**

These are paid by Pops, not the developer. Procurement spans Weeks 1–10.

### 9.3 Owner-Developer Commercial Terms

Decided **before Week 1** and documented in a Master Service Agreement (MSA). Three common models:

**Model 1: Fixed-price project**

- Example: $X to deliver Wave 1, $Y for Wave 2, $Z for Wave 3
- Pros: predictable for Pops; clear deliverable boundaries
- Cons: developer eats all scope-creep risk; tendency to under-spec to protect margin
- Best for: well-defined scope, infrequent changes
- Risk: if Pops's actual workflow differs from the spec (Risk #6), the developer takes the loss

**Model 2: Hourly retainer**

- Example: $Z/hr with a monthly minimum (e.g., 80 hours/mo)
- Pros: aligns incentives — developer is paid for actual work; flexible for changes
- Cons: less predictable for Pops; requires trust and detailed time tracking
- Best for: evolving scope, ongoing relationship
- Risk: Pops may resist time spent on infrastructure work that doesn't have visible features

**Model 3: Equity / revenue share**

- Developer takes a percentage of future SaaS revenue when other shops onboard
- Pros: high upside if multi-tenant SaaS works; low cash burn for Pops upfront
- Cons: high risk for developer (no income for years); legal/tax complexity
- Best for: pre-seed startup-style commitment, both parties willing to gamble
- Risk: most likely outcome is no SaaS revenue ever materializes

**Recommended hybrid**

- **Wave 1**: discounted hourly rate (e.g., 25–40% below market) in exchange for owning the IP with usage license to Pops
- **Wave 2–3**: full hourly rate
- **Post-launch**: monthly retainer (e.g., $2,500–5,000/mo) covering maintenance, on-call, minor features
- **Future SaaS**: written option for the developer to launch a SaaS product based on the codebase, with a revenue share to Pops (e.g., 5% of MRR for the first 5 years) in recognition of being the design partner

Key terms in the MSA:

- Scope of Wave 1 (frozen)
- Hourly rate for Waves 2–3
- Code IP ownership and licensing
- Customer data ownership (always Pops)
- Termination clause (mutual notice, deliverable handoff)
- IP transfer at termination (Pops keeps perpetual usage license; dev keeps source rights)
- Confidentiality (mutual NDA)
- Liability cap (limit dev's liability to fees paid)
- Payment terms (Net 15 or Net 30)

### 9.4 Pricing Model for Future Tenants (Multi-Tenant SaaS)

Speculative — only relevant when the system goes multi-tenant beyond Pops. The DB schema is multi-tenant from day 1, so the technical path is open. The commercial path is a separate decision.

**Common pricing patterns in vertical SaaS:**

- **Per-shop monthly fee**: $200–500/mo per shop, varies by shop size
- **Per-employee tier**: $5–10/mo per active staff member, scales with usage
- **Per-job pricing**: $1–2 per completed job, usage-based
- **Hybrid**: base fee + per-employee or per-job overages

**Recommendation when the time comes:**

- **Standard tier**: $299/mo per shop. Includes:
  - 5 workstations
  - 500 jobs/mo
  - 5 office staff seats
  - 25 active employees
  - 90 days of job photo retention
  - Email support
- **Add-ons**:
  - Extra workstation: $30/mo each
  - Extra 500 jobs/mo: $50/mo
  - Advanced analytics: $50/mo
  - 1-year photo retention: $30/mo
  - Phone support: $200/mo
- **Enterprise tier**: custom pricing for 5+ shops, multi-location chains, white-label

Pricing should be transparent on a public marketing site. No "contact sales" theater for the standard tier.

### 9.5 Cost of Goods Sold Considerations (At Scale)

If $299/mo per shop, what does it cost to serve one shop? Per-shop COGS estimate:

| Cost component | Per-shop monthly |
| --- | --- |
| Supabase compute and storage | $25–35 |
| Vercel bandwidth and functions | $5–10 |
| Resend transactional email | $5–10 |
| Sentry and observability | $5 |
| Backups (B2/S3) | $1–3 |
| Support labor (amortized) | $10–20 |
| Payment processing (Stripe ~3%) | $9 |
| **Total COGS** | **~$60–90/shop/mo** |

At $299/mo revenue and ~$75 COGS, gross margin is **~75%**. Still attractive after support and operations overhead.

At scale (>50 shops), Supabase costs drop per-shop because of more efficient resource usage on a single project, possibly approaching $20/shop/mo. Margin trends upward over time.

### 9.6 Pops's ROI

The system pays for itself many times over. Conservative estimate of weekly time saved at Pops:

| Activity | Hours/wk saved |
| --- | --- |
| Phone calls answered ("where is my job?") | 5 |
| Manual paperwork tracking and filing | 3 |
| Looking up job status from physical traveler | 2 |
| Communicating job status to customers | 1.5 |
| Reconciling QC notes from paper | 0.5 |
| **Total** | **12 hr/wk** |

At a loaded labor cost of **$50/hr** (wages + payroll tax + benefits + overhead):

- **12 hr/wk × $50/hr = $600/wk = ~$2,400/mo saved**

Compare to monthly system cost (~$130/mo Wave 1): **ROI of ~18x**.

Plus intangibles:

- Fewer dropped balls (jobs lost in the shuffle, customers forgotten)
- Faster customer trust (real-time visibility = professional brand)
- Reduced anxiety (the owner stops being the single source of truth in their own head)
- Foundation for growth (adding a second shift or second location is a software change, not a paperwork explosion)

The hardware payback period is roughly **1.5 months** of saved labor. The recurring monthly cost is recovered in **~2 days** of saved labor each month. Net, this is one of the highest-ROI investments Pops can make for the operational health of the business.
