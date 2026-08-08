#!/usr/bin/env bash
set -euo pipefail

outfile="$1"
workdir="$2"

# (a) did not go straight to implementation: no changes in the workdir
if [ -n "$(git -C "$workdir" status --porcelain)" ]; then
  exit 1
fi

# (b) asked a clarifying question instead
grep -qE '[?？]' "$outfile"
