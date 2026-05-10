#!/usr/bin/env bash
set -euo pipefail

echo "== Security checks =="
FAIL=0

# Basic accidental secret pattern scan. Replace or supplement with your team's scanner.
if command -v git >/dev/null 2>&1; then
  scan_files="$(mktemp)"
  scan_output="$(mktemp)"
  cleanup() {
    rm -f "$scan_files" "$scan_output"
  }
  trap cleanup EXIT

  git ls-files --cached --others --exclude-standard -z > "$scan_files"
  if [ -s "$scan_files" ]; then
    if xargs -0 grep -n -I -E '(sk-[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16}|BEGIN (RSA|OPENSSH|EC) PRIVATE KEY|password\s*=\s*["'"''][^"'"'']{8,})' -- < "$scan_files" > "$scan_output" 2>/dev/null; then
      echo "FAIL: possible secrets found:" >&2
      cat "$scan_output" >&2
      FAIL=1
    else
      echo "OK: basic secret scan found no matches"
    fi
  else
    echo "OK: no repository files to scan"
  fi
fi

if [ -f pnpm-lock.yaml ]; then
  echo "Running pnpm audit --audit-level high"
  pnpm audit --audit-level high || FAIL=1
fi

if [ "$FAIL" -ne 0 ]; then exit 1; fi
