const AuditLog = require('../models/auditLog.model');

const sanitize = value => {
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === 'object' && value.constructor === Object) {
    return Object.fromEntries(Object.entries(value)
      .filter(([key]) => !/password|token|secret|claimurl|api.?key/i.test(key))
      .map(([key,item]) => [key,sanitize(item)]));
  }
  return value;
};

const logAudit = async ({ req, actorUser, organisation, actorOrganisation, action, entityType, entityId, before, after, source = 'api', metadata = {}, operationId }) => {
  try {
    return await AuditLog.create({
      actorUser: actorUser || req?.v2User?._id,
      actorOrganisation,
      organisation,
      action,
      entityType,
      entityId,
      before: sanitize(before),
      after: sanitize(after),
      source,
      operationId: operationId || req?.operationId,
      metadata: sanitize(metadata),
      ip: req?.ip,
    });
  } catch (error) {
    console.error('V2 audit log failed:', error.message);
    return null;
  }
};

module.exports = { logAudit, sanitize };
