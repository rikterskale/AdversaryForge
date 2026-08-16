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
  'test/release-readiness.test.mjs'
];
const requiredMarkers = {
  'index.html': ['intakeModal', 'modal'],
  'app.js': ['Add functionality', 'Proceed to design', 'Change answers', 'remove-feature', 'createProjectArtifacts', 'downloadArtifacts', 'Policy passed', 'Policy blocked'],
  'README.md': ['npm test', 'Release readiness'],
  'docs/release-readiness.md': ['proven installation', 'guided troubleshooting', 'full-feature validation', 'tested recovery paths', 'documentation'],
  'docs/troubleshooting.md': ['Use **Back**', 'Add functionality', 'Proceed to design'],
  'docs/project-artifacts.md': ['project.yaml', 'threat-model.md', 'capabilities.yaml', 'acceptance-criteria.md'],
  'docs/release-readiness.json': ['coverageIsNotSufficient', 'humanApprovalRequired', 'featureValidation']
};

for (const file of requiredFiles) await readFile(file, 'utf8');
for (const [file, markers] of Object.entries(requiredMarkers)) {
  const content = await readFile(file, 'utf8');
  for (const marker of markers) if (!content.toLowerCase().includes(marker.toLowerCase())) throw new Error(`${file} is missing required marker: ${marker}`);
}
console.log(`Static verification passed: ${requiredFiles.length} required files and all release markers are present.`);
