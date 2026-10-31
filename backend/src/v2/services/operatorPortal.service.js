const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const AppError = require("../../error/appError");
const Organisation = require("../models/organisation.model");
const OrganisationMembership = require("../models/organisationMembership.model");
const OrganisationMemberInvitation = require("../models/organisationMemberInvitation.model");
const User = require("../../models/user.model");
const Vessel = require("../models/vessel.model");
const Resort = require("../models/resort.model");
const CabinType = require("../models/cabinType.model");
const Itinerary = require("../models/itinerary.model");
const Departure = require("../models/departure.model");
const RoomType = require("../models/roomType.model");
const ResortPackage = require("../models/resortPackage.model");
const ResortRatePeriod = require("../models/resortRatePeriod.model");
const ResortAvailability = require("../models/resortAvailability.model");
const ProductAttribute = require("../models/productAttribute.model");
const MediaAsset = require("../models/mediaAsset.model");
const Enquiry = require("../models/enquiry.model");
const Notification = require("../models/notification.model");
const AvailabilityEffective = require("../models/availabilityEffective.model");
const ImportBatch = require("../models/importBatch.model");
const { refreshProductCompleteness } = require("./completeness.service");

const { MEMBER_ROLES, ROLE_WEIGHT, safeRole, canManageRole } = require("./operatorPortal.helpers");
const randomToken = () => crypto.randomBytes(32).toString("hex");
const hashToken = token => crypto.createHash("sha256").update(String(token)).digest("hex");

const assertOwnedProduct = async ({ organisationId, productType, productId }) => {
  const Model = productType === "resort" ? Resort : Vessel;
  if (!Model) throw new AppError(400, "Unsupported product type");
  const product = await Model.findOne({ _id: productId, organisation: organisationId });
  if (!product) throw new AppError(404, "Listing not found for this organisation");
  return product;
};

const listMyOrganisations = async user => {
  if (user.role === "admin") {
    return Organisation.find({ type: "operator" }).sort({ name: 1 }).lean();
  }
  const memberships = await OrganisationMembership.find({ user: user._id, status: "active" })
    .populate("organisation").sort({ createdAt: 1 }).lean();
  return memberships.filter(item => item.organisation && item.organisation.status !== "suspended" && item.organisation.accountStatus !== "suspended").map(item => ({ ...item.organisation, membershipRole: item.role, membershipId: item._id }));
};

const dashboardSummary = async ({ organisationId, userId }) => {
  const now = new Date();
  const in90Days = new Date(now.getTime() + 90 * 86400000);
  const [organisation, vessels, resorts, upcoming, enquiries, stale, conflicts, unread, recentImports] = await Promise.all([
    Organisation.findById(organisationId).lean(),
    Vessel.find({ organisation: organisationId, listingStatus: { $ne: "archived" } }).sort({ updatedAt: -1 }).lean(),
    Resort.find({ organisation: organisationId, listingStatus: { $ne: "archived" } }).sort({ updatedAt: -1 }).lean(),
    Departure.find({ organisation: organisationId, startDate: { $gte: now, $lte: in90Days }, status: { $ne: "cancelled" } })
      .sort({ startDate: 1 }).limit(8).populate("vessel", "name").populate("itinerary", "name").lean(),
    Enquiry.find({ organisation: organisationId, status: { $in: ["sent_to_operator", "operator_accepted", "operator_replied", "quoted"] } })
      .sort({ createdAt: -1 }).limit(8).lean(),
    AvailabilityEffective.countDocuments({ organisation: organisationId, freshnessState: "stale" }),
    AvailabilityEffective.countDocuments({ organisation: organisationId, conflictState: true }),
    Notification.countDocuments({ audience: "operator", readAt: { $exists: false }, $or: [{ recipientUser: userId }, { recipientOrganisation: organisationId }] }),
    ImportBatch.find({ organisation: organisationId }).sort({ createdAt: -1 }).limit(5).lean(),
  ]);
  if (!organisation) throw new AppError(404, "Organisation not found");
  const activeOffers = await Departure.countDocuments({ organisation: organisationId, offers: { $elemMatch: { active: true, $or: [{ validUntil: { $exists: false } }, { validUntil: { $gte: now } }] } } });
  const incomplete = [
    ...vessels.filter(item => Number(item.completenessScore || 0) < 80).map(item => ({ productType: "vessel", id: item._id, name: item.name, score: item.completenessScore || 0, missing: item.completenessMissing || [] })),
    ...resorts.filter(item => Number(item.completenessScore || 0) < 80).map(item => ({ productType: "resort", id: item._id, name: item.name, score: item.completenessScore || 0, missing: item.completenessMissing || [] })),
  ].sort((a,b) => a.score - b.score).slice(0, 8);
  return {
    organisation,
    counts: { vessels: vessels.length, resorts: resorts.length, pendingEnquiries: enquiries.length, staleAvailability: stale, availabilityConflicts: conflicts, activeOffers, unreadNotifications: unread },
    incomplete, upcomingDepartures: upcoming, enquiries, recentImports,
  };
};

