const { Schema, model } = require("mongoose");

const auditLogSchema = new Schema(
  {
    actorUser: { type: Schema.Types.ObjectId, ref: "User" },
    organisation: { type: Schema.Types.ObjectId, ref: "OrganisationV2", index: true },
    action: { type: String, required: true, index: true },
    entityType: String,
    entityId: Schema.Types.ObjectId,
    before: Schema.Types.Mixed,
    after: Schema.Types.Mixed,
    source: { type: String, default: "api" },
    ip: String,
  },
  { timestamps: true }
);

module.exports = model("AuditLogV2", auditLogSchema);
