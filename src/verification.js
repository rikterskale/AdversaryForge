import {createSandboxProfile} from './sandbox.js';

const CHECK_IDS = Object.freeze(['static-analysis', 'unit-tests', 'negative-policy', 'sandbox-behavior', 'documentation']);

function freezeCheck(check) {
  return Object.freeze({id: check.id, status: check.status, evidence: Object.freeze([...check.evidence])});
}

export function createVerificationRun(project) {
  if (!project?.name) throw new Error('project is required');
  return Object.freeze({
    projectName: project.name,
    status: 'pending',
    sandbox: createSandboxProfile(project.capability),
    checks: Object.freeze(CHECK_IDS.map(id => freezeCheck({id, status: 'pending', evidence: []})))
  });
}

export function recordVerificationResult(run, checkId, result) {
  if (!run?.checks) return {ok: false, run, reason: 'verification run is required'};
  const index = run.checks.findIndex(check => check.id === checkId);
  if (index < 0) return {ok: false, run, reason: `unknown verification check: ${checkId}`};
  if (run.checks[index].status !== 'pending') return {ok: false, run, reason: 'verification check is already recorded'};
  if (!['passed', 'failed'].includes(result?.status)) return {ok: false, run, reason: 'result status must be passed or failed'};
  if (!Array.isArray(result.evidence) || result.evidence.length === 0) return {ok: false, run, reason: 'verification evidence is required'};
  const checks = run.checks.map((check, current) => current === index ? freezeCheck({id: check.id, status: result.status, evidence: result.evidence}) : check);
  const status = checks.some(check => check.status === 'failed') ? 'failed' : checks.every(check => check.status === 'passed') ? 'passed' : 'pending';
  return {ok: true, run: Object.freeze({projectName: run.projectName, status, checks: Object.freeze(checks)}), reason: null};
}

export function summarizeVerification(run) {
  const counts = run.checks.reduce((summary, check) => ({...summary, [check.status]: summary[check.status] + 1}), {pending: 0, passed: 0, failed: 0});
  return Object.freeze({status: run.status, ...counts, ready: run.status === 'passed'});
}
