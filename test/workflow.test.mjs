import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {advanceWorkflow, createWorkflow, workflowLabel} from '../src/workflow.js';

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
      ['verification-passed', {testEvidence: true}, 'documentation'],
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
    assert.equal(advanceWorkflow(verification, 'verification-passed').reason, 'passing test evidence is required');
    verification = advanceWorkflow(verification, 'verification-failed').workflow;
    assert.equal(verification.state, 'implementation');
    let docs = advanceWorkflow(verification, 'submit-verification').workflow;
    docs = advanceWorkflow(docs, 'verification-passed', {testEvidence: true}).workflow;
    assert.equal(advanceWorkflow(docs, 'documentation-complete').reason, 'complete documentation is required');
    docs = advanceWorkflow(docs, 'documentation-complete', {docsComplete: true}).workflow;
    assert.equal(advanceWorkflow(docs, 'release-approved').reason, 'human release approval is required');
    assert.equal(advanceWorkflow(docs, 'release-approved', {humanApproved: true}).reason, 'a signed artifact is required');
  });
});
