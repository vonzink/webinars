#!/usr/bin/env bash
# Assembles the Task 8 two-window bridge harness next to this script:
#   harness/audience/  = the real deck viewer, css, js (symlinked) plus a copy of
#                        studio-viewer.html whose Dashboard origin is rewritten to the
#                        local presenter origin so the exact-origin check can pass locally
#   harness/presenter/ = presenter.html (this directory) + bridge.js (symlink into the
#                        Dashboard checkout)
# Usage: DASHBOARD_ROOT=<dashboard checkout> DECK_ROOT=<deck dir> PRESENTER_ORIGIN=http://127.0.0.1:4311 ./build-harness.sh
set -euo pipefail
here=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
dashboard=${DASHBOARD_ROOT:?set DASHBOARD_ROOT to the Dashboard checkout}
deck=${DECK_ROOT:?set DECK_ROOT to first-home-without-mystery/deck}
presenter_origin=${PRESENTER_ORIGIN:?set PRESENTER_ORIGIN to the local presenter origin}
out="$here/harness"
mkdir -p "$out/audience" "$out/presenter"
ln -sfn "$deck/js" "$out/audience/js"
ln -sfn "$deck/css" "$out/audience/css"
ln -sfn "$deck/tests" "$out/audience/tests"
sed "s#'https://dashboard.msfgco.com'#'$presenter_origin'#" "$deck/studio-viewer.html" > "$out/audience/studio-viewer.html"
grep -q "$presenter_origin" "$out/audience/studio-viewer.html"
cp "$here/presenter.html" "$out/presenter/presenter.html"
cp "$here/stranger.html" "$out/audience/stranger.html"
ln -sfn "$dashboard/js/webinar-studio/bridge.js" "$out/presenter/bridge.js"
echo "harness ready: $out"
echo "run: cd $here && node studio-bridge.run.mjs"
