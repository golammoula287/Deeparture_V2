const { Schema, model } = require("mongoose");

const auditLogSchema = new Schema(
  {
    actorUser: { type: Schema.Types.ObjectId, ref: "User", index: true },
    actorOrganisation: { type: Schema.Types.ObjectId, ref: "OrganisationV2", index: true },
    organisation: { type: Schema.Types.ObjectId, ref: "OrganisationV2", index: true },
    action: { type: String, required: true, index: true },
    entityType: String,
    entityId: Schema.Types.ObjectId,
    before: Schema.Types.Mixed,
    after: Schema.Types.Mixed,
    source: { type: String, default: "api", index: true },
    operationId: { type: String, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    ip: String,
    retentionClass: { type: String, enum: ["business", "operational"], default: "business" },
  },
  { timestamps: true }
);

auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
auditLogSchema.index({ actorUser: 1, createdAt: -1 });
auditLogSchema.index({ organisation: 1, createdAt: -1 });
module.exports = model("AuditLogV2", auditLogSchema);
