#!/usr/bin/env bash
# Assembles the private Studio acceptance harness next to this script:
#   harness/dashboard/  = harness-head.html + the real #webinarStudioModal markup from the
#                         Dashboard index.html + harness-tail.html (in-memory ServerAPI
#                         fixtures) with the Studio scripts in the Dashboard's own order;
#                         js/, css/, vendor/ are symlinks into the Dashboard checkout
#   harness/audience/   = this deck's js/, css/, tests/ (symlinks) plus a copy of
#                         studio-viewer.html whose Dashboard origin is rewritten to the local
#                         Dashboard origin, mounted at /webinars/<slug>/ like production
# Usage:
#   DASHBOARD_ROOT=<dashboard checkout> DASHBOARD_ORIGIN=http://127.0.0.1:4321 AUDIENCE_ORIGIN=http://127.0.0.1:4322 ./build-harness.sh
set -euo pipefail
here=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
deck=$(cd -- "$here/../.." && pwd)
dashboard=${DASHBOARD_ROOT:?set DASHBOARD_ROOT to the Dashboard checkout}
dashboard_origin=${DASHBOARD_ORIGIN:?set DASHBOARD_ORIGIN}
audience_origin=${AUDIENCE_ORIGIN:?set AUDIENCE_ORIGIN}
out="$here/harness"
rm -rf "$out"
mkdir -p "$out/dashboard" "$out/audience/webinars"

ln -sfn "$dashboard/js" "$out/dashboard/js"
ln -sfn "$dashboard/css" "$out/dashboard/css"
ln -sfn "$dashboard/vendor" "$out/dashboard/vendor"
printf 'window.__liveBundle = %s;\n' "$(cat "$deck/tests/fixtures/studio-live-bundle.json")" > "$out/dashboard/fixture.js"
awk '/id="webinarStudioModal"/{f=1} f{print} /^  <\/section>$/{if(f){exit}}' "$dashboard/index.html" > "$out/dashboard/modal.fragment.html"
# The Studio scripts, in exactly the order the Dashboard ships them.
scripts=$(grep -oE '<script src="js/webinar-studio[^"]*"></script>' "$dashboard/index.html" | sed -E 's/\?v=[0-9]+//')
{
  cat "$here/harness-head.html"
  cat "$out/dashboard/modal.fragment.html"
  sed -e "s#__AUDIENCE_ORIGIN__#$audience_origin#g" -e "/__STUDIO_SCRIPTS__/r /dev/stdin" -e "/__STUDIO_SCRIPTS__/d" "$here/harness-tail.html" <<<"$scripts"
} > "$out/dashboard/studio.html"

ln -sfn "$deck/js" "$out/audience/js"
ln -sfn "$deck/css" "$out/audience/css"
ln -sfn "$deck/tests" "$out/audience/tests"
sed "s#'https://dashboard.msfgco.com'#'$dashboard_origin'#" "$deck/studio-viewer.html" > "$out/audience/studio-viewer.html"
grep -q "$dashboard_origin" "$out/audience/studio-viewer.html"
# Production serves the viewer under /webinars/<slug>/; mount the same path locally.
ln -sfn ".." "$out/audience/webinars/first-home-without-mystery"
echo "harness ready: $out"
