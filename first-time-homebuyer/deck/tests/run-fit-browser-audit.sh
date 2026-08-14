#!/usr/bin/env bash
set -euo pipefail

script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
repo_root=$(git -C "$script_dir" rev-parse --show-toplevel)
deck_dir=$(cd "$script_dir/.." && pwd)
session="fit-browser-audit-$$"
server_pid=''

if [[ -n ${PWCLI:-} ]]; then
  pwcli=$PWCLI
elif command -v playwright-cli >/dev/null 2>&1; then
  pwcli=$(command -v playwright-cli)
elif [[ -x ${HOME}/.codex/skills/playwright/scripts/playwright_cli.sh ]]; then
  pwcli=${HOME}/.codex/skills/playwright/scripts/playwright_cli.sh
else
  printf '%s\n' '{"status":"fail","error":"playwright-cli not found; set PWCLI to its executable path"}' >&2
  exit 1
fi

cleanup() {
  "$pwcli" -s="$session" close >/dev/null 2>&1 || true
  if [[ -n $server_pid ]]; then
    kill "$server_pid" >/dev/null 2>&1 || true
    wait "$server_pid" >/dev/null 2>&1 || true
  fi
}

on_exit() {
  local exit_code=$?
  trap - EXIT INT TERM
  cleanup
  if (( exit_code != 0 )); then
    printf '{"status":"fail","exitCode":%d}\n' "$exit_code" >&2
  fi
  exit "$exit_code"
}
trap on_exit EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

if (( $# > 1 )); then
  printf '%s\n' 'usage: tests/run-fit-browser-audit.sh [deck-base-url]' >&2
  exit 2
fi

base_url=${1:-}
if [[ -z $base_url ]]; then
  port=${FIT_AUDIT_PORT:-4196}
  python3 -m http.server "$port" --bind 127.0.0.1 --directory "$deck_dir" >/dev/null 2>&1 &
  server_pid=$!
  base_url="http://127.0.0.1:${port}/"
  for _ in {1..60}; do
    if ! kill -0 "$server_pid" >/dev/null 2>&1; then
      printf '{"status":"fail","error":"local deck server exited before readiness","port":%s}\n' "$port" >&2
      exit 1
    fi
    if curl --fail --silent --show-error "$base_url" >/dev/null 2>&1; then
      break
    fi
    sleep 0.1
  done
  if ! curl --fail --silent --show-error "$base_url" >/dev/null 2>&1; then
    printf '{"status":"fail","error":"local deck server did not become ready","port":%s}\n' "$port" >&2
    exit 1
  fi
elif [[ $base_url != */ ]]; then
  base_url="${base_url}/"
fi

cd "$repo_root"
"$pwcli" -s="$session" open "${base_url}#myths" >/dev/null

matrix=$("$pwcli" --raw -s="$session" run-code --filename="$script_dir/fit-browser-matrix.run.js")
interactions=$("$pwcli" --raw -s="$session" run-code --filename="$script_dir/fit-browser-interactions.run.js")
visuals=$("$pwcli" --raw -s="$session" run-code --filename="$script_dir/fit-browser-visuals.run.js")

console_output=$("$pwcli" -s="$session" console warning)
if [[ $console_output != *'Errors: 0, Warnings: 0'* || $console_output != *'Returning 0 messages'* ]]; then
  printf '%s\n' '{"status":"fail","error":"browser console contains warnings or errors"}' >&2
  printf '%s\n' "$console_output" >&2
  exit 1
fi

requests_output=$("$pwcli" -s="$session" requests --static)
read -r request_count bad_request_count < <(awk '
  /=> \[[0-9][0-9][0-9]\]/ {
    count += 1
    if ($0 !~ /=> \[(2[0-9][0-9]|304)\]/) bad += 1
  }
  END { print count + 0, bad + 0 }
' <<<"$requests_output")
if (( request_count == 0 || bad_request_count != 0 )); then
  printf '{"status":"fail","error":"network request audit failed","requests":%d,"failedResponses":%d}\n' \
    "$request_count" "$bad_request_count" >&2
  printf '%s\n' "$requests_output" >&2
  exit 1
fi

printf '{"status":"pass","baseUrl":"%s","matrix":%s,"interactions":%s,"visuals":%s,"console":{"errors":0,"warnings":0},"network":{"requests":%d,"failedResponses":0}}\n' \
  "$base_url" "$matrix" "$interactions" "$visuals" "$request_count"
