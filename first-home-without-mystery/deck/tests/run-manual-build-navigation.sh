#!/usr/bin/env bash
set -euo pipefail

script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
deck_dir=$(cd -- "$script_dir/.." && pwd)
pwcli=${PWCLI:-/Users/zacharyzink/.codex/skills/playwright/scripts/playwright_cli.sh}
session="manual-build-navigation-$$"
server_pid=''

cleanup() {
  "$pwcli" -s="$session" close >/dev/null 2>&1 || true
  if [[ -n $server_pid ]] && kill -0 "$server_pid" >/dev/null 2>&1; then
    kill "$server_pid" >/dev/null 2>&1 || true
    wait "$server_pid" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT INT TERM

python3 -m http.server 4205 --bind 127.0.0.1 --directory "$deck_dir" >/dev/null 2>&1 &
server_pid=$!
for _ in {1..50}; do
  if curl --fail --silent http://127.0.0.1:4205/ >/dev/null 2>&1; then break; fi
  sleep .1
done

"$pwcli" -s="$session" open http://127.0.0.1:4205/ >/dev/null
result=$("$pwcli" --raw -s="$session" run-code --filename="$script_dir/manual-build-navigation.run.js")
printf '%s\n' "$result"
node -e 'const value=JSON.parse(process.argv[1]); process.exit(value.status === "pass" ? 0 : 1)' "$result"
