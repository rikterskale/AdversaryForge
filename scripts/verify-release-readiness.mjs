import {readFile} from 'node:fs/promises';

const goal = JSON.parse(await readFile('docs/release-readiness.json', 'utf8'));
const expected = ['installation', 'troubleshooting', 'featureValidation', 'recovery', 'documentation'];
if (goal.coverageIsNotSufficient !== true) throw new Error('readiness goal must keep coverage separate from release readiness');
if (goal.humanApprovalRequired !== true) throw new Error('readiness goal must require human approval');
const ids = goal.standards.map(standard => standard.id);
if (ids.length !== expected.length || expected.some(id => !ids.includes(id))) throw new Error('readiness goal must define exactly five required standards');
for (const standard of goal.standards) {
  if (!standard.name || !Array.isArray(standard.evidence) || standard.evidence.length < 3) throw new Error(`${standard.id} needs concrete evidence criteria`);
}
console.log(`Release-readiness goal verified: ${goal.standards.length} standards, human approval required.`);
