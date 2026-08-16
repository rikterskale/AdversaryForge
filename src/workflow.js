const STATES = new Set(['intake', 'design-review', 'implementation', 'verification', 'documentation', 'release-approval', 'released']);
const TRANSITIONS = {
  intake: {'submit-design': 'design-review'},
  'design-review': {'approve-design': 'implementation', 'reject-design': 'intake'},
  implementation: {'submit-verification': 'verification'},
  verification: {'verification-passed': 'documentation', 'verification-failed': 'implementation'},
  documentation: {'documentation-complete': 'release-approval'},
  'release-approval': {'release-approved': 'released'},
  released: {}
};

export function createWorkflow(project, policyDecision) {
  if (!project?.name) throw new Error('project is required');
  if (policyDecision?.allowed !== true) throw new Error('workflow requires an approved policy decision');
  return Object.freeze({state: 'intake', projectName: project.name, history: Object.freeze([])});
}

function guardReason(workflow, action, evidence) {
  if (action === 'submit-design' && evidence.policyApproved !== true) return 'policy approval is required';
  if (action === 'approve-design' && evidence.humanApproved !== true) return 'human design approval is required';
  if (action === 'verification-passed' && evidence.verificationReady !== true) return 'a completed verification run is required';
  if (action === 'documentation-complete' && evidence.docsComplete !== true) return 'complete documentation is required';
  if (action === 'release-approved' && evidence.humanApproved !== true) return 'human release approval is required';
  if (action === 'release-approved' && evidence.signedArtifact !== true) return 'a signed artifact is required';
  return null;
}

export function advanceWorkflow(workflow, action, evidence = {}) {
  if (!workflow || !STATES.has(workflow.state)) return {ok: false, workflow, reason: 'unknown workflow state'};
  const nextState = TRANSITIONS[workflow.state][action];
  if (!nextState) return {ok: false, workflow, reason: `action ${action} is not allowed from ${workflow.state}`};
  const guard = guardReason(workflow, action, evidence);
  if (guard) return {ok: false, workflow, reason: guard};
  const event = Object.freeze({from: workflow.state, action, to: nextState});
  const nextWorkflow = Object.freeze({
    state: nextState,
    projectName: workflow.projectName,
    history: Object.freeze([...workflow.history, event])
  });
  return {ok: true, workflow: nextWorkflow, reason: null};
}

export function workflowLabel(state) {
  if (!STATES.has(state)) return 'Unknown';
  return state.split('-').map(word => word[0].toUpperCase() + word.slice(1)).join(' ');
}
