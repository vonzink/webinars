import test from 'node:test';
import assert from 'node:assert/strict';
import {
  chmodSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const runner = new URL('./run-fit-browser-audit.sh', import.meta.url).pathname;

function executable(path, source) {
  writeFileSync(path, source);
  chmodSync(path, 0o755);
}

function makeHarness() {
  const root = mkdtempSync(join(tmpdir(), 'fit-browser-runner-'));
  const bin = join(root, 'bin');
  const log = join(root, 'commands.log');
  mkdirSync(bin);
  const cli = join(bin, 'fake-playwright-cli');
  executable(cli, `#!/usr/bin/env bash
set -u
printf '%s\\n' "$*" >> "$FAKE_COMMAND_LOG"
command_name=''
filename=''
session=''
for argument in "$@"; do
  case "$argument" in
    open|run-code|console|requests|close|list) command_name=$argument ;;
    --filename=*) filename=\${argument#--filename=} ;;
    -s=*) session=\${argument#-s=} ;;
  esac
done
case "$command_name" in
  open) exit 0 ;;
  run-code)
    case "\${FAKE_SCENARIO:-success}:$filename" in
      matrix_fail:*fit-browser-matrix.run.js) exit 11 ;;
      interaction_fail:*fit-browser-interactions.run.js) exit 12 ;;
      visual_fail:*fit-browser-visuals.run.js) exit 13 ;;
    esac
    printf '%s\\n' '{"status":"pass"}'
    ;;
  console)
    if [[ \${FAKE_SCENARIO:-success} == console_fail ]]; then
      printf '%s\\n' 'Errors: 1, Warnings: 0' 'Returning 1 messages'
    else
      printf '%s\\n' 'Errors: 0, Warnings: 0' 'Returning 0 messages'
    fi
    ;;
  requests)
    if [[ \${FAKE_SCENARIO:-success} == network_fail ]]; then
      printf '%s\\n' '1. [GET] http://deck.invalid/failure => [500] Error'
    else
      printf '%s\\n' '1. [GET] http://deck.invalid/ => [200] OK'
    fi
    ;;
  close)
    [[ \${FAKE_SCENARIO:-success} == cleanup_close_fail ]] && exit 21
    exit 0
    ;;
  list)
    if [[ \${FAKE_SCENARIO:-success} == cleanup_session_leak ]]; then
      printf '%s\\n' "$session"
    else
      printf '%s\\n' 'No browser sessions'
    fi
    ;;
esac
`);
  return { root, bin, log, cli };
}

function runScenario(scenario, { ownedServer = false } = {}) {
  const harness = makeHarness();
  if (ownedServer) {
    executable(join(harness.bin, 'curl'), '#!/usr/bin/env bash\nexit 0\n');
    executable(join(harness.bin, 'python3'), `#!/usr/bin/env bash
trap 'exit 42' TERM
while :; do read -r -t 0.05 _ || true; done
`);
  }
  const result = spawnSync('bash', [runner, ...(ownedServer ? [] : ['http://deck.invalid/'])], {
    encoding: 'utf8',
    timeout: 10000,
    env: {
      ...process.env,
      PATH: `${harness.bin}:${process.env.PATH}`,
      PWCLI: harness.cli,
      FAKE_COMMAND_LOG: harness.log,
      FAKE_SCENARIO: scenario,
      FIT_AUDIT_PORT: '48991',
    },
  });
  const outputLines = `${result.stdout}${result.stderr}`.trim().split('\n').filter(Boolean);
  const commandLog = readFileSync(harness.log, 'utf8');
  rmSync(harness.root, { recursive: true, force: true });
  return { ...result, outputLines, commandLog };
}

function oneJson(result) {
  assert.equal(result.outputLines.length, 1, `expected one JSON object, got:\n${result.outputLines.join('\n')}`);
  return JSON.parse(result.outputLines[0]);
}

test('runner emits one pass object only after browser cleanup is verified', () => {
  const result = runScenario('success');
  const output = oneJson(result);

  assert.equal(result.status, 0, JSON.stringify({ output: result.outputLines, commands: result.commandLog }));
  assert.equal(output.status, 'pass');
  assert.match(result.commandLog, / close\n/);
  assert.match(result.commandLog, / list\n/);
});

test('each browser audit step failure emits one failure object and exits nonzero', () => {
  for (const [scenario, step] of [
    ['matrix_fail', 'matrix'],
    ['interaction_fail', 'interactions'],
    ['visual_fail', 'visuals'],
    ['console_fail', 'console'],
    ['network_fail', 'network'],
  ]) {
    const result = runScenario(scenario);
    const output = oneJson(result);
    assert.notEqual(result.status, 0, scenario);
    assert.equal(output.status, 'fail', scenario);
    assert.equal(output.failure.step, step, scenario);
  }
});

test('browser close failure or surviving session turns an otherwise passing run into one failure object', () => {
  for (const [scenario, expectedCleanup] of [
    ['cleanup_close_fail', 'browser-close'],
    ['cleanup_session_leak', 'browser-session-still-open'],
  ]) {
    const result = runScenario(scenario);
    const output = oneJson(result);
    assert.notEqual(result.status, 0, scenario);
    assert.equal(output.status, 'fail', scenario);
    assert.ok(output.cleanupFailures.includes(expectedCleanup), scenario);
  }
});

test('owned server wait failure is reported once after the process is gone', () => {
  const result = runScenario('server_wait_fail', { ownedServer: true });
  const output = oneJson(result);

  assert.notEqual(result.status, 0);
  assert.equal(output.status, 'fail');
  assert.ok(output.cleanupFailures.includes('server-wait-42'));
});
