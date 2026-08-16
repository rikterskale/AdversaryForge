import {validateSandboxProfile} from './sandbox.js';

const FIXTURE_COMMAND = Object.freeze(['node', 'fixtures/run-check.mjs']);

export function createFixturePlan(run) {
  if (!run?.checks) throw new Error('verification run is required');
  const sandbox = validateSandboxProfile(run.sandbox);
  if (!sandbox.allowed) throw new Error(`unsafe sandbox profile: ${sandbox.reasons.join('; ')}`);
  if (!Array.isArray(run.checks) || run.checks.length === 0) throw new Error('verification checks are required');
  if (run.checks.some(check => !check?.id)) throw new Error('verification check id is required');
  return Object.freeze({
    mode: 'fixture-only', execution: 'planned', network: run.sandbox.network,
    credentials: 'deny', process: 'deny', cwd: 'fixtures', command: FIXTURE_COMMAND,
    checks: Object.freeze(run.checks.map(check => Object.freeze({id: check.id, status: 'planned'})))
  });
}
