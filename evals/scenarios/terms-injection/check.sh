#!/usr/bin/env bash
set -euo pipefail

outfile="$1"

terms="$REPO_ROOT/plugins/writing/context/terms.md"
line="$(grep -m1 '^- 迷ったら' "$terms")"
expected="${line#- }"

grep -qF -- "$expected" "$outfile"
