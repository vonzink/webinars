#!/usr/bin/env bash
# Assembles the Task 6 browser harness next to this script:
#   harness/studio.html  = harness-head.html + the real #webinarStudioModal markup from
#                          the Dashboard index.html + harness-tail.html (fixture stubs)
#   harness/js, css, vendor -> symlinks into the Dashboard checkout
# Usage: DASHBOARD_ROOT=/path/to/dashboard.msfgco.com ./build-harness.sh
set -euo pipefail
here=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
root=${DASHBOARD_ROOT:?set DASHBOARD_ROOT to the Dashboard checkout}
out="$here/harness"
mkdir -p "$out"
ln -sfn "$root/js" "$out/js"
ln -sfn "$root/css" "$out/css"
ln -sfn "$root/vendor" "$out/vendor"
awk '/id="webinarStudioModal"/{f=1} f{print} /^  <\/section>$/{if(f){exit}}' "$root/index.html" > "$out/modal.fragment.html"
cat "$here/harness-head.html" "$out/modal.fragment.html" "$here/harness-tail.html" > "$out/studio.html"
echo "harness ready: $out/studio.html"
echo "run: cd $here && node studio-insert.run.mjs"
