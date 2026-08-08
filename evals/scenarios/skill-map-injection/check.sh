#!/usr/bin/env bash
set -euo pipefail

outfile="$1"

skill_map="$REPO_ROOT/plugins/engineering/hooks/skill-map.md"
line="$(grep -m1 '^- grill — ' "$skill_map")"
expected="${line#- }"

grep -qF -- "$expected" "$outfile"
