const CAPABILITY_TIERS = new Set(['analysis', 'fixture', 'isolated-network', 'approved-live']);

function slugify(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'security-tool';
}

export function addFeature(features, feature) {
  if (!Array.isArray(features)) throw new TypeError('features must be an array');
  const value = String(feature ?? '').trim();
  if (!value) throw new Error('feature must not be empty');
  if (features.some(existing => existing.toLowerCase() === value.toLowerCase())) return [...features];
  return [...features, value];
}

export function removeFeature(features, feature) {
  if (!Array.isArray(features)) throw new TypeError('features must be an array');
  return features.filter(existing => existing !== feature);
}

export function normalizeProjectInput(input) {
  const value = input ?? {};
  const required = ['name', 'objective', 'boundary', 'verification'];
  for (const key of required) {
    if (typeof value[key] !== 'string' || !value[key].trim()) throw new Error(`${key} is required`);
  }
  if (!CAPABILITY_TIERS.has(value.capability)) throw new Error('unsupported capability tier');
  if (!Array.isArray(value.features) || value.features.length === 0) throw new Error('at least one feature is required');
  const features = value.features.reduce((result, feature) => addFeature(result, feature), []);
  return Object.freeze({
    name: value.name.trim(),
    objective: value.objective.trim(),
    boundary: value.boundary.trim(),
    capability: value.capability,
    verification: value.verification.trim(),
    features: Object.freeze(features)
  });
}

export function createProjectArtifacts(input, metadata = {}) {
  const project = normalizeProjectInput(input);
  const slug = slugify(project.name);
  const version = metadata.version ?? '0.1.0';
  const generatedAt = metadata.generatedAt ?? 'pending-ci';
  const projectYaml = [
    `name: ${JSON.stringify(project.name)}`,
    `version: ${JSON.stringify(version)}`,
    `objective: ${JSON.stringify(project.objective)}`,
    `boundary: ${JSON.stringify(project.boundary)}`,
    `capability_tier: ${project.capability}`,
    'features:',
    ...project.features.map(feature => `  - ${JSON.stringify(feature)}`),
    `verification: ${JSON.stringify(project.verification)}`
  ].join('\n') + '\n';
  const artifacts = {
    'project.yaml': projectYaml,
    'threat-model.md': `# Threat model: ${project.name}\n\n## Intended outcome\n\n${project.objective}\n\n## Authorized boundary\n\n${project.boundary}\n\n## Out of scope\n\n- Credential collection or use\n- Unrestricted network access\n- Persistence or evasion\n- Live-target activity without explicit approval\n\n## Review status\n\nDesign review required before implementation.\n`,
    'capabilities.yaml': `tool: ${JSON.stringify(project.name)}\ncapability_tier: ${project.capability}\nnetwork:\n  default: deny\nfilesystem:\n  default: fixture-only\ncredentials: none\nprocess_spawn: false\nhuman_approval_required: true\n`,
    'acceptance-criteria.md': `# Acceptance criteria: ${project.name}\n\n${project.features.map(feature => `- [ ] ${feature}`).join('\n')}\n- [ ] Negative tests cover out-of-scope behavior\n- [ ] Evidence is generated in CI\n- [ ] Documentation matches the approved capability manifest\n`,
    'verification-plan.md': `# Verification plan: ${project.name}\n\nThe MVP is fixture-first and does not execute live-target activity. Record evidence for each check:\n\n- [ ] static-analysis\n- [ ] unit-tests\n- [ ] negative-policy\n- [ ] sandbox-behavior\n- [ ] documentation\n`,
    'release-evidence/README.md': `# Release evidence\n\nProject: ${project.name}\nGenerated: ${generatedAt}\n\nRequired before promotion:\n\n- [ ] Installation proven from a clean checkout\n- [ ] Guided troubleshooting verified\n- [ ] Full feature validation passed\n- [ ] Recovery paths tested\n- [ ] Documentation reviewed\n- [ ] Human release approval recorded\n`
  };
  return Object.freeze({slug, version, artifacts: Object.freeze(artifacts)});
}

export function evaluatePolicy(input, context = {}) {
  const project = normalizeProjectInput(input);
  const reasons = [];
  if (context.credentialsRequested === true) reasons.push('credential access is prohibited');
  if (context.persistenceRequested === true) reasons.push('persistence is prohibited');
  if (project.capability === 'fixture' && context.sandbox === false) reasons.push('fixture execution requires a sandbox');
  if (project.capability === 'isolated-network') {
    if (context.sandbox !== true) reasons.push('isolated network requires a sandbox');
    if (context.approval !== true) reasons.push('isolated network requires human approval');
  }
  if (project.capability === 'approved-live') {
    if (context.approval !== true) reasons.push('live interaction requires human approval');
    if (context.authorizationAttached !== true) reasons.push('live interaction requires attached authorization');
    if (context.targetAllowlisted !== true) reasons.push('target must be explicitly allowlisted');
    if (context.egressAllowlisted !== true) reasons.push('egress must be explicitly allowlisted');
  }
  return Object.freeze({allowed: reasons.length === 0, tier: project.capability, reasons: Object.freeze(reasons)});
}

export function formatPolicyDecision(decision) {
  return decision.allowed ? `Policy passed: ${decision.tier} is permitted under the current controls.` : `Policy blocked: ${decision.reasons.join('; ')}.`;
}

export function evaluateReleaseReadiness(checks) {
  const required = ['installation', 'troubleshooting', 'featureValidation', 'recovery', 'documentation'];
  const missing = required.filter(key => checks?.[key] !== true);
  return Object.freeze({
    ready: missing.length === 0,
    missing: Object.freeze(missing),
    score: Math.round(((required.length - missing.length) / required.length) * 100)
  });
}

export function formatReadinessSummary(result) {
  if (result.ready) return 'Release ready: all new-user readiness checks passed.';
  return `Not release ready: ${result.missing.join(', ')} still need evidence.`;
}
