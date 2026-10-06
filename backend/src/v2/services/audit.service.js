const AuditLog = require("../models/auditLog.model");
const sanitize = value => {
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === 'object' && value.constructor === Object) return Object.fromEntries(Object.entries(value).filter(([key]) => !/password|token|secret|claimurl|api.?key/i.test(key)).map(([key,item]) => [key,sanitize(item)]));
  return value;
};

const logAudit = async ({ req, organisation, action, entityType, entityId, before, after, source = "api" }) => {
  try {
    await AuditLog.create({
      actorUser: req?.v2User?._id,
      organisation,
      action,
      entityType,
      entityId,
      before: sanitize(before),
      after: sanitize(after),
      source,
      ip: req?.ip,
    });
  } catch (error) {
    console.error("V2 audit log failed:", error.message);
  }
};

module.exports = { logAudit };
