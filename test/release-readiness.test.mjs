import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  addFeature,
  createProjectArtifacts,
  evaluatePolicy,
  formatPolicyDecision,
  evaluateReleaseReadiness,
  formatReadinessSummary,
  normalizeProjectInput,
  removeFeature
} from '../src/release-readiness.js';

describe('feature editing', () => {
  it('adds trimmed features and avoids case-insensitive duplicates', () => {
    assert.deepEqual(addFeature(['Export JSON'], '  Compare baseline  '), ['Export JSON', 'Compare baseline']);
    assert.deepEqual(addFeature(['Export JSON'], 'export json'), ['Export JSON']);
  });

  it('rejects invalid feature collections and empty features', () => {
    assert.throws(() => addFeature(null, 'x'), /features must be an array/);
    assert.throws(() => addFeature([], '  '), /feature must not be empty/);
    assert.throws(() => addFeature([], null), /feature must not be empty/);
  });

  it('removes only the selected feature', () => {
    assert.deepEqual(removeFeature(['A', 'B', 'A'], 'A'), ['B']);
    assert.throws(() => removeFeature({}, 'A'), /features must be an array/);
  });
});

describe('project intake normalization', () => {
  const valid = {
    name: ' DNS mapper ',
    objective: ' Find records ',
    boundary: ' Fixtures ',
    capability: 'fixture',
    verification: ' Unit tests ',
    features: ['Resolve records', 'resolve records']
  };

  it('normalizes and freezes a valid project definition', () => {
    const result = normalizeProjectInput(valid);
    assert.equal(result.name, 'DNS mapper');
    assert.deepEqual(result.features, ['Resolve records']);
    assert.equal(Object.isFrozen(result), true);
    assert.equal(Object.isFrozen(result.features), true);
  });

  it('rejects missing fields, unsupported capability, and empty features', () => {
    assert.throws(() => normalizeProjectInput(), /name is required/);
    for (const key of ['name', 'objective', 'boundary', 'verification']) {
      const input = {...valid, [key]: ''};
      assert.throws(() => normalizeProjectInput(input), new RegExp(`${key} is required`));
    }
    assert.throws(() => normalizeProjectInput({...valid, capability: 'unrestricted'}), /unsupported capability tier/);
    assert.throws(() => normalizeProjectInput({...valid, features: []}), /at least one feature is required/);
    assert.throws(() => normalizeProjectInput({...valid, features: 'not-an-array'}), /at least one feature is required/);
  });
});

describe('new-user release readiness', () => {
  it('reports incomplete evidence and a concrete score', () => {
    const result = evaluateReleaseReadiness({installation: true, documentation: true});
    assert.deepEqual(result.missing, ['troubleshooting', 'featureValidation', 'recovery']);
    assert.equal(result.score, 40);
    assert.equal(result.ready, false);
    assert.equal(formatReadinessSummary(result), 'Not release ready: troubleshooting, featureValidation, recovery still need evidence.');
    const empty = evaluateReleaseReadiness();
    assert.equal(empty.score, 0);
  });

  it('requires every standard and produces a ready summary', () => {
    const result = evaluateReleaseReadiness({
      installation: true,
      troubleshooting: true,
      featureValidation: true,
      recovery: true,
      documentation: true
    });
    assert.deepEqual(result.missing, []);
    assert.equal(result.score, 100);
    assert.equal(result.ready, true);
    assert.equal(formatReadinessSummary(result), 'Release ready: all new-user readiness checks passed.');
    assert.throws(() => result.missing.push('x'), TypeError);
  });
});

describe('repository project artifacts', () => {
  it('creates a reviewable artifact bundle from approved intake', () => {
    const bundle = createProjectArtifacts({
      name: ' DNS Exposure Mapper ',
      objective: 'Find records',
      boundary: 'Fixture targets only',
      capability: 'fixture',
      verification: 'Fixture tests',
      features: ['Resolve DNS', 'Export evidence']
    }, {version: '0.2.0', generatedAt: '2026-08-16T13:00:00Z'});
    assert.equal(bundle.slug, 'dns-exposure-mapper');
    assert.equal(bundle.version, '0.2.0');
    assert.match(bundle.artifacts['project.yaml'], /capability_tier: fixture/);
    assert.match(bundle.artifacts['threat-model.md'], /Live-target activity/);
    assert.match(bundle.artifacts['capabilities.yaml'], /default: deny/);
    assert.match(bundle.artifacts['acceptance-criteria.md'], /Resolve DNS/);
    assert.match(bundle.artifacts['release-evidence/README.md'], /Human release approval/);
    assert.equal(Object.isFrozen(bundle), true);
  });

  it('uses safe defaults for missing metadata and names', () => {
    const bundle = createProjectArtifacts({
      name: '!!!', objective: 'Test', boundary: 'Fixtures', capability: 'analysis', verification: 'Unit tests', features: ['Inspect']
    });
    assert.equal(bundle.slug, 'security-tool');
    assert.equal(bundle.version, '0.1.0');
    assert.match(bundle.artifacts['release-evidence/README.md'], /Generated: pending-ci/);
  });
});

describe('deny-by-default policy', () => {
  const project = (capability) => ({name: 'Policy test', objective: 'Validate controls', boundary: 'Fixtures', capability, verification: 'Unit tests', features: ['Inspect']});

  it('allows analysis and blocks unsafe universal capabilities', () => {
    const allowed = evaluatePolicy(project('analysis'));
    assert.equal(allowed.allowed, true);
    assert.match(formatPolicyDecision(allowed), /Policy passed/);
    const blocked = evaluatePolicy(project('analysis'), {credentialsRequested: true, persistenceRequested: true});
    assert.equal(blocked.allowed, false);
    assert.deepEqual(blocked.reasons, ['credential access is prohibited', 'persistence is prohibited']);
    assert.match(formatPolicyDecision(blocked), /Policy blocked/);
  });

  it('requires sandboxing for fixture and isolated-network work', () => {
    assert.deepEqual(evaluatePolicy(project('fixture'), {sandbox: false}).reasons, ['fixture execution requires a sandbox']);
    assert.equal(evaluatePolicy(project('isolated-network'), {sandbox: true, approval: true}).allowed, true);
    assert.deepEqual(evaluatePolicy(project('isolated-network'), {}).reasons, ['isolated network requires a sandbox', 'isolated network requires human approval']);
  });

  it('requires all approvals and allowlists for live interaction', () => {
    const missing = evaluatePolicy(project('approved-live'), {});
    assert.deepEqual(missing.reasons, ['live interaction requires human approval', 'live interaction requires attached authorization', 'target must be explicitly allowlisted', 'egress must be explicitly allowlisted']);
    const approved = evaluatePolicy(project('approved-live'), {approval: true, authorizationAttached: true, targetAllowlisted: true, egressAllowlisted: true});
    assert.equal(approved.allowed, true);
  });
});
