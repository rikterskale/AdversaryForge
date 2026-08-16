import {mkdir, readFile, writeFile, copyFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createProvenanceManifest} from '../src/provenance.js';

const outputDir = process.argv[2] ?? 'dist/adversaryforge-mvp';
const releaseFiles = ['index.html', 'app.js', 'styles.css', 'README.md', 'INSTALLATION.md', 'docs/release-readiness.md', 'docs/troubleshooting.md', 'docs/project-artifacts.md'];
await mkdir(outputDir, {recursive: true});
for (const file of releaseFiles) {
  const destination = join(outputDir, file);
  await mkdir(join(destination, '..'), {recursive: true});
  await copyFile(file, destination);
}
const artifacts = Object.fromEntries(await Promise.all(releaseFiles.map(async file => [file, await readFile(file, 'utf8')])));
const provenance = await createProvenanceManifest({slug: 'adversaryforge-mvp', version: process.env.GITHUB_REF_NAME ?? '0.1.0', artifacts}, {generatedAt: new Date().toISOString(), sourceCommit: process.env.GITHUB_SHA ?? 'local'});
await writeFile(join(outputDir, 'release-manifest.json'), JSON.stringify(provenance, null, 2) + '\n');
await writeFile(join(outputDir, 'sbom.json'), JSON.stringify({format: 'adversaryforge-sbom-v1', components: provenance.sbom}, null, 2) + '\n');
await writeFile(join(outputDir, 'checksums.txt'), provenance.artifacts.map(artifact => `${artifact.sha256}  ${artifact.path}`).join('\n') + '\n');
console.log(`Release bundle built at ${outputDir}: ${releaseFiles.length} files, ${provenance.artifacts.length} checksums, signed=${provenance.signed}.`);
