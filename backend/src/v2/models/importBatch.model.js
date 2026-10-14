const { Schema, model } = require("mongoose");

const importBatchSchema = new Schema(
  {
    kind: { type: String, enum: ["catalog"], default: "catalog", index: true },
    productType: { type: String, enum: ["vessel", "resort"], required: true, index: true },
    sourceType: { type: String, enum: ["csv", "xlsx", "json", "admin", "api", "feed", "website"], required: true, index: true },
    sourceFilename: String,
    adapterType: { type: String, default: "catalog_normalized_v1", index: true },
    schemaVersion: { type: Number, default: 1, index: true },
    operationId: { type: String, index: true },
    status: {
      type: String,
      enum: ["uploaded", "validated", "preview", "awaiting_confirmation", "committing", "processing", "completed", "completed_with_errors", "failed", "cancelled"],
      default: "preview",
      index: true,
    },
    rows: { type: [Schema.Types.Mixed], default: [] },
    summary: {
      total: { type: Number, default: 0 },
      create: { type: Number, default: 0 },
      update: { type: Number, default: 0 },
      duplicateReview: { type: Number, default: 0 },
      error: { type: Number, default: 0 },
      skip: { type: Number, default: 0 },
      committed: { type: Number, default: 0 },
      commitErrors: { type: Number, default: 0 },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", index: true },
    committedBy: { type: Schema.Types.ObjectId, ref: "User" },
    committedAt: Date,
    results: { type: [Schema.Types.Mixed], default: [] },
    rowErrors: { type: [Schema.Types.Mixed], default: [] },
    retryOfBatch: { type: Schema.Types.ObjectId, ref: "ImportBatchV2" },
    retentionClass: { type: String, enum: ["business", "operational"], default: "business" },
  },
  { timestamps: true }
);

importBatchSchema.index({ status: 1, createdAt: -1 });
importBatchSchema.index({ sourceType: 1, adapterType: 1, createdAt: -1 });
module.exports = model("ImportBatchV2", importBatchSchema);
