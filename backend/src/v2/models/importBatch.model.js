const { Schema, model } = require("mongoose");

const importBatchSchema = new Schema(
  {
    kind: { type: String, enum: ["catalog"], default: "catalog", index: true },
    productType: { type: String, enum: ["vessel", "resort"], required: true, index: true },
    sourceType: { type: String, enum: ["csv", "xlsx", "json", "admin"], required: true },
    sourceFilename: String,
    schemaVersion: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ["preview", "committing", "completed", "completed_with_errors", "cancelled"],
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
  },
  { timestamps: true }
);

module.exports = model("ImportBatchV2", importBatchSchema);
