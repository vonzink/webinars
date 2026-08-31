#!/usr/bin/env bash
set -uo pipefail

script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
webinar_dir=$(cd "$script_dir/.." && pwd)
session="le-cd-audit-$$"
pwcli=${PWCLI:-/Users/zacharyzink/.codex/skills/playwright/scripts/playwright_cli.sh}
server_pid=''
browser_opened=0
cleanup_done=0
emitted=0
failure_step=''
failure_code=1
audit='null'
owned_server=false
audit_work_dir=''
cleanup_failures=()

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

run_pwcli() {
  (cd "$audit_work_dir" && "$pwcli" "$@")
}

perform_cleanup() {
  (( cleanup_done == 1 )) && return
  cleanup_done=1

  if (( browser_opened == 1 )); then
    run_pwcli -s="$session" close >/dev/null 2>&1
    local close_status=$?
    (( close_status == 0 )) || record_cleanup_failure 'browser-close'

    local sessions
    sessions=$(run_pwcli -s="$session" list 2>&1)
    local list_status=$?
    if (( list_status != 0 )); then
      record_cleanup_failure 'browser-session-list'
    elif grep -Fq "$session" <<<"$sessions"; then
      record_cleanup_failure 'browser-session-still-open'
    fi
  fi

  if [[ -n $audit_work_dir ]]; then
    rm -r -- "$audit_work_dir" >/dev/null 2>&1
    local remove_status=$?
    (( remove_status == 0 )) || record_cleanup_failure 'audit-work-dir-remove'
    [[ ! -e $audit_work_dir ]] || record_cleanup_failure 'audit-work-dir-still-exists'
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
    kill -0 "$server_pid" >/dev/null 2>&1 && record_cleanup_failure 'server-pid-survived-wait'
  fi
}

emit_result() {
  local cleanup_json='[]'
  if (( ${#cleanup_failures[@]} > 0 )); then
    cleanup_json=$(printf '%s\n' "${cleanup_failures[@]}" | node -e '
      let input = "";
      process.stdin.on("data", chunk => { input += chunk; });
      process.stdin.on("end", () => console.log(JSON.stringify(input.trim().split("\n").filter(Boolean))));
    ')
  fi
  node -e '
    const [auditRaw, step, code, cleanupRaw, ownedServer] = process.argv.slice(1);
    let audit;
    try { audit = JSON.parse(auditRaw); }
    catch { audit = { status: "fail", failures: ["runner: invalid audit JSON"] }; }
    const cleanupFailures = JSON.parse(cleanupRaw);
    const status = !step && cleanupFailures.length === 0 && audit.status === "pass" ? "pass" : "fail";
    console.log(JSON.stringify({
      ...audit,
      status,
      runnerFailure: step ? { step, exitCode: Number(code) || 1 } : null,
      cleanup: { browserSessionClosed: !cleanupFailures.some(item => item.startsWith("browser-")), ownedServerStopped: ownedServer === "true", failures: cleanupFailures },
    }));
  ' "$audit" "$failure_step" "$failure_code" "$cleanup_json" "$owned_server"
  emitted=1
}

on_exit() {
  local exit_code=$?
  trap - EXIT INT TERM
  if (( emitted == 0 )); then
    (( exit_code == 0 )) && exit_code=1
    mark_failure 'unexpected' "$exit_code"
    perform_cleanup
    emit_result
  fi
  exit "$exit_code"
}

trap on_exit EXIT
trap 'mark_failure signal-int 130; exit 130' INT
trap 'mark_failure signal-term 143; exit 143' TERM

if (( $# > 1 )); then
  mark_failure 'arguments' 2
fi
if [[ ! -x $pwcli ]]; then
  mark_failure 'playwright-cli' 1
fi
if [[ -z $failure_step ]]; then
  audit_work_dir=$(mktemp -d "${TMPDIR:-/tmp}/le-cd-audit.XXXXXX")
  work_dir_status=$?
  (( work_dir_status == 0 )) || mark_failure 'audit-work-dir' "$work_dir_status"
fi

base_url=${1:-}
if [[ -z $failure_step && -z $base_url ]]; then
  python3 -m http.server 4177 --bind 127.0.0.1 --directory "$webinar_dir" >/dev/null 2>&1 &
  server_pid=$!
  owned_server=true
  base_url='http://127.0.0.1:4177/'
  ready=0
  for _ in {1..60}; do
    if ! kill -0 "$server_pid" >/dev/null 2>&1; then
      mark_failure 'server-readiness' 1
      break
    fi
    if curl --fail --silent "$base_url" >/dev/null 2>&1; then
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
  run_pwcli -s="$session" open "$base_url" >/dev/null 2>&1
  open_status=$?
  if (( open_status != 0 )); then
    mark_failure 'browser-open' "$open_status"
  else
    browser_opened=1
  fi
fi

if [[ -z $failure_step ]]; then
  audit_output=$(run_pwcli --raw -s="$session" run-code --filename="$script_dir/browser-audit.run.js" 2>/dev/null)
  audit_status=$?
  if (( audit_status != 0 )); then
    mark_failure 'browser-audit' "$audit_status"
  else
    audit=$(node -e '
      let value = JSON.parse(process.argv[1]);
      if (typeof value === "string") value = JSON.parse(value);
      process.stdout.write(JSON.stringify(value));
    ' "$audit_output" 2>/dev/null)
    normalize_status=$?
    if (( normalize_status != 0 )); then
      mark_failure 'browser-audit-json' "$normalize_status"
    elif ! node -e 'const value=JSON.parse(process.argv[1]); process.exit(value?.status === "pass" ? 0 : 1)' "$audit" >/dev/null 2>&1; then
      mark_failure 'browser-audit' 1
    fi
  fi
fi

if [[ -z $failure_step ]]; then
  console_output=$(run_pwcli -s="$session" console warning 2>&1)
  console_status=$?
  if (( console_status != 0 )) \
      || [[ $console_output != *'Errors: 0, Warnings: 0'* ]] \
      || [[ $console_output != *'Total messages: 0'* ]]; then
    mark_failure 'console' "${console_status:-1}"
  fi
fi

if [[ -z $failure_step ]]; then
  requests_output=$(run_pwcli -s="$session" requests --static 2>&1)
  requests_status=$?
  if (( requests_status != 0 )); then
    mark_failure 'network' "$requests_status"
  else
    read -r request_count expected_failure_count bad_response_count < <(awk '
      /=> \[[0-9][0-9][0-9]\]/ {
        count += 1
        if ($0 !~ /=> \[(2[0-9][0-9]|304)\]/) bad += 1
      }
      /=> \[(FAILED|ERR)/ {
        count += 1
        if ($0 ~ /\/cd-page-5\.png => \[FAILED\] net::ERR_FAILED$/) expected += 1
        else bad += 1
      }
      END { print count + 0, expected + 0, bad + 0 }
    ' <<<"$requests_output")
    # At least one deliberate cd-page-5.png abort per viewport; the page-nav
    # thumbnails can add more during the abort window, so the count is a floor.
    if (( request_count == 0 || expected_failure_count < 5 || bad_response_count != 0 )); then
      mark_failure 'network' 1
    fi
  fi
fi

perform_cleanup
if [[ -n $failure_step || ${#cleanup_failures[@]} -gt 0 ]]; then
  [[ -n $failure_step ]] || mark_failure 'cleanup' 1
  emit_result
  exit 1
fi

emit_result
exit 0
