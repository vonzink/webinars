#!/usr/bin/env bash
# Private Webinar Studio browser acceptance (Editor Task 9).
# Requires a Dashboard checkout (DASHBOARD_ROOT) and the Playwright CLI: set PWCLI, or
# put playwright_cli.sh on PATH; the last entry is the historical local install path.
# Local only: two loopback servers, no deployment, no production hosts.
set -euo pipefail

script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
deck_dir=$(cd -- "$script_dir/.." && pwd)
dashboard_root=${DASHBOARD_ROOT:?set DASHBOARD_ROOT to the dashboard.msfgco.com checkout}
pwcli=${PWCLI:-$(command -v playwright_cli.sh 2>/dev/null || echo /Users/zacharyzink/.codex/skills/playwright/scripts/playwright_cli.sh)}
session="webinar-studio-$PPID-$$"
dashboard_port=${WEBINAR_STUDIO_DASHBOARD_PORT:-$((44000 + $$ % 1000))}
audience_port=$((dashboard_port + 1))
dashboard_origin="http://127.0.0.1:$dashboard_port"
audience_origin="http://127.0.0.1:$audience_port"
harness="$script_dir/webinar-studio-harness/harness"
pids=()

cleanup() {
  "$pwcli" -s="$session" close >/dev/null 2>&1 || true
  for pid in "${pids[@]:-}"; do
    if [[ -n $pid ]] && kill -0 "$pid" >/dev/null 2>&1; then
      kill "$pid" >/dev/null 2>&1 || true
      wait "$pid" >/dev/null 2>&1 || true
    fi
  done
}
trap cleanup EXIT INT TERM

DASHBOARD_ROOT="$dashboard_root" DASHBOARD_ORIGIN="$dashboard_origin" AUDIENCE_ORIGIN="$audience_origin" \
  "$script_dir/webinar-studio-harness/build-harness.sh" >/dev/null
mkdir -p "$deck_dir/output/playwright/webinar-studio"

python3 -m http.server "$dashboard_port" --bind 127.0.0.1 --directory "$harness/dashboard" >/dev/null 2>&1 &
pids+=($!)
python3 -m http.server "$audience_port" --bind 127.0.0.1 --directory "$harness/audience" >/dev/null 2>&1 &
pids+=($!)
for url in "$dashboard_origin/studio.html" "$audience_origin/webinars/first-home-without-mystery/studio-viewer.html"; do
  ready='false'
  for _ in {1..80}; do
    if curl --fail --silent "$url" >/dev/null 2>&1; then ready='true'; break; fi
    sleep .1
  done
  if [[ $ready != 'true' ]]; then
    printf 'Webinar Studio harness server did not answer at %s\n' "$url" >&2
    exit 1
  fi
done

cd "$deck_dir"
"$pwcli" -s="$session" open "$dashboard_origin/studio.html" >/dev/null
set +e
result=$("$pwcli" --raw -s="$session" run-code --filename="$script_dir/webinar-studio-browser.run.js")
run_status=$?
set -e
printf '%s\n' "$result"
if (( run_status != 0 )); then exit "$run_status"; fi
node -e 'const value=JSON.parse(process.argv[1]); process.exit(value.status === "pass" ? 0 : 1)' "$result"
