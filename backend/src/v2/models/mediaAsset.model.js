const { Schema, model } = require("mongoose");

const mediaAssetSchema = new Schema(
  {
    organisation: { type: Schema.Types.ObjectId, ref: "OrganisationV2", index: true },
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

module.exports = model("MediaAssetV2", mediaAssetSchema);
