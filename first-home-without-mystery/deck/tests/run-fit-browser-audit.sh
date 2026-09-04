#!/usr/bin/env bash
set -euo pipefail

script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
deck_dir=$(cd -- "$script_dir/.." && pwd)
pwcli=${PWCLI:-/Users/zacharyzink/.codex/skills/playwright/scripts/playwright_cli.sh}
session="first-home-fit-$$"
server_pid=''

cleanup() {
  "$pwcli" -s="$session" close >/dev/null 2>&1 || true
  if [[ -n $server_pid ]] && kill -0 "$server_pid" >/dev/null 2>&1; then
    kill "$server_pid" >/dev/null 2>&1 || true
    wait "$server_pid" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT INT TERM

python3 -m http.server 4198 --bind 127.0.0.1 --directory "$deck_dir" >/dev/null 2>&1 &
server_pid=$!
for _ in {1..50}; do
  if curl --fail --silent http://127.0.0.1:4198/ >/dev/null 2>&1; then break; fi
  sleep .1
done

"$pwcli" -s="$session" open http://127.0.0.1:4198/#opening >/dev/null
matrix=$("$pwcli" --raw -s="$session" run-code --filename="$script_dir/fit-browser-matrix.run.js")
node -e 'const value=JSON.parse(process.argv[1]); process.exit(value.status === "pass" ? 0 : 1)' "$matrix"

console_output=$("$pwcli" -s="$session" console warning)
if [[ $console_output != *'Errors: 0, Warnings: 0'* ]]; then
  printf '%s\n' "$console_output" >&2
  exit 1
fi

requests_output=$("$pwcli" -s="$session" requests --static)
request_count=$(awk '/=> \[[0-9][0-9][0-9]\]/ { count += 1 } END { print count + 0 }' <<<"$requests_output")
bad_request_count=$(awk '/=> \[[0-9][0-9][0-9]\]/ && $0 !~ /=> \[(2[0-9][0-9]|304)\]/ { count += 1 } END { print count + 0 }' <<<"$requests_output")
if (( request_count == 0 || bad_request_count != 0 )); then exit 1; fi

printf '{"status":"pass","matrix":%s,"console":{"errors":0,"warnings":0},"network":{"requests":%d,"failedResponses":0}}\n' "$matrix" "$request_count"
