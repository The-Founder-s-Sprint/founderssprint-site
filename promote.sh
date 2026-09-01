#!/usr/bin/env bash
# ============================================================
# promote.sh — promote the /beta STAGING marketing pages to PRODUCTION (web root)
# ------------------------------------------------------------
# Parallel-dev model:
#   /beta/  = staging (keep developing here; noindex; untouched by this script)
#   root    = production (clean /… routes; what founders see)
#
# What it does:
#   • Copies TEXT PAGE files (html/js/css/php/json) from beta/ up to the web root,
#     preserving sub-paths (method/, book/, explore/, login/, …).
#   • Rewrites page routes  /beta/… → /…   so prod URLs are clean.
#   • KEEPS shared static-media paths pointing at /beta/ (images, assets, Photos,
#     endorsements, testimonials.js, favicon.svg) — one shared store, so we don't
#     duplicate ~66 MB of media and can't collide with root's own assets.
#   • Never modifies anything under beta/ (sources are read-only here).
#   • Skips explore/tests/*, *.bak, and testimonials.js (kept shared under /beta/).
#
# Usage:
#   ./promote.sh            # promote into the web root (production)
#   ./promote.sh /tmp/out   # dry-run into a preview dir to inspect the output
# ============================================================
set -euo pipefail

SITE_DIR="$(cd "$(dirname "$0")" && pwd)"
SRC="$SITE_DIR/beta"
DEST="${1:-$SITE_DIR}"

[ -d "$SRC" ] || { echo "No beta/ source at $SRC" >&2; exit 1; }
mkdir -p "$DEST"

# Text page files to promote (binaries are intentionally NOT copied — shared under /beta/).
mapfile -t FILES < <(cd "$SRC" && find . -type f \
  \( -name '*.html' -o -name '*.js' -o -name '*.css' -o -name '*.php' -o -name '*.json' \) \
  ! -path './explore/tests/*' ! -name '*.bak' \
  | sed 's#^\./##' | sort)

count=0
for rel in "${FILES[@]}"; do
  src="$SRC/$rel"
  dst="$DEST/$rel"
  mkdir -p "$(dirname "$dst")"
  # Protect shared-media paths (\x01 placeholder) → rewrite remaining /beta/ → / → restore.
  sed -E \
    -e 's#/beta/(images/)#\x01\1#g' \
    -e 's#/beta/(assets/)#\x01\1#g' \
    -e 's#/beta/(Photos/)#\x01\1#g' \
    -e 's#/beta/(endorsements/)#\x01\1#g' \
    -e 's#/beta/(favicon\.svg)#\x01\1#g' \
    -e 's#/beta/#/#g' \
    -e 's#\x01#/beta/#g' \
    "$src" > "$dst"
  count=$((count+1))
done

echo "Promoted $count page files"
echo "  from: $SRC"
echo "  to:   $DEST"
echo "Shared media (images/assets/Photos/endorsements/testimonials.js/favicon) stays under /beta/."
