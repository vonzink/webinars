#!/usr/bin/env bash
# The AI workflows in a real browser: builds the site, serves it, and drives
# Webinar Suite and Slide settings against an in-memory stand-in for the
# saved-edits API (see ai-workflows-browser.run.js). Nothing reaches a server.
set -euo pipefail

script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
repo_root=$(cd -- "$script_dir/../.." && pwd)
pwcli=${PWCLI:-/Users/zacharyzink/.codex/skills/playwright/scripts/playwright_cli.sh}
session="ai-workflows-$$"
build_dir=$(mktemp -d)
server_pid=''

cleanup() {
  "$pwcli" -s="$session" close >/dev/null 2>&1 || true
  if [[ -n $server_pid ]] && kill -0 "$server_pid" >/dev/null 2>&1; then
    kill "$server_pid" >/dev/null 2>&1 || true
    wait "$server_pid" >/dev/null 2>&1 || true
  fi
  rm -rf "$build_dir"
}
trap cleanup EXIT INT TERM

(cd "$repo_root" && node site/build.mjs --no-zip --out "$build_dir" >/dev/null)
mkdir -p "$repo_root/webinar-studio/output/playwright"
python3 -m http.server 4300 --bind 127.0.0.1 --directory "$build_dir/site" >/dev/null 2>&1 &
server_pid=$!
for _ in {1..50}; do
  if curl --fail --silent http://127.0.0.1:4300/webinars/studio/home.html >/dev/null 2>&1; then break; fi
  sleep .1
done

# Open from the repository root: relative screenshot paths in the .run.js resolve against it.
(cd "$repo_root" && "$pwcli" -s="$session" open about:blank) >/dev/null
set +e
result=$("$pwcli" --raw -s="$session" run-code --filename="$script_dir/ai-workflows-browser.run.js")
run_status=$?
set -e
printf '%s\n' "$result"
if (( run_status != 0 )); then exit "$run_status"; fi
node -e 'const value=JSON.parse(process.argv[1]); process.exit(value.status === "pass" ? 0 : 1)' "$result"
