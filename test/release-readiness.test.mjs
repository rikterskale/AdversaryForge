import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  addFeature,
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
