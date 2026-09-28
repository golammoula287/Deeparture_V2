const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const httpStatus = require("http-status");
const User = require("../../models/user.model");
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

  if (organisation.status === 'unclaimed') organisation.status = "invited";
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

  let user = await User.findOne({ email: claim.email }).select('+password');
  if (user) {
    if (!['operator', 'admin'].includes(user.role) || user.status !== 'active' || !user.isValid) {
      throw new AppError(httpStatus.FORBIDDEN, 'Existing account is not eligible to claim');
    }
    if (!(await bcrypt.compare(password, user.password))) {
      throw new AppError(httpStatus.UNAUTHORIZED, 'Use your existing account password to accept this invitation');
    }
  } else if (password.length < 12) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Use a password of at least 12 characters');
  }
  // Atomically consume before granting membership; concurrent requests cannot reuse it.
  const consumed = await ClaimToken.findOneAndUpdate(
    { _id: claim._id, usedAt: { $exists: false }, expiresAt: { $gt: new Date() } },
    { $set: { usedAt: new Date() } }, { new: true }
  );
  if (!consumed) throw new AppError(httpStatus.BAD_REQUEST, 'Claim link is invalid or expired');
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
  }

  await OrganisationMembership.findOneAndUpdate(
    { user: user._id, organisation: organisation._id },
    { user: user._id, organisation: organisation._id, role: "owner", status: "active" },
    { new: true, upsert: true, runValidators: true }
  );

  organisation.status = organisation.status === "verified" ? "verified" : "claimed";
  organisation.claimedAt = new Date();
  await organisation.save();

  return { user: await User.findById(user._id).select("-password"), organisation };
};

module.exports = { createClaimInvitation, acceptClaim };
