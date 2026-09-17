const { Schema, model } = require("mongoose");

const productAttributeSchema = new Schema(
  {
    productModel: { type: String, enum: ["VesselV2", "ResortV2"], required: true },
    product: { type: Schema.Types.ObjectId, required: true, refPath: "productModel", index: true },
    definition: { type: Schema.Types.ObjectId, ref: "AttributeDefinitionV2", required: true },
    value: { type: Schema.Types.Mixed, required: true },
    source: {
      type: String,
      enum: ["operator", "deeparture_import", "admin", "api", "operator_website", "legacy_migration"],
      default: "deeparture_import",
    },
    sourceUrl: String,
    lastCheckedAt: Date,
    verificationStatus: {
      type: String,
      enum: ["unverified", "operator_verified", "deeparture_verified"],
      default: "unverified",
    },
    verifiedAt: Date,
  },
  { timestamps: true }
);

productAttributeSchema.index({ product: 1, definition: 1 }, { unique: true });

module.exports = model("ProductAttributeV2", productAttributeSchema);
