const { Schema, model } = require("mongoose");
const slugify = require("../utilities/slugify");

const basePriceSchema = new Schema(
  {
    cabinType: { type: Schema.Types.ObjectId, ref: "CabinTypeV2", required: true },
    amount: { type: Number, required: true, min: 0 },
    amountUsd: { type: Number, min: 0 },
    currency: { type: String, required: true, uppercase: true, trim: true },
    pricingBasis: {
      type: String,
      enum: ["per_person", "per_cabin", "single_occupancy", "charter"],
      default: "per_person",
    },
    singleSupplementPercent: Number,
    mandatoryFees: [
      {
        name: String,
        amount: Number,
        currency: String,
      },
    ],
  },
  { _id: true }
);

const itinerarySchema = new Schema(
  {
    organisation: { type: Schema.Types.ObjectId, ref: "OrganisationV2", required: true, index: true },
    vessel: { type: Schema.Types.ObjectId, ref: "VesselV2", required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, index: true },
    status: { type: String, enum: ["draft", "active", "archived"], default: "active", index: true },
    destinationSlugs: [{ type: String, index: true }],
    country: String,
    region: String,
    embarkation: {
      location: { type: Schema.Types.ObjectId, ref: "LocationV2" },
      name: String,
      slug: { type: String, index: true },
    },
    disembarkation: {
      location: { type: Schema.Types.ObjectId, ref: "LocationV2" },
      name: String,
      slug: { type: String, index: true },
    },
    description: String,
    routeSummary: String,
    diveSites: [String],
    numberOfDays: Number,
    numberOfNights: { type: Number, index: true },
    numberOfDives: Number,
    minimumCertification: String,
    minimumLoggedDives: Number,
    basePrices: [basePriceSchema],
    source: { type: String, default: "deeparture_import" },
    sourceUrl: String,
    lastCheckedAt: Date,
  },
  { timestamps: true }
);

itinerarySchema.pre("validate", function (next) {
  if (!this.slug && this.name) this.slug = slugify(this.name);
  next();
});

itinerarySchema.index({ vessel: 1, slug: 1 }, { unique: true });
itinerarySchema.index({ destinationSlugs: 1, "embarkation.slug": 1, numberOfNights: 1 });

module.exports = model("ItineraryV2", itinerarySchema);
