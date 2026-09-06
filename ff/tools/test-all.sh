#!/usr/bin/env bash
# tools/test-all.sh — one command that runs every suite in ff/tools, morning of
# 9/8 included. Prints one pass/fail line per suite and exits nonzero if any
# suite failed, so a script (or a person in a hurry) can tell at a glance.
#
# Two suites need the Worker running first (npx wrangler dev --port 8787
# --local, from ff/worker) and are skipped with a clear message, not a
# confusing pile of connection-refused errors, when it is not reachable:
#   - test-accounts.sh   (the accounts API itself)
#   - test-sync.js and test-app.js do NOT need it — they run against fake
#     fetch/localStorage, never a real network call.
#
# Everything else (test-engine, test-parser, test-impact, test-app, test-sync,
# test-config, audit, test-playerin if present) is pure Node against the repo's
# own files and always runs.

cd "$(dirname "$0")/.."   # run from ff/, regardless of where this was invoked

API=${DRAFTLINE_API:-http://127.0.0.1:8787}
ORIGIN=${DRAFTLINE_ORIGIN:-http://localhost:8123}

TOTAL_OK=0
TOTAL_FAIL=0
SKIPPED=0
declare -a LINES

run_node() {
  local label="$1" file="$2"
  if [[ ! -f "$file" ]]; then return; fi
  local out
  if out=$(node "$file" 2>&1); then
    LINES+=("  ok    $label")
    TOTAL_OK=$((TOTAL_OK + 1))
  else
    LINES+=("  FAIL  $label")
    echo "$out" | sed 's/^/         /'
    TOTAL_FAIL=$((TOTAL_FAIL + 1))
  fi
}

run_py() {
  local label="$1" file="$2"
  if [[ ! -f "$file" ]]; then return; fi
  if ! command -v python >/dev/null 2>&1; then
    LINES+=("  SKIP  $label — no python on PATH")
    TOTAL_SKIP=$((TOTAL_SKIP + 1))
    return
  fi
  local out
  if out=$(python "$file" 2>&1); then
    LINES+=("  ok    $label")
    TOTAL_OK=$((TOTAL_OK + 1))
  else
    LINES+=("  FAIL  $label")
    echo "$out" | sed 's/^/         /'
    TOTAL_FAIL=$((TOTAL_FAIL + 1))
  fi
}

run_sh() {
  local label="$1" file="$2"
  if [[ ! -f "$file" ]]; then return; fi
  local out
  if out=$(bash "$file" 2>&1); then
    LINES+=("  ok    $label")
    TOTAL_OK=$((TOTAL_OK + 1))
  else
    LINES+=("  FAIL  $label")
    echo "$out" | sed 's/^/         /'
    TOTAL_FAIL=$((TOTAL_FAIL + 1))
  fi
}

echo "== tools/test-all.sh — running every suite =="
echo

echo "-- pure Node suites (no server needed) --"
run_node "test-engine.js    (engine.js math, 99 checks against independently derived numbers)" tools/test-engine.js
run_node "test-parser.js    (Yahoo settings-page parser, 112 checks)" tools/test-parser.js
run_node "test-impact.js    (scoring-impact analysis: the claims it makes about a league)" tools/test-impact.js
run_node "test-app.js       (app.js: analyze/record/undo/keeperAt/myPickNumbers/" tools/test-app.js
run_node "test-sync.js      (sync.js: the 12-cell conflict matrix, against a fake fetch)" tools/test-sync.js
run_node "test-config.js    (loopback proxy guard + build-stamp guard)" tools/test-config.js
run_node "test-playerin.js  (playerIn() against the full 267-name board, if present)" tools/test-playerin.js
run_node "test-signals.js   (signal layer: coverage, centring, crosswalk, payload size)" tools/test-signals.js
run_py   "test-signals.py   (CSV quoting, norm(), the residual fit, centring, Vegas sign)" tools/test-signals.py

echo
echo "-- audit.js (a findings report, not pass/fail — always shown in full) --"
if [[ -f tools/audit.js ]]; then
  node tools/audit.js
fi

echo
echo "-- suites that need the Worker running --"
if curl -s -m 3 -o /dev/null "$API/api/session" 2>/dev/null; then
  run_sh "test-accounts.sh  (signup/login/session/state/lockout/64KB body/two-device race)" tools/test-accounts.sh
else
  echo "  SKIP  test-accounts.sh — no Worker answering at $API"
  echo "        start it first:  cd ff/worker && npx wrangler dev --port 8787 --local"
  SKIPPED=$((SKIPPED + 1))
fi

echo
echo "== summary =="
for l in "${LINES[@]}"; do echo "$l"; done
echo
echo "$TOTAL_OK suite(s) passed, $TOTAL_FAIL suite(s) failed, $SKIPPED suite(s) skipped"
if [[ $SKIPPED -gt 0 ]]; then
  echo "(a skip is not a pass — run the Worker and re-run this script before draft night)"
fi

exit $((TOTAL_FAIL > 0))
