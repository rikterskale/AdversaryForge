async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function createProvenanceManifest(bundle, metadata = {}) {
  if (!bundle?.slug || !bundle?.artifacts) throw new Error('artifact bundle is required');
  const artifacts = await Promise.all(Object.entries(bundle.artifacts).map(async ([path, content]) => ({path, sha256: await sha256(content), bytes: new TextEncoder().encode(content).byteLength})));
  return Object.freeze({
    format: 'adversaryforge-provenance-v1',
    project: bundle.slug,
    version: bundle.version,
    generatedAt: metadata.generatedAt ?? 'pending-ci',
    sourceCommit: metadata.sourceCommit ?? 'pending-ci',
    signed: false,
    artifacts: Object.freeze(artifacts),
    sbom: Object.freeze(artifacts.map(artifact => Object.freeze({name: artifact.path, type: 'generated-artifact'})))
  });
}
