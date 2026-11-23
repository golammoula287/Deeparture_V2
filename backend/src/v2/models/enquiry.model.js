const { Schema, model } = require("mongoose");

const enquirySchema = new Schema(
  {
    organisation: { type: Schema.Types.ObjectId, ref: "OrganisationV2", required() { return this.productType !== "general"; }, index: true },
    productType: { type: String, enum: ["vessel", "resort", "general"], required: true, index: true },
    productModel: { type: String, enum: ["VesselV2", "ResortV2"], required() { return this.productType !== "general"; } },
    product: { type: Schema.Types.ObjectId, required() { return this.productType !== "general"; }, refPath: "productModel" },
    itinerary: { type: Schema.Types.ObjectId, ref: "ItineraryV2" },
    departure: { type: Schema.Types.ObjectId, ref: "DepartureV2" },
    package: { type: Schema.Types.ObjectId, ref: "ResortPackageV2" },
    interest: { type: String, enum: ["Liveaboard", "Resort", "Special Offer", "Other"] },
    destination: String,
    offer: Schema.Types.ObjectId,
    offerName: String,
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
      enum: ["new", "admin_approved", "sent_to_operator", "operator_accepted", "operator_replied", "quoted", "confirmed", "rejected", "closed", "spam"],
      default: "new",
      index: true,
    },
    source: { type: String, default: "website" },
    notificationInFlight: { type: Boolean, default: false },
    statusHistory: [{
      status: String,
      at: { type: Date, default: Date.now },
      actorUser: { type: Schema.Types.ObjectId, ref: "User" },
      note: String,
    }],
  },
  { timestamps: true }
);

module.exports = model("EnquiryV2", enquirySchema);
