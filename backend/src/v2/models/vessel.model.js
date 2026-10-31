const { Schema, model } = require("mongoose");
const slugify = require("../utilities/slugify");

const vesselSchema = new Schema(
  {
    organisation: { type: Schema.Types.ObjectId, ref: "OrganisationV2", required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    listingStatus: {
      type: String,
      enum: ["draft", "pending_review", "published", "restricted", "archived"],
      default: "draft",
      index: true,
    },
    verificationStatus: {
      type: String,
      enum: ["unverified", "operator_verified", "deeparture_verified"],
      default: "unverified",
      index: true,
    },
    source: {
      type: String,
      enum: ["deeparture_import", "operator", "admin", "api", "legacy_migration"],
      default: "deeparture_import",
    },
    sourceUrl: String,
    lastCheckedAt: Date,
    verifiedAt: Date,
    verifiedByUser: { type: Schema.Types.ObjectId, ref: "User" },
    verificationSourceType: String,
    verificationSourceRef: String,
    verificationScope: String,
    verificationNotes: String,
    completenessScore: { type: Number, min: 0, max: 100, default: 0, index: true },
    completenessMissing: { type: [String], default: [] },
    completenessUpdatedAt: Date,
    summary: String,
    description: String,
    featuredImage: String,
    gallery: [String],
    vesselType: String,
    yearBuilt: Number,
    yearRefit: Number,
    lengthMeters: Number,
    beamMeters: Number,
    maxGuests: Number,
    cabinCount: Number,
    homePort: { type: Schema.Types.ObjectId, ref: "LocationV2" },
    destinationSlugs: [{ type: String, index: true }],
    destinationLocations: [{ type: Schema.Types.ObjectId, ref: "LocationV2", index: true }],
    facilities: [{ type: String, lowercase: true }],
    dietary: [{ type: String, lowercase: true }],
    accessibility: [{ type: String, lowercase: true }],
    divingFeatures: [{ type: String, lowercase: true }],
    veganRating: { type: Number, min: 0, max: 5, index: true },
    environmentalRating: { type: Number, min: 0, max: 5 },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

vesselSchema.pre("validate", function (next) {
  if (!this.slug && this.name) this.slug = slugify(this.name);
  next();
});

vesselSchema.index({ listingStatus: 1, destinationSlugs: 1, veganRating: 1 });
vesselSchema.index({ listingStatus: 1, completenessScore: 1, updatedAt: -1 });
vesselSchema.index({ organisation: 1, updatedAt: -1 });
vesselSchema.index({ name: "text", summary: "text", description: "text" });

module.exports = model("VesselV2", vesselSchema);
