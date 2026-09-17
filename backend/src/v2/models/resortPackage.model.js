const { Schema, model } = require("mongoose");

const resortPackageSchema = new Schema(
  {
    organisation: { type: Schema.Types.ObjectId, ref: "OrganisationV2", required: true, index: true },
    resort: { type: Schema.Types.ObjectId, ref: "ResortV2", required: true, index: true },
    roomType: { type: Schema.Types.ObjectId, ref: "RoomTypeV2", index: true },
    name: { type: String, required: true },
    description: String,
    numberOfDays: Number,
    numberOfNights: Number,
    numberOfDives: Number,
    mealPlan: { type: String, enum: ["room_only", "breakfast", "half_board", "full_board", "all_inclusive", "custom"] },
    coursesIncluded: Boolean,
    inclusions: [String],
    exclusions: [String],
    basePrice: {
      amount: { type: Number, required: true, min: 0 },
      amountUsd: { type: Number, min: 0 },
      currency: { type: String, required: true, uppercase: true },
      pricingBasis: { type: String, enum: ["per_person", "per_room", "per_package"], default: "per_person" },
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = model("ResortPackageV2", resortPackageSchema);
