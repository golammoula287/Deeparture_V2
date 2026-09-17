const { Schema, model } = require("mongoose");

const resortRatePeriodSchema = new Schema(
  {
    organisation: { type: Schema.Types.ObjectId, ref: "OrganisationV2", required: true, index: true },
    resort: { type: Schema.Types.ObjectId, ref: "ResortV2", required: true, index: true },
    package: { type: Schema.Types.ObjectId, ref: "ResortPackageV2", required: true, index: true },
    roomType: { type: Schema.Types.ObjectId, ref: "RoomTypeV2" },
    name: String,
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true, index: true },
    priceOverride: {
      amount: Number,
      amountUsd: Number,
      currency: String,
    },
    offer: {
      name: String,
      type: { type: String, enum: ["percent", "fixed_amount", "fixed_price"] },
      percent: Number,
      amount: Number,
      amountUsd: Number,
      currency: String,
      validFrom: Date,
      validUntil: Date,
    },
    minimumStayNights: Number,
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

resortRatePeriodSchema.index({ package: 1, startDate: 1, endDate: 1 });
module.exports = model("ResortRatePeriodV2", resortRatePeriodSchema);
