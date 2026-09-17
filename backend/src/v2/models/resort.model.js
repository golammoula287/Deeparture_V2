const { Schema, model } = require("mongoose");
const slugify = require("../utilities/slugify");

const resortSchema = new Schema(
  {
    organisation: { type: Schema.Types.ObjectId, ref: "OrganisationV2", required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    listingStatus: { type: String, enum: ["draft", "published", "archived"], default: "draft", index: true },
    verificationStatus: {
      type: String,
      enum: ["unverified", "operator_verified", "deeparture_verified"],
      default: "unverified",
      index: true,
    },
    source: { type: String, default: "deeparture_import" },
    sourceUrl: String,
    lastCheckedAt: Date,
    verifiedAt: Date,
    summary: String,
    description: String,
    featuredImage: String,
    gallery: [String],
    country: String,
    region: String,
    district: String,
    destinationSlugs: [{ type: String, index: true }],
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

resortSchema.pre("validate", function (next) {
  if (!this.slug && this.name) this.slug = slugify(this.name);
  next();
});

resortSchema.index({ listingStatus: 1, destinationSlugs: 1, veganRating: 1 });
resortSchema.index({ name: "text", summary: "text", description: "text" });
module.exports = model("ResortV2", resortSchema);
