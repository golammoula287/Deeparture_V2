const DomainEvent = require('../models/domainEvent.model');

const handlers = new Map();
const sanitize = (value) => {
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === 'object' && value.constructor === Object) {
    return Object.fromEntries(Object.entries(value)
      .filter(([key]) => !/password|token|secret|claimurl|api.?key/i.test(key))
      .map(([key, item]) => [key, sanitize(item)]));
  }
  return value;
};

const subscribeDomainEvent = (name, handler) => {
  const list = handlers.get(name) || [];
  list.push(handler);
  handlers.set(name, list);
};

const publishDomainEvent = async ({ name, aggregateType, aggregateId, organisation, actorUser, operationId, payload = {}, retentionClass = 'operational' }) => {
  const event = await DomainEvent.create({ name, aggregateType, aggregateId, organisation, actorUser, operationId, payload: sanitize(payload), retentionClass });
  const subscribers = [...(handlers.get(name) || []), ...(handlers.get('*') || [])];
  if (!subscribers.length) return event;
  try {
    for (const handler of subscribers) await handler(event.toObject());
    event.status = 'handled';
    event.handledAt = new Date();
    await event.save();
  } catch (error) {
    event.status = 'failed';
    event.errorMessage = String(error.message || error).slice(0, 1000);
    await event.save();
    console.error('Domain event handler failed:', name, error.message);
  }
  return event;
};

module.exports = { publishDomainEvent, subscribeDomainEvent };
