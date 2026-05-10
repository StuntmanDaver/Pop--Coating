#!/usr/bin/env bash
#
# test-check-verdict.sh — exercises check-verdict.sh against valid and malformed inputs.
# Run: bash scripts/test-check-verdict.sh

set -uo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
CHECK="$SCRIPT_DIR/check-verdict.sh"

passed=0
failed=0

assert_exit() {
  local name="$1"
  local expected_code="$2"
  local expected_stdout="$3"
  local actual_code="$4"
  local actual_stdout="$5"
  if [[ "$actual_code" == "$expected_code" && "$actual_stdout" == "$expected_stdout" ]]; then
    printf '  ✓ %s\n' "$name"
    passed=$((passed + 1))
  else
    printf '  ✗ %s\n' "$name" >&2
    printf '      expected exit=%s stdout=%q\n' "$expected_code" "$expected_stdout" >&2
    printf '      actual   exit=%s stdout=%q\n' "$actual_code" "$actual_stdout" >&2
    failed=$((failed + 1))
  fi
}

run_with_input() {
  local input="$1"
  shift
  local out
  out="$(printf '%s' "$input" | bash "$CHECK" "$@" 2>/dev/null)"
  local code=$?
  printf '%s\n%s' "$code" "$out"
}

extract() {
  local result="$1"
  local field="$2"
  if [[ "$field" == "code" ]]; then
    printf '%s' "$result" | head -n1
  else
    printf '%s' "$result" | tail -n +2
  fi
}

echo "=== check-verdict.sh test suite ==="

# --- PASS cases ---
result=$(run_with_input "VERDICT: PASS")
assert_exit "PASS exact" "0" "PASS" "$(extract "$result" code)" "$(extract "$result" stdout)"

result=$(run_with_input "VERDICT: PASS — looks great")
assert_exit "PASS with trailing summary" "0" "PASS" "$(extract "$result" code)" "$(extract "$result" stdout)"

result=$(run_with_input $'\n\n   \nVERDICT: PASS')
assert_exit "PASS after leading blank lines" "0" "PASS" "$(extract "$result" code)" "$(extract "$result" stdout)"

# Carriage returns
result=$(run_with_input $'VERDICT: PASS\r\nfindings...')
assert_exit "PASS with Windows line endings" "0" "PASS" "$(extract "$result" code)" "$(extract "$result" stdout)"

# Tab as separator (parser case includes $'\t' patterns)
result=$(run_with_input $'VERDICT: PASS\tsome summary')
assert_exit "PASS with tab separator" "0" "PASS" "$(extract "$result" code)" "$(extract "$result" stdout)"

# --- FAIL cases ---
result=$(run_with_input "VERDICT: FAIL")
assert_exit "FAIL exact" "1" "FAIL" "$(extract "$result" code)" "$(extract "$result" stdout)"

result=$(run_with_input "VERDICT: FAIL — three blockers")
assert_exit "FAIL with summary" "1" "FAIL" "$(extract "$result" code)" "$(extract "$result" stdout)"

# --- FAIL-WITH-FOLLOW-UP cases ---
result=$(run_with_input "VERDICT: FAIL-WITH-FOLLOW-UP")
assert_exit "FAIL-WITH-FOLLOW-UP without flag → FAIL" "1" "FAIL-WITH-FOLLOW-UP" "$(extract "$result" code)" "$(extract "$result" stdout)"

result=$(run_with_input "VERDICT: FAIL-WITH-FOLLOW-UP" --accept-followup)
assert_exit "FAIL-WITH-FOLLOW-UP with --accept-followup → PASS" "0" "FAIL-WITH-FOLLOW-UP" "$(extract "$result" code)" "$(extract "$result" stdout)"

result=$(run_with_input "VERDICT: FAIL-WITH-FOLLOW-UP — issue #42")
assert_exit "FAIL-WITH-FOLLOW-UP with summary, no flag" "1" "FAIL-WITH-FOLLOW-UP" "$(extract "$result" code)" "$(extract "$result" stdout)"

# --- Disambiguation: FAIL vs FAIL-WITH-FOLLOW-UP ---
# This was a real bug worry: pattern "VERDICT: FAIL"* would also match FAIL-WITH-FOLLOW-UP.
# Verify the parser distinguishes them.
result=$(run_with_input "VERDICT: FAIL-WITH-FOLLOW-UP")
assert_exit "disambiguation: FAIL-WITH-FOLLOW-UP not parsed as FAIL" "1" "FAIL-WITH-FOLLOW-UP" "$(extract "$result" code)" "$(extract "$result" stdout)"

result=$(run_with_input "VERDICT: FAIL findings:")
assert_exit "FAIL with trailing word not parsed as FAIL-WITH-FOLLOW-UP" "1" "FAIL" "$(extract "$result" code)" "$(extract "$result" stdout)"

# --- Format errors (exit 2) ---
result=$(run_with_input "")
assert_exit "empty input → ERROR" "2" "" "$(extract "$result" code)" "$(extract "$result" stdout)"

result=$(run_with_input "Some other text")
assert_exit "no VERDICT line → ERROR" "2" "" "$(extract "$result" code)" "$(extract "$result" stdout)"

result=$(run_with_input "VERDICT: MAYBE")
assert_exit "unknown verdict word → ERROR" "2" "" "$(extract "$result" code)" "$(extract "$result" stdout)"

result=$(run_with_input "verdict: pass")
assert_exit "lowercase verdict → ERROR" "2" "" "$(extract "$result" code)" "$(extract "$result" stdout)"

result=$(run_with_input "VERDICT:PASS")
assert_exit "missing space after colon → ERROR" "2" "" "$(extract "$result" code)" "$(extract "$result" stdout)"

result=$(run_with_input "VERDICT: PASSED")
assert_exit "PASSED (not PASS) → ERROR" "2" "" "$(extract "$result" code)" "$(extract "$result" stdout)"

result=$(run_with_input $'findings:\nVERDICT: PASS')
assert_exit "VERDICT not on first non-empty line → ERROR" "2" "" "$(extract "$result" code)" "$(extract "$result" stdout)"

# --- File-input mode ---
tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT
printf 'VERDICT: PASS\n' > "$tmp"
out="$(bash "$CHECK" "$tmp" 2>/dev/null)"; code=$?
assert_exit "file input PASS" "0" "PASS" "$code" "$out"

# Non-existent file
out="$(bash "$CHECK" "/nonexistent-path-xyz-$$" 2>/dev/null)"; code=$?
assert_exit "non-existent file → ERROR" "2" "" "$code" "$out"

# --- Usage errors (exit 64) ---
out="$(bash "$CHECK" --bogus-flag 2>/dev/null)"; code=$?
assert_exit "bad flag → USAGE error" "64" "" "$code" "$out"

out="$(bash "$CHECK" path1 path2 2>/dev/null)"; code=$?
assert_exit "two path args → USAGE error" "64" "" "$code" "$out"

echo ""
echo "=== results ==="
printf 'passed: %d\nfailed: %d\n' "$passed" "$failed"
if [[ "$failed" -ne 0 ]]; then
  exit 1
fi
