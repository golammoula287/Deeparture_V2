const { Schema, model } = require("mongoose");
const slugify = require("../utilities/slugify");

const organisationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    type: {
      type: String,
      enum: ["operator", "agent", "internal"],
      default: "operator",
      index: true,
    },
    status: {
      type: String,
      enum: ["unclaimed", "invited", "claimed", "verified", "suspended"],
      default: "unclaimed",
      index: true,
    },
    accountStatus: { type: String, enum: ["active", "suspended"], default: "active", index: true },
    primaryEmail: { type: String, lowercase: true, trim: true, index: true },
    phone: String,
    whatsapp: String,
    website: String,
    address: String,
    country: String,
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
    claimedAt: Date,
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

organisationSchema.pre("validate", function (next) {
  if (!this.slug && this.name) this.slug = slugify(this.name);
  next();
});

organisationSchema.index({ name: 1, type: 1 });

module.exports = model("OrganisationV2", organisationSchema);
