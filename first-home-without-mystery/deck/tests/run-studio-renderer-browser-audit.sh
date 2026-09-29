#!/usr/bin/env bash
set -euo pipefail

script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
deck_dir=$(cd -- "$script_dir/.." && pwd)
pwcli=${PWCLI:-/Users/zacharyzink/.codex/skills/playwright/scripts/playwright_cli.sh}
session="studio-renderer-$PPID-$$"
port=${STUDIO_RENDERER_AUDIT_PORT:-$((43000 + $$ % 1000))}
server_pid=''

cleanup() {
  "$pwcli" -s="$session" close >/dev/null 2>&1 || true
  if [[ -n $server_pid ]] && kill -0 "$server_pid" >/dev/null 2>&1; then
    kill "$server_pid" >/dev/null 2>&1 || true
    wait "$server_pid" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT INT TERM

mkdir -p "$deck_dir/output/playwright/studio-renderer"
python3 -m http.server "$port" --bind 127.0.0.1 --directory "$deck_dir" >/dev/null 2>&1 &
server_pid=$!
ready='false'
for _ in {1..80}; do
  if curl --fail --silent "http://127.0.0.1:$port/tests/fixtures/studio-live-bundle.json" >/dev/null 2>&1; then
    ready='true'
    break
  fi
  sleep .1
done
if [[ $ready != 'true' ]]; then
  printf 'Studio renderer fixture server did not start on 127.0.0.1:%s\n' "$port" >&2
  exit 1
fi

cd "$deck_dir"
"$pwcli" -s="$session" open "http://127.0.0.1:$port/tests/fixtures/studio-live-bundle.json" >/dev/null
set +e
result=$("$pwcli" --raw -s="$session" run-code --filename="$script_dir/studio-renderer-browser.run.js")
run_status=$?
set -e
printf '%s\n' "$result"
if (( run_status != 0 )); then exit "$run_status"; fi
node -e 'const value=JSON.parse(process.argv[1]); process.exit(value.status === "pass" ? 0 : 1)' "$result"