const vesselDetail = async ({ organisationId, vesselId }) => {
  const vessel = await Vessel.findOne({ _id: vesselId, organisation: organisationId }).lean();
  if (!vessel) throw new AppError(404, "Vessel not found for this organisation");
  const [cabins, itineraries, departures, attributes, media] = await Promise.all([
    CabinType.find({ vessel: vesselId, organisation: organisationId }).sort({ name: 1 }).lean(),
    Itinerary.find({ vessel: vesselId, organisation: organisationId }).sort({ name: 1 }).lean(),
    Departure.find({ vessel: vesselId, organisation: organisationId }).sort({ startDate: 1 }).limit(250).lean(),
    ProductAttribute.find({ product: vesselId, productModel: "VesselV2" }).populate("definition").lean(),
    MediaAsset.find({ organisation: organisationId, entityType: "vessel", entityId: vesselId }).sort({ sortOrder: 1, createdAt: 1 }).lean(),
  ]);
  return { vessel, cabins, itineraries, departures, attributes, media };
};

const resortDetail = async ({ organisationId, resortId }) => {
  const resort = await Resort.findOne({ _id: resortId, organisation: organisationId }).lean();
  if (!resort) throw new AppError(404, "Resort not found for this organisation");
  const [roomTypes, packages, ratePeriods, availability, attributes, media] = await Promise.all([
    RoomType.find({ resort: resortId, organisation: organisationId }).sort({ name: 1 }).lean(),
    ResortPackage.find({ resort: resortId, organisation: organisationId }).sort({ name: 1 }).lean(),
    ResortRatePeriod.find({ resort: resortId, organisation: organisationId }).sort({ startDate: 1 }).lean(),
    ResortAvailability.find({ resort: resortId, organisation: organisationId, date: { $gte: new Date(Date.now() - 86400000) } }).sort({ date: 1 }).limit(365).lean(),
    ProductAttribute.find({ product: resortId, productModel: "ResortV2" }).populate("definition").lean(),
    MediaAsset.find({ organisation: organisationId, entityType: "resort", entityId: resortId }).sort({ sortOrder: 1, createdAt: 1 }).lean(),
  ]);
  return { resort, roomTypes, packages, ratePeriods, availability, attributes, media };
};

const createMemberInvitation = async ({ organisationId, email, role, invitedBy, expiresHours = 72 }) => {
  const normalEmail = String(email || "").trim().toLowerCase();
  if (!normalEmail || !normalEmail.includes("@")) throw new AppError(400, "A valid invitation email is required");
  const inviteRole = safeRole(role);
  await OrganisationMemberInvitation.updateMany({ organisation: organisationId, email: normalEmail, status: "pending" }, { $set: { status: "revoked", revokedAt: new Date() } });
  const token = randomToken();
  const invite = await OrganisationMemberInvitation.create({
    organisation: organisationId, email: normalEmail, role: inviteRole, tokenHash: hashToken(token), invitedBy,
    expiresAt: new Date(Date.now() + Math.max(1, Math.min(168, Number(expiresHours) || 72)) * 3600000),
  });
  return { invite, token };
};

