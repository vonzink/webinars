#!/usr/bin/env bash
set -uo pipefail

script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
repo_root=$(git -C "$script_dir" rev-parse --show-toplevel)
deck_dir=$(cd "$script_dir/.." && pwd)
session="fit-browser-audit-$$"
server_pid=''
pwcli=''
browser_opened=0
cleanup_done=0
emitted=0
failure_step=''
failure_code=1
cleanup_failures=()
matrix='null'
interactions='null'
visuals='null'
request_count=0
bad_request_count=0

mark_failure() {
  if [[ -z $failure_step ]]; then
    failure_step=$1
    failure_code=${2:-1}
    (( failure_code == 0 )) && failure_code=1
  fi
}

record_cleanup_failure() {
  cleanup_failures+=("$1")
}

perform_cleanup() {
  (( cleanup_done == 1 )) && return
  cleanup_done=1

  if (( browser_opened == 1 )); then
    "$pwcli" -s="$session" close >/dev/null 2>&1
    local close_status=$?
    (( close_status == 0 )) || record_cleanup_failure 'browser-close'

    local list_output
    list_output=$("$pwcli" -s="$session" list 2>&1)
    local list_status=$?
    if (( list_status != 0 )); then
      record_cleanup_failure 'browser-session-list'
    elif grep -Fq "$session" <<<"$list_output"; then
      record_cleanup_failure 'browser-session-still-open'
    fi
  fi

  if [[ -n $server_pid ]]; then
    if ! kill -0 "$server_pid" >/dev/null 2>&1; then
      wait "$server_pid" >/dev/null 2>&1
      record_cleanup_failure "server-exited-before-cleanup-$?"
      return
    fi

    kill "$server_pid" >/dev/null 2>&1
    local kill_status=$?
    (( kill_status == 0 )) || record_cleanup_failure 'server-kill'

    for _ in {1..50}; do
      kill -0 "$server_pid" >/dev/null 2>&1 || break
      sleep 0.02
    done
    if kill -0 "$server_pid" >/dev/null 2>&1; then
      record_cleanup_failure 'server-still-running-after-term'
      kill -KILL "$server_pid" >/dev/null 2>&1
      local force_status=$?
      (( force_status == 0 )) || record_cleanup_failure 'server-force-kill'
    fi

    wait "$server_pid" >/dev/null 2>&1
    local wait_status=$?
    if (( wait_status != 0 && wait_status != 137 && wait_status != 143 )); then
      record_cleanup_failure "server-wait-$wait_status"
    fi
    if kill -0 "$server_pid" >/dev/null 2>&1; then
      record_cleanup_failure 'server-pid-survived-wait'
    fi
  fi
}

