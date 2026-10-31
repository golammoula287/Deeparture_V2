const { Schema, model } = require("mongoose");

const resortAvailabilitySchema = new Schema(
  {
    organisation: { type: Schema.Types.ObjectId, ref: "OrganisationV2", required: true, index: true },
    resort: { type: Schema.Types.ObjectId, ref: "ResortV2", required: true, index: true },
    roomType: { type: Schema.Types.ObjectId, ref: "RoomTypeV2", required: true, index: true },
    date: { type: Date, required: true, index: true },
    roomsAvailable: Number,
    status: { type: String, enum: ["unknown", "available", "limited", "sold_out", "stop_sell", "on_request"], default: "on_request" },
    source: { type: String, default: "operator" },
    sourceUpdatedAt: Date,
    sourceReference: String,
    receivedAt: { type: Date, default: Date.now },
    freshnessState: { type: String, enum: ["fresh", "aging", "stale", "unknown"], default: "unknown", index: true },
    conflictState: { type: Boolean, default: false, index: true },
    manualOverride: { type: Boolean, default: false, index: true },
    overrideExpiresAt: { type: Date, index: true },
    effectiveSourceName: String,
    resolvedAt: Date,
  },
  { timestamps: true }
);

resortAvailabilitySchema.index({ roomType: 1, date: 1 }, { unique: true });
module.exports = model("ResortAvailabilityV2", resortAvailabilitySchema);
