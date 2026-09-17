const AuditLog = require("../models/auditLog.model");

const logAudit = async ({ req, organisation, action, entityType, entityId, before, after, source = "api" }) => {
  try {
    await AuditLog.create({
      actorUser: req?.v2User?._id,
      organisation,
      action,
      entityType,
      entityId,
      before,
      after,
      source,
      ip: req?.ip,
    });
  } catch (error) {
    console.error("V2 audit log failed:", error.message);
  }
};

module.exports = { logAudit };
