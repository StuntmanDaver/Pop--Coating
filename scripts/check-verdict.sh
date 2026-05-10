#!/usr/bin/env bash
#
# check-verdict.sh — parse an evaluator agent's output for the VERDICT line and gate.
#
# Hardens the verdict convention from CLAUDE.md "Quality gates convention":
# every dispatch of an evaluator agent (security-auditor, code-reviewer,
# performance-auditor, accessibility-auditor, dependency-auditor) MUST emit
# a `VERDICT: PASS | FAIL | FAIL-WITH-FOLLOW-UP` line as the first non-empty
# line of its output. This script confirms the format and exits with a code
# the orchestrator (or CI) can branch on.
#
# Usage:
#   scripts/check-verdict.sh [--accept-followup] [PATH]
#   echo "$audit_output" | scripts/check-verdict.sh [--accept-followup]
#
# Exit codes:
#   0   PASS   — verdict was PASS, or FAIL-WITH-FOLLOW-UP and --accept-followup given
#   1   FAIL   — verdict was FAIL, or FAIL-WITH-FOLLOW-UP without --accept-followup
#   2   ERROR  — no verdict line found, or malformed verdict
#   64  USAGE  — bad flags or arguments
#
# Stdout: the parsed verdict word (PASS / FAIL / FAIL-WITH-FOLLOW-UP) on success;
#         nothing on error (errors go to stderr).
#
# Behavior notes:
#   - The verdict line must be the first non-empty, non-whitespace line.
#     Leading blank lines are tolerated.
#   - Format is exact: `VERDICT: <WORD>` with exactly one space after the colon.
#     Anything trailing the WORD (e.g., a one-line summary on the same line) is
#     allowed only if separated by whitespace from the WORD.
#   - Carriage returns (\r) are stripped to handle Windows-line-ending output.
#   - --accept-followup is the orchestrator/user override mechanism. The script
#     never auto-grants FAIL-WITH-FOLLOW-UP; the caller must opt in.

set -euo pipefail

accept_followup=0
input_path=""

print_usage() {
  sed -n '3,38p' "$0" | sed 's/^# \{0,1\}//'
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --accept-followup)
      accept_followup=1
      shift
      ;;
    -h|--help)
      print_usage
      exit 0
      ;;
    --*)
      printf 'ERROR: unknown flag: %s\n' "$1" >&2
      exit 64
      ;;
    *)
      if [[ -n "$input_path" ]]; then
        printf 'ERROR: more than one path argument: %s\n' "$1" >&2
        exit 64
      fi
      input_path="$1"
      shift
      ;;
  esac
done

# Read input from stdin or file.
if [[ -z "$input_path" ]]; then
  if [[ -t 0 ]]; then
    printf 'ERROR: no input on stdin and no path argument\n' >&2
    print_usage >&2
    exit 64
  fi
  content="$(cat)"
else
  if [[ ! -f "$input_path" ]]; then
    printf 'ERROR: file not found: %s\n' "$input_path" >&2
    exit 2
  fi
  content="$(cat -- "$input_path")"
fi

# Strip carriage returns (Windows line endings).
content="${content//$'\r'/}"

# Find the first non-empty, non-whitespace line.
first_line=""
while IFS= read -r line; do
  trimmed="${line#"${line%%[![:space:]]*}"}"
  if [[ -n "$trimmed" ]]; then
    first_line="$line"
    break
  fi
done <<< "$content"

if [[ -z "$first_line" ]]; then
  printf 'ERROR: no content to parse\n' >&2
  exit 2
fi

# Match exactly: "VERDICT: WORD" optionally followed by whitespace and more text.
# Order of patterns matters: FAIL-WITH-FOLLOW-UP before FAIL.
verdict=""
case "$first_line" in
  "VERDICT: PASS"|"VERDICT: PASS "*|"VERDICT: PASS"$'\t'*)
    verdict="PASS"
    ;;
  "VERDICT: FAIL-WITH-FOLLOW-UP"|"VERDICT: FAIL-WITH-FOLLOW-UP "*|"VERDICT: FAIL-WITH-FOLLOW-UP"$'\t'*)
    verdict="FAIL-WITH-FOLLOW-UP"
    ;;
  "VERDICT: FAIL"|"VERDICT: FAIL "*|"VERDICT: FAIL"$'\t'*)
    verdict="FAIL"
    ;;
  *)
    printf 'ERROR: first non-empty line is not a valid VERDICT line.\n' >&2
    printf '       got: %q\n' "$first_line" >&2
    printf '       expected: "VERDICT: PASS" | "VERDICT: FAIL" | "VERDICT: FAIL-WITH-FOLLOW-UP"\n' >&2
    exit 2
    ;;
esac

printf '%s\n' "$verdict"

case "$verdict" in
  PASS)
    exit 0
    ;;
  FAIL)
    exit 1
    ;;
  FAIL-WITH-FOLLOW-UP)
    if [[ $accept_followup -eq 1 ]]; then
      exit 0
    else
      printf 'NOTE: VERDICT is FAIL-WITH-FOLLOW-UP; --accept-followup not given, gating as FAIL.\n' >&2
      exit 1
    fi
    ;;
esac
