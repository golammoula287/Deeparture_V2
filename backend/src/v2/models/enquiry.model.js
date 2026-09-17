const { Schema, model } = require("mongoose");

const enquirySchema = new Schema(
  {
    organisation: { type: Schema.Types.ObjectId, ref: "OrganisationV2", required: true, index: true },
    productType: { type: String, enum: ["vessel", "resort"], required: true, index: true },
    productModel: { type: String, enum: ["VesselV2", "ResortV2"], required: true },
    product: { type: Schema.Types.ObjectId, required: true, refPath: "productModel" },
    itinerary: { type: Schema.Types.ObjectId, ref: "ItineraryV2" },
    departure: { type: Schema.Types.ObjectId, ref: "DepartureV2" },
    package: { type: Schema.Types.ObjectId, ref: "ResortPackageV2" },
    customer: {
      name: { type: String, required: true },
      email: { type: String, required: true, lowercase: true, trim: true },
      phone: String,
      whatsapp: String,
      guests: Number,
    },
    message: String,
    status: {
      type: String,
      enum: ["new", "sent_to_operator", "operator_replied", "quoted", "closed", "spam"],
      default: "new",
      index: true,
    },
    source: { type: String, default: "website" },
  },
  { timestamps: true }
);

module.exports = model("EnquiryV2", enquirySchema);
