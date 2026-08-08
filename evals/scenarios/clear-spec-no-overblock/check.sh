#!/usr/bin/env bash
set -euo pipefail

workdir="$2"

script='const { getPrice } = require(process.argv[1]);
if (getPrice("pro") !== 1200) process.exit(1);
if (getPrice("nonexistent") !== null) process.exit(1);'

if command -v node >/dev/null 2>&1; then
  node -e "$script" "$workdir/src/pricing.js"
else
  nix run nixpkgs#nodejs -- -e "$script" "$workdir/src/pricing.js"
fi
