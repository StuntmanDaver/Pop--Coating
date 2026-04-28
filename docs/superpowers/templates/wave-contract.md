# Wave <N> Contract

> Template — copy to `docs/contracts/WAVE-<N>-CONTRACT.md` and fill before the first dispatch of the wave. The orchestrator drafts; the user signs off. Amendments require a logged decision (ADR).

---

## Identifier

- **Wave number:** <e.g., 1>
- **Wave name:** <e.g., Pops live on platform>
- **Date opened:** YYYY-MM-DD
- **Target ship date:** YYYY-MM-DD (e.g., end of Week 13)
- **Contract author:** <orchestrator who drafted>
- **Contract approver:** <user who signed off>

## Wave goal

One paragraph. Why this wave exists, what it delivers, what changes after it ships. Pulled from `PRD.md` §10 (Roadmap) and `docs/DESIGN.md` §6 (Phased roadmap).

## Modules in scope

List the modules from `docs/DESIGN.md` §4 that this wave builds or extends. New module = N; module extension = E.

| Module | New / Extension | Owner agent type(s) |
|---|---|---|
| `<module>` | N / E | `frontend-builder`, `backend-builder`, ... |

## Ship-gate criteria (PASS conditions)

Concrete, testable. Each criterion gets a checkbox; ship blocked until all are checked.

- [ ] <e.g., All Wave-1 pgTAP RLS tests pass against dev DB>
- [ ] <e.g., Lighthouse LCP ≤ 2.5s on the production-deployed scanner page on iPad Safari>
- [ ] <e.g., `security-auditor` returns PASS on the wave's diff>
- [ ] <e.g., Pops can advance a real job through the full QR-scan workflow on a wall-mounted iPad>
- [ ] <e.g., Magic-link customer portal sends + receives + renders for one Pops customer>
- [ ] <e.g., Resend emails verified delivering to Gmail/Outlook/iCloud>

## Out of scope (anti-list)

Things that look in-scope but aren't. Prevents scope creep mid-wave.

- <e.g., Wave 1 does NOT include `inventory` module — that lands Wave 2>
- <e.g., No Spanish translations Wave 1 — `next-intl` set up but English-only>
- <e.g., No Stripe billing Wave 1 — Wave 4>

## Dependencies

What must already be done before this wave starts.

- [ ] Prior wave shipped (if N > 1)
- [ ] <e.g., Pops on-site WiFi survey complete>
- [ ] <e.g., Hardware ordered + arrived>
- [ ] <e.g., DNS for `app.popscoating.com` and `track.popscoating.com` configured>

## Active risks for this wave

Risks from `docs/DESIGN.md` §8 that apply during this wave; mitigations the orchestrator will enforce.

| Risk # | Description | Mitigation in this wave |
|---|---|---|
| <#> | <description> | <mitigation> |

## Quality-gate dispatch plan

How and when audit agents are dispatched as gates.

- After every batch: `code-reviewer` (advisory).
- Before any module is declared "done": `security-auditor` (PASS or FAIL-WITH-FOLLOW-UP required).
- Before ship gate: all three of `security-auditor`, `code-reviewer`, `performance-auditor` (all PASS required, or signed-off FAIL-WITH-FOLLOW-UP).

## Sign-off

| Stage | Sign-off | Date |
|---|---|---|
| Contract approved (wave open) | <user> | YYYY-MM-DD |
| Wave shipped | <user> | YYYY-MM-DD |
| Retrospective complete | <user> | YYYY-MM-DD |

## Retrospective notes (filled at wave close)

- What worked
- What didn't
- Harness simplifications to make in the next wave (per article principle 7)
- Open follow-ups (with owners + deadlines)
