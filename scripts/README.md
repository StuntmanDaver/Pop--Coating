# scripts/

Operational scripts that don't belong inside the Next.js app or Supabase functions.

## `check-verdict.sh`

Parses an evaluator-agent output for the `VERDICT:` line and exits with a code the orchestrator (or CI) can branch on.

**Why it exists:** the verdict convention (`CLAUDE.md` "Quality gates convention") is a soft contract — any of the five evaluator agents (`security-auditor`, `code-reviewer`, `performance-auditor`, `accessibility-auditor`, `dependency-auditor`) is *supposed* to emit `VERDICT: PASS | FAIL | FAIL-WITH-FOLLOW-UP` as the first non-empty line of its output. Without an enforcement mechanism, an agent could forget the verdict and the orchestrator might miss it. This script makes the contract verifiable.

### Usage

```bash
# Pipe agent output (prefer printf over echo — echo's behavior with \-escapes varies):
printf '%s\n' "$audit_output" | scripts/check-verdict.sh

# Or pass a saved file:
scripts/check-verdict.sh path/to/audit-output.txt

# Accept FAIL-WITH-FOLLOW-UP as a pass (requires user sign-off in dispatch brief):
scripts/check-verdict.sh --accept-followup path/to/audit-output.txt
```

### Exit codes

| Code | Meaning |
|---|---|
| 0 | PASS — or FAIL-WITH-FOLLOW-UP with `--accept-followup` |
| 1 | FAIL — or FAIL-WITH-FOLLOW-UP without `--accept-followup` |
| 2 | Format error (no verdict, malformed line, missing file) |
| 64 | Usage error (bad flags, too many args) |

### Behavior

- Strips `\r` so Windows-CRLF outputs work.
- Tolerates leading blank/whitespace lines; verdict must be the first **non-empty** line.
- Pattern-orders `FAIL-WITH-FOLLOW-UP` before `FAIL` to disambiguate.
- Rejects lowercase, missing-space-after-colon, or unknown verdict words.
- Never auto-grants `FAIL-WITH-FOLLOW-UP` — the caller must opt in via `--accept-followup`, which by convention requires explicit user sign-off in the dispatch brief (issue + owner + deadline).

### Tests

```bash
bash scripts/test-check-verdict.sh
```

22 cases covering all valid verdicts, malformed inputs, file-mode, stdin-mode, and usage errors. Test passes are required before any change to `check-verdict.sh` ships.

### Integration points

- **Orchestrator workflow:** after dispatching any of the 5 evaluators, pipe its output through this script before deciding to merge / advance / re-dispatch.
- **Wave contracts** (`docs/contracts/WAVE-N-CONTRACT.md`) reference this script for the ship-gate dispatch plan.
- **Future CI step** (post-Week-0): integrate with PR checks once `package.json` exists. The script is plain bash, so it works today without any Node/pnpm setup.
