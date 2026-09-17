const { Schema, model } = require("mongoose");

const organisationMembershipSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    organisation: {
      type: Schema.Types.ObjectId,
      ref: "OrganisationV2",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["owner", "admin", "editor", "reservations", "viewer"],
      default: "owner",
    },
    status: { type: String, enum: ["active", "invited", "disabled"], default: "active" },
  },
  { timestamps: true }
);

organisationMembershipSchema.index({ user: 1, organisation: 1 }, { unique: true });

module.exports = model("OrganisationMembershipV2", organisationMembershipSchema);
