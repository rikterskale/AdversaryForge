import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {advanceWorkflow, createWorkflow, workflowLabel} from '../src/workflow.js';
import {createVerificationRun, recordVerificationResult, summarizeVerification} from '../src/verification.js';
import {appendAuditEvent, createAuditLog, summarizeAudit} from '../src/audit.js';
import {createProvenanceManifest} from '../src/provenance.js';
import {createSandboxProfile, validateSandboxProfile} from '../src/sandbox.js';

const project = {name: 'Workflow test'};
const approved = {allowed: true};

describe('workflow lifecycle', () => {
  it('starts only with an approved policy decision', () => {
    assert.equal(createWorkflow(project, approved).state, 'intake');
    assert.throws(() => createWorkflow(), /project is required/);
    assert.throws(() => createWorkflow(project, {allowed: false}), /approved policy/);
  });

  it('advances through the complete release path', () => {
    let current = createWorkflow(project, approved);
    const steps = [
      ['submit-design', {policyApproved: true}, 'design-review'],
      ['approve-design', {humanApproved: true}, 'implementation'],
      ['submit-verification', {}, 'verification'],
      ['verification-passed', {verificationReady: true}, 'documentation'],
      ['documentation-complete', {docsComplete: true}, 'release-approval'],
      ['release-approved', {humanApproved: true, signedArtifact: true}, 'released']
    ];
    for (const [action, evidence, expected] of steps) {
      const result = advanceWorkflow(current, action, evidence);
      assert.equal(result.ok, true);
      current = result.workflow;
      assert.equal(current.state, expected);
    }
    assert.equal(current.history.length, 6);
    assert.equal(workflowLabel(current.state), 'Released');
    assert.equal(Object.isFrozen(current), true);
  });

  it('supports rejection and recovery', () => {
    let current = createWorkflow(project, approved);
    current = advanceWorkflow(current, 'submit-design', {policyApproved: true}).workflow;
    const rejected = advanceWorkflow(current, 'reject-design');
    assert.equal(rejected.workflow.state, 'intake');
    assert.equal(rejected.workflow.history.length, 2);
    assert.equal(workflowLabel('unknown'), 'Unknown');
  });
});

describe('workflow guards', () => {
  it('blocks missing evidence and invalid actions without changing state', () => {
    const current = createWorkflow(project, approved);
    const noPolicy = advanceWorkflow(current, 'submit-design');
    assert.deepEqual(noPolicy, {ok: false, workflow: current, reason: 'policy approval is required'});
    const invalid = advanceWorkflow(current, 'approve-design', {humanApproved: true});
    assert.match(invalid.reason, /not allowed/);
    assert.equal(advanceWorkflow({...current, state: 'broken'}, 'submit-design').reason, 'unknown workflow state');

    let review = advanceWorkflow(current, 'submit-design', {policyApproved: true}).workflow;
    assert.equal(advanceWorkflow(review, 'approve-design').reason, 'human design approval is required');
    review = advanceWorkflow(review, 'approve-design', {humanApproved: true}).workflow;
    let verification = advanceWorkflow(review, 'submit-verification').workflow;
    assert.equal(advanceWorkflow(verification, 'verification-passed').reason, 'a completed verification run is required');
    verification = advanceWorkflow(verification, 'verification-failed').workflow;
    assert.equal(verification.state, 'implementation');
    let docs = advanceWorkflow(verification, 'submit-verification').workflow;
    docs = advanceWorkflow(docs, 'verification-passed', {verificationReady: true}).workflow;
    assert.equal(advanceWorkflow(docs, 'documentation-complete').reason, 'complete documentation is required');
    docs = advanceWorkflow(docs, 'documentation-complete', {docsComplete: true}).workflow;
    assert.equal(advanceWorkflow(docs, 'release-approved').reason, 'human release approval is required');
    assert.equal(advanceWorkflow(docs, 'release-approved', {humanApproved: true}).reason, 'a signed artifact is required');
  });
});

describe('fixture-first verification', () => {
  it('creates a pending verification run with required checks', () => {
    let run = createVerificationRun({name: 'Verification test', capability: 'fixture'});
    assert.equal(run.status, 'pending');
    assert.equal(run.sandbox.credentials, 'deny');
    assert.deepEqual(run.checks.map(check => check.id), ['static-analysis', 'unit-tests', 'negative-policy', 'sandbox-behavior', 'documentation']);
    assert.throws(() => createVerificationRun(), /project is required/);
  });

  it('records evidence and reaches a passed summary only when every check passes', () => {
    let run = createVerificationRun({name: 'Verification test', capability: 'fixture'});
    for (const check of run.checks) run = recordVerificationResult(run, check.id, {status: 'passed', evidence: [`${check.id}.json`]}).run;
    assert.deepEqual(summarizeVerification(run), {status: 'passed', pending: 0, passed: 5, failed: 0, ready: true});
    assert.equal(Object.isFrozen(run), true);
  });

  it('records failures and preserves a reviewable run', () => {
    let run = createVerificationRun({name: 'Verification test', capability: 'fixture'});
    run = recordVerificationResult(run, 'negative-policy', {status: 'failed', evidence: ['policy-failure.json']}).run;
    const summary = summarizeVerification(run);
    assert.deepEqual(summary, {status: 'failed', pending: 4, passed: 0, failed: 1, ready: false});
  });

  it('rejects unknown, duplicate, malformed, and evidence-free results', () => {
    let run = createVerificationRun({name: 'Verification test', capability: 'fixture'});
    assert.deepEqual(recordVerificationResult(null, 'unit-tests', {}).reason, 'verification run is required');
    assert.match(recordVerificationResult(run, 'missing', {status: 'passed', evidence: ['x']}).reason, /unknown/);
    assert.equal(recordVerificationResult(run, 'unit-tests').reason, 'result status must be passed or failed');
    assert.equal(recordVerificationResult(run, 'unit-tests', {status: 'skipped', evidence: ['x']}).reason, 'result status must be passed or failed');
    assert.equal(recordVerificationResult(run, 'unit-tests', {status: 'passed', evidence: []}).reason, 'verification evidence is required');
    run = recordVerificationResult(run, 'unit-tests', {status: 'passed', evidence: ['unit.json']}).run;
    assert.equal(recordVerificationResult(run, 'unit-tests', {status: 'passed', evidence: ['again.json']}).reason, 'verification check is already recorded');
  });
});

