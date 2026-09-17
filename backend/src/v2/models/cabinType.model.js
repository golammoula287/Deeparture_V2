const { Schema, model } = require("mongoose");

const cabinTypeSchema = new Schema(
  {
    organisation: { type: Schema.Types.ObjectId, ref: "OrganisationV2", required: true, index: true },
    vessel: { type: Schema.Types.ObjectId, ref: "VesselV2", required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: String,
    image: String,
    totalCabins: Number,
    berthsPerCabin: Number,
    maxOccupancy: Number,
    ensuite: Boolean,
    airConditioned: Boolean,
    accessible: Boolean,
    bedding: [String],
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

cabinTypeSchema.index({ vessel: 1, name: 1 }, { unique: true });
module.exports = model("CabinTypeV2", cabinTypeSchema);
