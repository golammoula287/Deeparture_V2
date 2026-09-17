const { Schema, model } = require("mongoose");

const availabilitySchema = new Schema(
  {
    cabinType: { type: Schema.Types.ObjectId, ref: "CabinTypeV2", required: true },
    totalCabins: Number,
    cabinsAvailable: Number,
    totalSpaces: Number,
    spacesAvailable: Number,
    status: { type: String, enum: ["available", "limited", "sold_out", "on_request"], default: "on_request" },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const priceOverrideSchema = new Schema(
  {
    cabinType: { type: Schema.Types.ObjectId, ref: "CabinTypeV2", required: true },
    amount: { type: Number, required: true, min: 0 },
    amountUsd: { type: Number, min: 0 },
    currency: { type: String, required: true, uppercase: true },
    reason: String,
  },
  { _id: true }
);

const offerSchema = new Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ["percent", "fixed_amount", "fixed_price"], required: true },
    percent: Number,
    amount: Number,
    amountUsd: Number,
    currency: String,
    cabinType: { type: Schema.Types.ObjectId, ref: "CabinTypeV2" },
    validFrom: Date,
    validUntil: Date,
    description: String,
    active: { type: Boolean, default: true },
  },
  { _id: true }
);

const effectivePriceSchema = new Schema(
  {
    cabinType: { type: Schema.Types.ObjectId, ref: "CabinTypeV2", required: true },
    rackAmount: Number,
    rackAmountUsd: Number,
    effectiveAmount: Number,
    effectiveAmountUsd: Number,
    currency: String,
    offerName: String,
  },
  { _id: false }
);

const departureSchema = new Schema(
  {
    organisation: { type: Schema.Types.ObjectId, ref: "OrganisationV2", required: true, index: true },
    vessel: { type: Schema.Types.ObjectId, ref: "VesselV2", required: true, index: true },
    itinerary: { type: Schema.Types.ObjectId, ref: "ItineraryV2", required: true, index: true },
    externalCode: { type: String, trim: true, index: true },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true, index: true },
    status: { type: String, enum: ["scheduled", "on_request", "sold_out", "cancelled"], default: "scheduled", index: true },
    availability: [availabilitySchema],
    priceOverrides: [priceOverrideSchema],
    offers: [offerSchema],
    effectivePrices: [effectivePriceSchema],
    effectiveMinPrice: { type: Number, index: true },
    effectiveMinPriceUsd: { type: Number, index: true },
    effectiveCurrency: String,
    availabilityUpdatedAt: Date,
    pricingUpdatedAt: Date,
    source: { type: String, default: "operator" },
    sourceUpdatedAt: Date,
  },
  { timestamps: true }
);

departureSchema.index(
  { itinerary: 1, externalCode: 1 },
  { unique: true, partialFilterExpression: { externalCode: { $type: "string" } } }
);
departureSchema.index({ itinerary: 1, startDate: 1 });
departureSchema.index({ startDate: 1, endDate: 1, effectiveMinPriceUsd: 1, status: 1 });

module.exports = model("DepartureV2", departureSchema);
