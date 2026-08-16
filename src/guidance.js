const TOPICS = Object.freeze({
  setup: Object.freeze({title: 'Start here', steps: Object.freeze(['Check Node.js 22 or newer.', 'Run the verification checks.', 'Start the local server from the repository root.', 'Open the console and create a fixture-only project.'])}),
  intake: Object.freeze({title: 'Guided intake', steps: Object.freeze(['Answer each question in plain language.', 'Use the least powerful capability tier.', 'Add or remove features before review.', 'Review every answer and explicitly proceed.'])}),
  verification: Object.freeze({title: 'Verification help', steps: Object.freeze(['Run checks against fixtures only.', 'Record evidence for every check.', 'Treat failures as review states.', 'Retry after fixing the implementation or fixture.'])}),
  recovery: Object.freeze({title: 'Recovery help', steps: Object.freeze(['Go back to the last editable step.', 'Correct the answer or feature.', 'Preview the resulting changes.', 'Continue only after the policy gate passes.'])}),
  release: Object.freeze({title: 'Release readiness', steps: Object.freeze(['Prove clean installation.', 'Validate every feature.', 'Test troubleshooting and recovery.', 'Review documentation and obtain human approval.'])})
});

const READINESS_CHECKS = Object.freeze([
  Object.freeze({id: 'installation', label: 'Installation proven', help: 'Clean checkout, runtime check, startup, and guided intake.'}),
  Object.freeze({id: 'troubleshooting', label: 'Troubleshooting guided', help: 'Startup, port, verification, and clean-rerun guidance.'}),
  Object.freeze({id: 'features', label: 'All features validated', help: 'Every intake question, feature edit, review, and confirmation.'}),
  Object.freeze({id: 'recovery', label: 'Recovery paths tested', help: 'Empty answers, edits, feature replacement, and failed verification.'}),
  Object.freeze({id: 'documentation', label: 'Documentation complete', help: 'Installation, safety boundary, limitations, evidence, and troubleshooting.'})
]);

export function getGuidance(topic = 'setup') {
  const guide = TOPICS[topic] || TOPICS.setup;
  return Object.freeze({title: guide.title, steps: Object.freeze([...guide.steps])});
}

export function createSetupChecklist() {
  return Object.freeze(READINESS_CHECKS.map(check => Object.freeze({id: check.id, label: check.label, status: 'not-started', help: check.help})));
}

export function createDryRunPlan(project) {
  if (!project?.name) return Object.freeze({allowed: false, reason: 'a project name is required', steps: Object.freeze([])});
  return Object.freeze({allowed: true, reason: null, steps: Object.freeze([
    `Capture design artifacts for ${project.name}`,
    'Run policy and sandbox checks without contacting targets',
    'Generate a verification plan and evidence checklist',
    'Wait for human approval before implementation or release'
  ])});
}

export function getRecoveryGuide(reason = 'unknown') {
  const guides = {empty: 'Enter an answer, then continue.', feature: 'Remove the incorrect feature and add the replacement.', verification: 'Keep the failure evidence, fix the implementation or fixture, then rerun.'};
  return guides[reason] || 'Return to the previous step, review the captured answers, and try again.';
}

export function readinessSummary(checklist) {
  if (!Array.isArray(checklist)) return Object.freeze({complete: false, completed: 0, total: READINESS_CHECKS.length});
  const completed = checklist.filter(check => check?.status === 'passed').length;
  return Object.freeze({complete: completed === READINESS_CHECKS.length, completed, total: READINESS_CHECKS.length});
}

export {READINESS_CHECKS};