emit_failure() {
  printf '{"status":"fail","failure":{"step":"%s","exitCode":%d},"cleanupFailures":[' \
    "${failure_step:-unexpected}" "$failure_code"
  local separator=''
  local item
  if (( ${#cleanup_failures[@]} > 0 )); then
    for item in "${cleanup_failures[@]}"; do
      printf '%s"%s"' "$separator" "$item"
      separator=','
    done
  fi
  printf ']}\n'
  emitted=1
}

emit_pass() {
  printf '{"status":"pass","baseUrl":"%s","matrix":%s,"interactions":%s,"visuals":%s,"console":{"errors":0,"warnings":0},"network":{"requests":%d,"failedResponses":0},"cleanup":{"browserSessionClosed":true,"ownedServerStopped":%s}}\n' \
    "$base_url" "$matrix" "$interactions" "$visuals" "$request_count" "$owned_server_json"
  emitted=1
}

on_exit() {
  local exit_code=$?
  trap - EXIT INT TERM
  if (( emitted == 0 )); then
    (( exit_code == 0 )) && exit_code=1
    mark_failure 'unexpected' "$exit_code"
    perform_cleanup
    emit_failure
  fi
  exit "$exit_code"
}
trap on_exit EXIT
trap 'mark_failure signal-int 130; exit 130' INT
trap 'mark_failure signal-term 143; exit 143' TERM

if (( $# > 1 )); then
  mark_failure 'arguments' 2
fi

if [[ -z $failure_step ]]; then
  if [[ -n ${PWCLI:-} ]]; then
    pwcli=$PWCLI
  elif command -v playwright-cli >/dev/null 2>&1; then
    pwcli=$(command -v playwright-cli)
  elif [[ -x ${HOME}/.codex/skills/playwright/scripts/playwright_cli.sh ]]; then
    pwcli=${HOME}/.codex/skills/playwright/scripts/playwright_cli.sh
  else
    mark_failure 'playwright-cli' 1
  fi
fi

base_url=${1:-}
owned_server_json=false
if [[ -z $failure_step && -z $base_url ]]; then
  port=${FIT_AUDIT_PORT:-4196}
  python3 -m http.server "$port" --bind 127.0.0.1 --directory "$deck_dir" >/dev/null 2>&1 &
  server_pid=$!
  owned_server_json=true
  base_url="http://127.0.0.1:${port}/"
  ready=0
  for _ in {1..60}; do
    if ! kill -0 "$server_pid" >/dev/null 2>&1; then
      mark_failure 'server-readiness' 1
      break
    fi
    if curl --fail --silent --show-error "$base_url" >/dev/null 2>&1; then
      ready=1
      break
    fi
    sleep 0.1
  done
  (( ready == 1 )) || mark_failure 'server-readiness' 1
elif [[ -n $base_url && $base_url != */ ]]; then
  base_url="${base_url}/"
fi

if [[ -z $failure_step ]]; then
  cd "$repo_root" || mark_failure 'repo-root' 1
fi

if [[ -z $failure_step ]]; then
  open_output=$("$pwcli" -s="$session" open "${base_url}#myths" 2>&1)
  open_status=$?
  if (( open_status != 0 )); then
    mark_failure 'browser-open' "$open_status"
  else
    browser_opened=1
  fi
fi

validate_pass_json() {
  node -e 'const value=JSON.parse(process.argv[1]); process.exit(value?.status === "pass" ? 0 : 1)' "$1" >/dev/null 2>&1
}

run_browser_step() {
  local step=$1
  local filename=$2
  local output
  output=$("$pwcli" --raw -s="$session" run-code --filename="$filename" 2>&1)
  local step_status=$?
  if (( step_status != 0 )); then
    mark_failure "$step" "$step_status"
    return
  fi
  if ! validate_pass_json "$output"; then
    mark_failure "$step" 1
    return
  fi
  printf -v "$3" '%s' "$output"
}

if [[ -z $failure_step ]]; then
  run_browser_step matrix "$script_dir/fit-browser-matrix.run.js" matrix
fi
if [[ -z $failure_step ]]; then
  run_browser_step interactions "$script_dir/fit-browser-interactions.run.js" interactions
fi
if [[ -z $failure_step ]]; then
  run_browser_step visuals "$script_dir/fit-browser-visuals.run.js" visuals
fi

if [[ -z $failure_step ]]; then
  console_output=$("$pwcli" -s="$session" console warning 2>&1)
  console_status=$?
  if (( console_status != 0 )) \
      || [[ $console_output != *'Errors: 0, Warnings: 0'* ]] \
      || [[ $console_output != *'Returning 0 messages'* ]]; then
    mark_failure 'console' "${console_status:-1}"
  fi
fi

if [[ -z $failure_step ]]; then
  requests_output=$("$pwcli" -s="$session" requests --static 2>&1)
  requests_status=$?
  if (( requests_status != 0 )); then
    mark_failure 'network' "$requests_status"
  else
    read -r request_count bad_request_count < <(awk '
      /=> \[[0-9][0-9][0-9]\]/ {
        count += 1
        if ($0 !~ /=> \[(2[0-9][0-9]|304)\]/) bad += 1
      }
      END { print count + 0, bad + 0 }
    ' <<<"$requests_output")
    if (( request_count == 0 || bad_request_count != 0 )); then
      mark_failure 'network' 1
    fi
  fi
fi

perform_cleanup
if [[ -n $failure_step || ${#cleanup_failures[@]} -gt 0 ]]; then
  [[ -n $failure_step ]] || mark_failure 'cleanup' 1
  emit_failure
  exit 1
fi

emit_pass
exit 0
