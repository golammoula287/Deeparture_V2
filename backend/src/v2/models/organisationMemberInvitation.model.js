const { Schema, model } = require("mongoose");

const organisationMemberInvitationSchema = new Schema(
  {
    organisation: { type: Schema.Types.ObjectId, ref: "OrganisationV2", required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    role: { type: String, enum: ["admin", "editor", "reservations", "viewer"], required: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "accepted", "revoked", "expired"], default: "pending", index: true },
    expiresAt: { type: Date, required: true, index: true },
    acceptedAt: Date,
    acceptedBy: { type: Schema.Types.ObjectId, ref: "User" },
    revokedAt: Date,
  },
  { timestamps: true }
);

organisationMemberInvitationSchema.index({ organisation: 1, email: 1, status: 1 });
module.exports = model("OrganisationMemberInvitationV2", organisationMemberInvitationSchema);
