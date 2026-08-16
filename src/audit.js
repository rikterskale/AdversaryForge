export function createAuditLog() {
  return Object.freeze([]);
}

export function appendAuditEvent(log, event) {
  if (!Array.isArray(log)) throw new TypeError('audit log must be an array');
  if (!event?.type) throw new Error('audit event type is required');
  if (!event?.actor) throw new Error('audit event actor is required');
  const entry = Object.freeze({
    id: `evt-${log.length + 1}`,
    sequence: log.length + 1,
    type: event.type,
    actor: event.actor,
    at: event.at ?? 'pending',
    details: Object.freeze({...event.details})
  });
  return Object.freeze([...log, entry]);
}

export function summarizeAudit(log) {
  if (!Array.isArray(log)) throw new TypeError('audit log must be an array');
  return Object.freeze({
    events: log.length,
    types: Object.freeze(log.reduce((counts, event) => ({...counts, [event.type]: (counts[event.type] ?? 0) + 1}), {})),
    last: log.at(-1) ?? null
  });
}
