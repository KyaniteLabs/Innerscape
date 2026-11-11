import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { moduleMap, planningPrompt, projectBrief } from '../innerscape-cli.mjs';

const cli = fileURLToPath(new URL('../innerscape-cli.mjs', import.meta.url));

function run(args, file = cli) {
  return spawnSync(process.execPath, [file, ...args], { encoding: 'utf8' });
}

test('brief names the five modules and keeps the support guardrail', () => {
  const brief = projectBrief();
  assert.equal(brief.name, 'Innerscape');
  assert.deepEqual(
    brief.modules.map((m) => m.name),
    ['Mind', 'Flow', 'Body', 'Hub', 'Trade'],
  );
  assert.match(brief.guardrail, /Do not diagnose/);
  assert.deepEqual(moduleMap().modules, brief.modules);
});

test('plan fills defaults and carries the given focus', () => {
  assert.deepEqual(
    [planningPrompt().focus, planningPrompt().energy, planningPrompt().horizon],
    ['general', 'unknown', 'today'],
  );
  const plan = planningPrompt({ focus: 'weekly review', energy: 'low' });
  assert.match(plan.prompt[0], /weekly review/);
  assert.match(plan.prompt[1], /low/);
});

test('each command prints JSON on stdout', () => {
  assert.equal(JSON.parse(run(['brief']).stdout).name, 'Innerscape');
  assert.equal(JSON.parse(run(['modules']).stdout).modules.length, 5);
  const plan = JSON.parse(
    run(['plan', '--focus', 'sleep', '--energy', 'high', '--horizon', 'week']).stdout,
  );
  assert.deepEqual([plan.focus, plan.energy, plan.horizon], ['sleep', 'high', 'week']);
});

test('an unknown command prints usage on stderr and exits 2', () => {
  const out = run(['nope']);
  assert.equal(out.status, 2);
  assert.equal(out.stdout, '');
  assert.match(out.stderr, /Usage: innerscape/);
});

test('the CLI still runs when launched through a symlink, as npm links bins', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'innerscape-bin-'));
  try {
    const link = path.join(dir, 'innerscape');
    symlinkSync(cli, link);
    const out = execFileSync(process.execPath, [link, 'modules'], { encoding: 'utf8' });
    assert.equal(JSON.parse(out).modules.length, 5);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
