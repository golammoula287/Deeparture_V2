const { Schema, model } = require("mongoose");

const mediaAssetSchema = new Schema(
  {
    organisation: { type: Schema.Types.ObjectId, ref: "OrganisationV2", index: true },
    entityType: { type: String, enum: ["vessel", "resort"], index: true },
    entityId: { type: Schema.Types.ObjectId, index: true },
    sortOrder: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    url: { type: String, required: true },
    type: { type: String, enum: ["image", "video", "document"], default: "image" },
    title: String,
    altText: String,
    source: { type: String, enum: ["operator", "deeparture", "licensed", "legacy_migration"], default: "operator" },
    sourceUrl: String,
    usageApproved: { type: Boolean, default: false },
    approvedAt: Date,
  },
  { timestamps: true }
);

mediaAssetSchema.index({ organisation: 1, entityType: 1, entityId: 1, sortOrder: 1 });
module.exports = model("MediaAssetV2", mediaAssetSchema);
