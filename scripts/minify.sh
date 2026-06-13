#!/usr/bin/env sh
# Minify bootstrap-vanilla.js with Terser (downloaded on demand via npx; nothing to npm install).
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/js/bootstrap-vanilla.js"
OUT="$ROOT/js/bootstrap-vanilla.min.js"

exec npx --yes terser "$SRC" \
  -o "$OUT" \
  -c \
  -m \
  --comments '/^!/'
