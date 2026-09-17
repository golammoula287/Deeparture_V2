const { Schema, model } = require("mongoose");

const resortAvailabilitySchema = new Schema(
  {
    organisation: { type: Schema.Types.ObjectId, ref: "OrganisationV2", required: true, index: true },
    resort: { type: Schema.Types.ObjectId, ref: "ResortV2", required: true, index: true },
    roomType: { type: Schema.Types.ObjectId, ref: "RoomTypeV2", required: true, index: true },
    date: { type: Date, required: true, index: true },
    roomsAvailable: Number,
    status: { type: String, enum: ["available", "limited", "sold_out", "stop_sell", "on_request"], default: "on_request" },
    source: { type: String, default: "operator" },
    sourceUpdatedAt: Date,
  },
  { timestamps: true }
);

resortAvailabilitySchema.index({ roomType: 1, date: 1 }, { unique: true });
module.exports = model("ResortAvailabilityV2", resortAvailabilitySchema);
