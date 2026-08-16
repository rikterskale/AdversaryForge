const CAPABILITY_TIERS = new Set(['analysis', 'fixture', 'isolated-network', 'approved-live']);

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
