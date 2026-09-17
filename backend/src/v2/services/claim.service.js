const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const httpStatus = require("http-status");
const User = require("../../models/user.model");
const config = require("../../config");
const AppError = require("../../error/appError");
const Organisation = require("../models/organisation.model");
const OrganisationMembership = require("../models/organisationMembership.model");
const ClaimToken = require("../models/claimToken.model");
const { sendClaimInvitation } = require("./notification.service");

const tokenHash = (token) => crypto.createHash("sha256").update(token).digest("hex");

const createClaimInvitation = async ({ organisationId, email, createdBy }) => {
  const organisation = await Organisation.findById(organisationId);
  if (!organisation) throw new AppError(httpStatus.NOT_FOUND, "Organisation not found");
  if (organisation.type !== "operator") throw new AppError(httpStatus.BAD_REQUEST, "Only operator organisations can be claimed through this flow");

  const normalizedEmail = String(email || organisation.primaryEmail || "").trim().toLowerCase();
  if (!normalizedEmail) throw new AppError(httpStatus.BAD_REQUEST, "Operator email is required");

  await ClaimToken.deleteMany({ organisation: organisation._id, email: normalizedEmail, usedAt: { $exists: false } });
  const rawToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await ClaimToken.create({
    organisation: organisation._id,
    email: normalizedEmail,
    tokenHash: tokenHash(rawToken),
    expiresAt,
    createdBy,
  });

  organisation.status = "invited";
  organisation.primaryEmail = normalizedEmail;
  await organisation.save();

  const claimUrl = `${process.env.FRONTEND_URL || ""}/claim-operator?token=${rawToken}`;
  await sendClaimInvitation({ organisation, email: normalizedEmail, claimUrl });
  return { organisation, expiresAt, claimUrl: process.env.NODE_ENV === "production" ? undefined : claimUrl };
};

const acceptClaim = async ({ token, fullName, password, phone, whatsapp }) => {
  if (!token || !password) throw new AppError(httpStatus.BAD_REQUEST, "Token and password are required");
  const claim = await ClaimToken.findOne({ tokenHash: tokenHash(token), usedAt: { $exists: false } });
  if (!claim || claim.expiresAt < new Date()) throw new AppError(httpStatus.BAD_REQUEST, "Claim link is invalid or expired");

  const organisation = await Organisation.findById(claim.organisation);
  if (!organisation) throw new AppError(httpStatus.NOT_FOUND, "Organisation not found");

  let user = await User.findOne({ email: claim.email });
  if (!user) {
    user = new User({
      fullName: fullName || organisation.name,
      email: claim.email,
      phone: phone || 0,
      whatsapp,
      password,
      isValid: true,
      role: "operator",
      status: "active",
    });
    await user.save();
  } else {
    if (user.role !== "operator" && user.role !== "admin") {
      throw new AppError(httpStatus.CONFLICT, "This email is already used by a non-operator account");
    }
    if (!user.isValid) user.isValid = true;
    if (password) user.password = await bcrypt.hash(password, Number(config.bcrypt_salt_rounds || 10));
    await User.updateOne({ _id: user._id }, { $set: { isValid: true, password: user.password } });
  }

  await OrganisationMembership.findOneAndUpdate(
    { user: user._id, organisation: organisation._id },
    { user: user._id, organisation: organisation._id, role: "owner", status: "active" },
    { new: true, upsert: true, runValidators: true }
  );

  organisation.status = organisation.status === "verified" ? "verified" : "claimed";
  organisation.claimedAt = new Date();
  await organisation.save();

  claim.usedAt = new Date();
  await claim.save();
  return { user: await User.findById(user._id).select("-password"), organisation };
};

module.exports = { createClaimInvitation, acceptClaim };