const inspectMemberInvitation = async token => {
  const invite = await OrganisationMemberInvitation.findOne({ tokenHash: hashToken(token), status: "pending" }).populate("organisation", "name").lean();
  if (!invite || invite.expiresAt <= new Date()) throw new AppError(404, "Invitation not found or expired");
  return { email: invite.email, role: invite.role, organisation: invite.organisation, expiresAt: invite.expiresAt };
};

const acceptMemberInvitation = async ({ token, fullName, password, phone, whatsapp }) => {
  if (!token || !password) throw new AppError(400, "Invitation token and password are required");
  const invite = await OrganisationMemberInvitation.findOne({ tokenHash: hashToken(token), status: "pending" });
  if (!invite) throw new AppError(404, "Invitation not found or already used");
  if (invite.expiresAt <= new Date()) {
    invite.status = "expired";
    await invite.save();
    throw new AppError(410, "Invitation has expired");
  }
  let user = await User.findOne({ email: invite.email }).select("+password");
  if (user) {
    if (!['operator','admin'].includes(user.role) || user.status !== 'active' || !user.isValid) throw new AppError(403, "Existing account is not eligible for this invitation");
    if (!(await bcrypt.compare(password, user.password))) throw new AppError(401, "Use your existing Deeparture password to accept this invitation");
  } else {
    if (String(password).length < 12) throw new AppError(400, "Use a password of at least 12 characters");
    user = new User({ fullName: fullName || invite.email.split('@')[0], email: invite.email, phone, whatsapp, password, isValid: true, role: 'operator', status: 'active' });
    await user.save();
  }
  const organisation = await Organisation.findById(invite.organisation).lean();
  if (!organisation || organisation.status === "suspended" || organisation.accountStatus === "suspended") throw new AppError(403, "Organisation is unavailable or suspended");
  // Invitations add teammates; they must never replace an existing role, especially owner.
  const existingMembership = await OrganisationMembership.findOne({ user: user._id, organisation: invite.organisation });
  if (existingMembership) throw new AppError(409, "This account already has a membership; manage its role through Team");
  const consumed = await OrganisationMemberInvitation.findOneAndUpdate(
    { _id: invite._id, status: 'pending', expiresAt: { $gt: new Date() } },
    { $set: { status: 'accepted', acceptedAt: new Date(), acceptedBy: user._id } },
    { new: true }
  );
  if (!consumed) throw new AppError(409, "Invitation was already accepted or expired");
  const membership = await OrganisationMembership.findOneAndUpdate(
    { user: user._id, organisation: invite.organisation },
    { $setOnInsert: { role: invite.role, status: "active" } },
    { new: true, upsert: true, runValidators: true }
  );
  return { user: await User.findById(user._id).select('-password'), invitation: consumed, membership };
};


const refreshOrganisationCompleteness = async organisationId => {
  const [vessels, resorts] = await Promise.all([
    Vessel.find({ organisation: organisationId }).select("_id").lean(),
    Resort.find({ organisation: organisationId }).select("_id").lean(),
  ]);
  for (const item of vessels) await refreshProductCompleteness({ productType: "vessel", productId: item._id });
  for (const item of resorts) await refreshProductCompleteness({ productType: "resort", productId: item._id });
};

module.exports = {
  MEMBER_ROLES, ROLE_WEIGHT, hashToken, safeRole, assertOwnedProduct, listMyOrganisations, dashboardSummary,
  vesselDetail, resortDetail, createMemberInvitation, inspectMemberInvitation, acceptMemberInvitation, canManageRole, refreshOrganisationCompleteness,
};
