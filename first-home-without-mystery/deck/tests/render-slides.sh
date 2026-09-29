#!/usr/bin/env bash
set -euo pipefail

script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
deck_dir=$(cd -- "$script_dir/.." && pwd)
pwcli=${PWCLI:-/Users/zacharyzink/.codex/skills/playwright/scripts/playwright_cli.sh}
session="first-home-render-$$"
server_pid=''

cleanup() {
  "$pwcli" -s="$session" close >/dev/null 2>&1 || true
  if [[ -n $server_pid ]] && kill -0 "$server_pid" >/dev/null 2>&1; then
    kill "$server_pid" >/dev/null 2>&1 || true
    wait "$server_pid" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT INT TERM

mkdir -p "$deck_dir/output/playwright"
python3 -m http.server 4199 --bind 127.0.0.1 --directory "$deck_dir" >/dev/null 2>&1 &
server_pid=$!
for _ in {1..50}; do
  if curl --fail --silent http://127.0.0.1:4199/ >/dev/null 2>&1; then break; fi
  sleep .1
done

"$pwcli" -s="$session" open http://127.0.0.1:4199/#opening >/dev/null
"$pwcli" --raw -s="$session" run-code --filename="$script_dir/render-slides.run.js"
