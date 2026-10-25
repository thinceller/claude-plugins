#!/usr/bin/env bash
set -euo pipefail

if ! command -v claude >/dev/null 2>&1; then
  echo "error: 'claude' command not found in PATH" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SCENARIOS_DIR="$SCRIPT_DIR/scenarios"
FIXTURES_DIR="$SCRIPT_DIR/fixtures"

if [ "$#" -gt 0 ]; then
  scenarios=("$@")
else
  scenarios=()
  for d in "$SCENARIOS_DIR"/*/; do
    scenarios+=("$(basename "$d")")
  done
fi

overall_status=0
summary_lines=()

for name in "${scenarios[@]}"; do
  scenario_dir="$SCENARIOS_DIR/$name"
  conf="$scenario_dir/scenario.conf"
  check="$scenario_dir/check.sh"

  if [ ! -f "$conf" ]; then
    echo "error: scenario '$name' not found (missing $conf)" >&2
    exit 1
  fi

  # reset scenario.conf variables so a missing required field is caught,
  # and defaults don't leak from the previous scenario
  unset PROMPT TRIALS PASS_MIN PERMISSION_MODE FIXTURE || true
  MODEL="sonnet"
  MAX_TURNS=15
  OUTPUT_FORMAT="text"
  PERMISSION_MODE=""
  FIXTURE=""

  # shellcheck disable=SC1090
  source "$conf"

  : "${PROMPT:?scenario $name: PROMPT is required in scenario.conf}"
  : "${TRIALS:?scenario $name: TRIALS is required in scenario.conf}"
  : "${PASS_MIN:?scenario $name: PASS_MIN is required in scenario.conf}"

  echo "=== Scenario: $name (trials=$TRIALS, pass_min=$PASS_MIN) ==="

  pids=()
  workdirs=()
  outfiles=()

  for _ in $(seq 1 "$TRIALS"); do
    workdir="$(mktemp -d)"
    outfile="$(mktemp)"
    workdirs+=("$workdir")
    outfiles+=("$outfile")

    if [ -n "$FIXTURE" ]; then
      cp -R "$FIXTURES_DIR/$FIXTURE/." "$workdir/"
      (cd "$workdir" && git init -q && git add -A && git -c commit.gpgsign=false -c user.name=evals -c user.email=evals@example.com commit -qm init) >/dev/null 2>&1 \
        || { echo "error: fixture git setup failed for scenario $name" >&2; exit 1; }
    fi

    # Load the plugin under test from this working tree, and turn off the
    # installed copies (and the engineering plugin it replaces) so they don't overlap.
    claude_args=(-p "$PROMPT" --model "$MODEL" --max-turns "$MAX_TURNS"
      --plugin-dir "$REPO_ROOT/plugins/dev-practice"
      --settings '{"enabledPlugins":{"engineering@thinceller-claude-plugins":false,"dev-practice@thinceller-claude-plugins":false,"dev-practice@synced":false}}')
    if [ -n "$PERMISSION_MODE" ]; then
      claude_args+=(--permission-mode "$PERMISSION_MODE")
    fi
    if [ "$OUTPUT_FORMAT" = "stream-json" ]; then
      claude_args+=(--output-format stream-json --verbose)
    fi

    (cd "$workdir" && claude "${claude_args[@]}" < /dev/null > "$outfile" 2>&1) &
    pids+=("$!")
  done

  for pid in "${pids[@]}"; do
    wait "$pid" || true
  done

  pass_count=0
  for i in $(seq 0 $((TRIALS - 1))); do
    if REPO_ROOT="$REPO_ROOT" bash "$check" "${outfiles[$i]}" "${workdirs[$i]}"; then
      pass_count=$((pass_count + 1))
    fi
  done

  if [ "$pass_count" -ge "$PASS_MIN" ]; then
    status="PASS"
  else
    status="FAIL"
    overall_status=1
  fi

  summary_lines+=("$name: $status ($pass_count/$TRIALS)")

  if [ "${KEEP_WORK:-0}" = "1" ]; then
    for i in $(seq 0 $((TRIALS - 1))); do
      echo "  kept workdir: ${workdirs[$i]}"
      echo "  kept output:  ${outfiles[$i]}"
    done
  else
    for w in "${workdirs[@]}"; do
      rm -rf "$w"
    done
    for o in "${outfiles[@]}"; do
      rm -f "$o"
    done
  fi
done

echo
echo "=== Summary ==="
for line in "${summary_lines[@]}"; do
  echo "$line"
done

exit $overall_status
