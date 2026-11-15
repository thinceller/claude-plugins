#!/usr/bin/env bash
set -euo pipefail

outfile="$1"

terms="$REPO_ROOT/plugins/writing/context/terms.md"
line="$(grep -m1 '^- 迷ったら' "$terms")"
expected="${line#- }"
# a quote in 「」 often drops the closing full stop
expected="${expected%。}"

grep -qF -- "$expected" "$outfile"
