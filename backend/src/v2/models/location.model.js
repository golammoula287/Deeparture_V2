const { Schema, model } = require("mongoose");
const slugify = require("../utilities/slugify");

const locationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    type: { type: String, enum: ["country", "region", "destination", "port", "city"], required: true },
    countryCode: String,
    country: String,
    parent: { type: Schema.Types.ObjectId, ref: "LocationV2" },
    aliases: [String],
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

locationSchema.pre("validate", function (next) {
  if (!this.slug && this.name) this.slug = slugify(this.name);
  next();
});

module.exports = model("LocationV2", locationSchema);
