import {readFile} from 'node:fs/promises';

const requiredFiles = [
  'README.md',
  'INSTALLATION.md',
  'docs/troubleshooting.md',
  'docs/project-artifacts.md',
  'docs/release-readiness.json',
  'docs/release-readiness.md',
  'index.html',
  'app.js',
  'styles.css',
  'src/release-readiness.js',
  'src/verification.js',
  'src/audit.js',
  'src/provenance.js',
  'src/sandbox.js',
  'src/fixture-runner.js',
  'src/guidance.js',
  'scripts/forge.mjs',
  'scripts/build-release.mjs',
  'test/release-readiness.test.mjs'
];
const requiredMarkers = {
  'app.js': ['Add functionality', 'Proceed to design', 'Change answers', 'remove-feature', 'createProjectArtifacts', 'downloadArtifacts', 'Policy passed', 'Policy blocked', 'createWorkflow', 'advanceWorkflow', 'workflowLabel', 'Record fixture evidence', 'Verification checks', 'Approve design', 'Promote verification', 'Record signed artifact', 'appendAuditEvent', 'Recorded activity', 'createProvenanceManifest', 'Provenance manifest created', 'Sandbox profile', 'SAFE DEFAULTS', 'Fixture execution plan'],
  'index.html': ['intakeModal', 'modal', 'Guided setup', 'Help center'],
  'README.md': ['npm test', 'Release readiness'],
  'docs/release-readiness.md': ['proven installation', 'guided troubleshooting', 'full-feature validation', 'tested recovery paths', 'documentation'],
  'docs/troubleshooting.md': ['Use **Back**', 'Add functionality', 'Proceed to design'],
  'docs/project-artifacts.md': ['project.yaml', 'threat-model.md', 'capabilities.yaml', 'acceptance-criteria.md', 'verification-plan.md'],
  'docs/release-readiness.json': ['coverageIsNotSufficient', 'humanApprovalRequired', 'featureValidation'],
  'scripts/build-release.mjs': ['release-manifest.json', 'sbom.json', 'checksums.txt', 'signed=${provenance.signed}'],
  'src/guidance.js': ['getGuidance', 'createSetupChecklist', 'createDryRunPlan', 'getRecoveryGuide', 'readinessSummary'],
  'scripts/forge.mjs': ['guided CLI', 'dry-run', 'release-check', 'human approval']
};

for (const file of requiredFiles) await readFile(file, 'utf8');
for (const [file, markers] of Object.entries(requiredMarkers)) {
  const content = await readFile(file, 'utf8');
  for (const marker of markers) if (!content.toLowerCase().includes(marker.toLowerCase())) throw new Error(`${file} is missing required marker: ${marker}`);
}
console.log(`Static verification passed: ${requiredFiles.length} required files and all release markers are present.`);
