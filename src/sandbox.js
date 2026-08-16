const TIERS = new Set(['analysis', 'fixture', 'isolated-network', 'approved-live']);

export function createSandboxProfile(tier) {
  if (!TIERS.has(tier)) throw new Error('unsupported sandbox capability tier');
  return Object.freeze({
    tier,
    network: tier === 'isolated-network' ? 'fixture-allowlist' : 'deny',
    filesystem: Object.freeze({source: 'read-only', artifacts: 'write-only'}),
    credentials: 'deny',
    process: 'deny',
    resources: Object.freeze({cpuSeconds: 30, memoryMb: 512})
  });
}

export function validateSandboxProfile(profile) {
  if (!profile || !TIERS.has(profile.tier)) return {allowed: false, reasons: ['unsupported sandbox profile']};
  const reasons = [];
  if (!['deny', 'fixture-allowlist'].includes(profile.network)) reasons.push('network must be denied or fixture-allowlisted');
  if (profile.filesystem?.source !== 'read-only') reasons.push('source filesystem must be read-only');
  if (profile.filesystem?.artifacts !== 'write-only') reasons.push('artifacts filesystem must be write-only');
  if (profile.credentials !== 'deny') reasons.push('credentials must be denied');
  if (profile.process !== 'deny') reasons.push('process spawning must be denied');
  if (!Number.isInteger(profile.resources?.cpuSeconds) || profile.resources.cpuSeconds <= 0) reasons.push('cpu limit must be positive');
  if (!Number.isInteger(profile.resources?.memoryMb) || profile.resources.memoryMb <= 0) reasons.push('memory limit must be positive');
  return Object.freeze({allowed: reasons.length === 0, reasons: Object.freeze(reasons)});
}
