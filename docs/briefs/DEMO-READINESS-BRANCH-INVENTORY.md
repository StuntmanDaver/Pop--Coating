# Demo Readiness Branch Inventory

Captured on 2026-05-19 before the `codex/demo-readiness` repair pass.

## Integration Branch

- `codex/demo-readiness` starts from `main` at `95bd7a55da7522e9e5d96e418408eaa46400f4b0`.

## Source Branch Heads

| Branch | Head | Notes |
|---|---:|---|
| `main` | `95bd7a55da7522e9e5d96e418408eaa46400f4b0` | DNS-deferred Phase 1 gate base. |
| `codex/app-dev-second-pass` | `3b0214b1d47d533350ee9765dda3c1e8e2afb49c` | Selective source for app/test/CI fixes; avoid wholesale merge due older migration conflicts. |
| `codex/phase-1-3-completion` | `4a9ff8da6ebbcb0f08e5743bdc4bcb92f16295ab` | Selective source for office/scan/packet hardening. |
| `codex/loki-dashboard-ui` | `df67e148358dc6d127a5f52c714b25f91a4ab0c6` | Dashboard UI source branch. |
| `codex/loki-companies-e2e` | `e6303f717662ade90c05bf2794eb67c806edd08d` | Companies E2E source branch. |
| `codex/loki-infra-verifier` | `4f9846fd61107d60454c64191550e9676cca896a` | Infra verification docs source branch. |
| `codex/loki-integration` | `521841096982b950589308ca12635c82173fc6ae` | Aggregates loki branches; use cautiously. |
| `codex/loki-portal-jobs` | `fc6506505a98d6b51af8d9912c1f4ccb735bf0ed` | Portal jobs source branch. |
| `ralph/foundation-completion` | `f1f9f2fa147860fff1828ec32b1f3653c796c3d6` | Quarantined during demo repair due timeout-prone git traversal. |
| `ralph/pops-website` | `5fc3a904989301cf29d495acd896586e0162904d` | Quarantined; marketing-site branch is out of scope for app demo. |

## Worktree Policy

- Preserve existing worktrees until `codex/demo-readiness` passes all local gates.
- Remove stale worktrees only after the demo branch is green and branch heads are no longer needed for inspection.