describe('sandbox profiles', () => {
  it('creates safe defaults for fixture and isolated-network tiers', () => {
    assert.equal(createSandboxProfile('fixture').network, 'deny');
    assert.equal(createSandboxProfile('isolated-network').network, 'fixture-allowlist');
    assert.equal(validateSandboxProfile(createSandboxProfile('analysis')).allowed, true);
    assert.throws(() => createSandboxProfile('unrestricted'), /unsupported/);
  });

  it('rejects unsafe or malformed sandbox controls', () => {
    const base = createSandboxProfile('fixture');
    const invalid = (changes) => validateSandboxProfile({...base, ...changes});
    assert.equal(validateSandboxProfile(null).allowed, false);
    assert.match(invalid({network: 'internet'}).reasons[0], /network/);
    assert.match(invalid({filesystem: {source: 'writeable', artifacts: 'write-only'}}).reasons[0], /source/);
    assert.match(invalid({filesystem: {source: 'read-only', artifacts: 'read-write'}}).reasons[0], /artifacts/);
    assert.match(invalid({credentials: 'available'}).reasons[0], /credentials/);
    assert.match(invalid({process: 'allow'}).reasons[0], /process/);
    assert.match(invalid({resources: {cpuSeconds: 0, memoryMb: 512}}).reasons[0], /cpu/);
    assert.match(invalid({resources: {cpuSeconds: 30, memoryMb: 0}}).reasons[0], /memory/);
    assert.equal(validateSandboxProfile({...base, resources: {cpuSeconds: 1.5, memoryMb: 512}}).allowed, false);
  });
});

describe('append-only audit log', () => {
  it('records immutable ordered events and summarizes them', () => {
    let log = createAuditLog();
    log = appendAuditEvent(log, {type: 'intake.confirmed', actor: 'operator', at: '2026-08-16T00:00:00Z', details: {project: 'dns-mapper'}});
    log = appendAuditEvent(log, {type: 'workflow.transition', actor: 'operator', details: {to: 'design-review'}});
    const summary = summarizeAudit(log);
    assert.equal(summary.events, 2);
    assert.deepEqual(summary.types, {'intake.confirmed': 1, 'workflow.transition': 1});
    assert.equal(summary.last.id, 'evt-2');
    assert.equal(Object.isFrozen(log), true);
    assert.throws(() => log.push('x'), TypeError);
  });

  it('rejects malformed logs and events while preserving defaults', () => {
    assert.throws(() => appendAuditEvent(null, {}), /audit log must be an array/);
    const log = createAuditLog();
    assert.throws(() => appendAuditEvent(log, {actor: 'operator'}), /event type is required/);
    assert.throws(() => appendAuditEvent(log, {type: 'x'}), /event actor is required/);
    const next = appendAuditEvent(log, {type: 'x', actor: 'operator'});
    assert.equal(next[0].at, 'pending');
    assert.deepEqual(summarizeAudit([]), {events: 0, types: {}, last: null});
    assert.throws(() => summarizeAudit(null), /audit log must be an array/);
  });
});

describe('artifact provenance', () => {
  it('creates SHA-256 hashes and SBOM entries for every artifact', async () => {
    const manifest = await createProvenanceManifest({slug: 'dns-mapper', version: '0.1.0', artifacts: {'project.yaml': 'name: dns-mapper\n', 'README.md': '# DNS mapper\n'}}, {generatedAt: 'now', sourceCommit: 'abc123'});
    assert.equal(manifest.format, 'adversaryforge-provenance-v1');
    assert.equal(manifest.signed, false);
    assert.equal(manifest.generatedAt, 'now');
    assert.equal(manifest.sourceCommit, 'abc123');
    assert.equal(manifest.artifacts.length, 2);
    assert.match(manifest.artifacts[0].sha256, /^[a-f0-9]{64}$/);
    assert.equal(manifest.sbom[1].type, 'generated-artifact');
    assert.equal(Object.isFrozen(manifest), true);
  });

  it('uses safe metadata defaults and rejects malformed bundles', async () => {
    const manifest = await createProvenanceManifest({slug: 'tool', version: '0.1.0', artifacts: {'a.txt': 'a'}});
    assert.equal(manifest.generatedAt, 'pending-ci');
    assert.equal(manifest.sourceCommit, 'pending-ci');
    await assert.rejects(() => createProvenanceManifest(null), /artifact bundle is required/);
  });
});
