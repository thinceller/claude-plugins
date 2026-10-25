#!/usr/bin/env bash
set -euo pipefail

outfile="$1"

grep -q 'dev-practice:grill' "$outfile"
