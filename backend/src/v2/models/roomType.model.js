const { Schema, model } = require("mongoose");

const roomTypeSchema = new Schema(
  {
    organisation: { type: Schema.Types.ObjectId, ref: "OrganisationV2", required: true, index: true },
    resort: { type: Schema.Types.ObjectId, ref: "ResortV2", required: true, index: true },
    name: { type: String, required: true },
    description: String,
    images: [String],
    maxOccupancy: Number,
    totalRooms: Number,
    bedTypes: [String],
    ensuite: Boolean,
    airConditioned: Boolean,
    accessible: Boolean,
    facilities: [String],
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

roomTypeSchema.index({ resort: 1, name: 1 }, { unique: true });
module.exports = model("RoomTypeV2", roomTypeSchema);
