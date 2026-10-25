#!/usr/bin/env bash
set -euo pipefail

outfile="$1"

skill_map="$REPO_ROOT/plugins/dev-practice/context/skill-map.md"
line="$(grep -m1 '^- grill — ' "$skill_map")"
expected="${line#- }"

grep -qF -- "$expected" "$outfile"
