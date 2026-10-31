const httpStatus = require("http-status");
const catchAsync = require("../../utilities/catchAsync");
const sendResponse = require("../../utilities/sendResponse");
const AppError = require("../../error/appError");
const Organisation = require("../models/organisation.model");
const OrganisationMembership = require("../models/organisationMembership.model");
const OrganisationMemberInvitation = require("../models/organisationMemberInvitation.model");
const Vessel = require("../models/vessel.model");
const Resort = require("../models/resort.model");
const CabinType = require("../models/cabinType.model");
const RoomType = require("../models/roomType.model");
const ResortPackage = require("../models/resortPackage.model");
const ResortRatePeriod = require("../models/resortRatePeriod.model");
const MediaAsset = require("../models/mediaAsset.model");
const Notification = require("../models/notification.model");
const Enquiry = require("../models/enquiry.model");
const ImportBatch = require("../models/importBatch.model");
const AvailabilityEffective = require("../models/availabilityEffective.model");
const AttributeDefinition = require("../models/attributeDefinition.model");
const { parseSpreadsheet } = require("../services/bulkFile.service");
const { logAudit } = require("../services/audit.service");
const { publishDomainEvent } = require("../services/domainEvent.service");
const { safeSend } = require("../services/notification.service");
const { setVerification } = require("../services/verification.service");
const { previewOperatorImport, commitOperatorImport } = require("../services/operatorImport.service");
const {
  MEMBER_ROLES, listMyOrganisations, dashboardSummary, vesselDetail, resortDetail, createMemberInvitation,
  inspectMemberInvitation, acceptMemberInvitation, canManageRole, assertOwnedProduct, refreshOrganisationCompleteness,
} = require("../services/operatorPortal.service");

const ok = (res, message, data, statusCode = httpStatus.OK) => sendResponse(res, { statusCode, success: true, message, data });
const membershipRole = req => req.organisationMembership?.role || (req.v2User?.role === "admin" ? "owner" : null);

const organisations = catchAsync(async (req, res) => ok(res, "Operator organisations retrieved", await listMyOrganisations(req.v2User)));
const dashboard = catchAsync(async (req, res) => ok(res, "Operator dashboard retrieved", await dashboardSummary({ organisationId: req.params.organisationId, userId: req.v2User._id })));

const getProfile = catchAsync(async (req, res) => {
  const item = await Organisation.findById(req.params.organisationId).lean();
  if (!item) throw new AppError(404, "Organisation not found");
  ok(res, "Operator profile retrieved", item);
});

const updateProfile = catchAsync(async (req, res) => {
  const item = await Organisation.findById(req.params.organisationId);
  if (!item) throw new AppError(404, "Organisation not found");
  if (req.body.expectedUpdatedAt && new Date(req.body.expectedUpdatedAt).getTime() !== new Date(item.updatedAt).getTime()) throw new AppError(409, "Organisation changed since it was loaded", { code: "conflict", details: { currentUpdatedAt: item.updatedAt } });
  const before = item.toObject();
  const allowed = ["name","primaryEmail","phone","whatsapp","website","address","country"];
  const fields = Object.fromEntries(allowed.filter(field => Object.prototype.hasOwnProperty.call(req.body, field)).map(field => [field, req.body[field]]));
  const updated = await Organisation.findOneAndUpdate({ _id: item._id, updatedAt: item.updatedAt }, { $set: fields }, { new: true, runValidators: true });
  if (!updated) throw new AppError(409, "Organisation changed since it was loaded");
  await logAudit({ req, organisation: item._id, actorOrganisation: item._id, action: "operator.profile.update", entityType: "organisation", entityId: item._id, before, after: updated.toObject(), source: "operator" });
  ok(res, "Operator profile updated", updated);
});

const members = catchAsync(async (req, res) => {
  const [active, invitations] = await Promise.all([
    OrganisationMembership.find({ organisation: req.params.organisationId }).populate("user", "name email phone whatsapp status isValid").sort({ createdAt: 1 }).lean(),
    OrganisationMemberInvitation.find({ organisation: req.params.organisationId, status: { $in: ["pending","accepted","revoked","expired"] } }).sort({ createdAt: -1 }).limit(50).lean(),
  ]);
  ok(res, "Organisation members retrieved", { members: active, invitations });
});

const inviteMember = catchAsync(async (req, res) => {
  if (!MEMBER_ROLES.includes(req.body.role)) throw new AppError(400, "Unsupported member role");
  const { invite, token } = await createMemberInvitation({ organisationId: req.params.organisationId, email: req.body.email, role: req.body.role, invitedBy: req.v2User._id, expiresHours: req.body.expiresHours });
  const organisation = await Organisation.findById(req.params.organisationId).lean();
  const url = `${process.env.FRONTEND_URL || ""}/team-invite/${token}`;
  await safeSend({ to: invite.email, subject: `Join ${organisation?.name || "your organisation"} on Deeparture`, text: `You have been invited to join ${organisation?.name || "an organisation"} on Deeparture as ${invite.role}. Accept the invitation: ${url}` });
  await logAudit({ req, organisation: invite.organisation, actorOrganisation: invite.organisation, action: "operator.member.invite", entityType: "organisationMemberInvitation", entityId: invite._id, after: { email: invite.email, role: invite.role, expiresAt: invite.expiresAt }, source: "operator" });
  ok(res, "Member invitation sent", { invitation: invite, invitationUrl: process.env.NODE_ENV === "production" ? undefined : url }, httpStatus.CREATED);
});

const updateMember = catchAsync(async (req, res) => {
  const membership = await OrganisationMembership.findOne({ _id: req.params.membershipId, organisation: req.params.organisationId });
  if (!membership) throw new AppError(404, "Membership not found");
  const requesterRole = membershipRole(req);
  const nextRole = req.body.role || membership.role;
  if (!MEMBER_ROLES.includes(nextRole) && nextRole !== "owner") throw new AppError(400, "Unsupported member role");
  if (!canManageRole({ requesterRole, targetRole: membership.role, nextRole })) throw new AppError(403, "You cannot change this member role");
  if (membership.role === "owner" && (nextRole !== "owner" || req.body.status === "disabled")) {
    const owners = await OrganisationMembership.countDocuments({ organisation: req.params.organisationId, role: "owner", status: "active" });
    if (owners <= 1) throw new AppError(409, "The organisation must retain at least one active owner");
  }
  const before = membership.toObject();
  membership.role = nextRole;
  if (req.body.status && ["active","disabled"].includes(req.body.status)) membership.status = req.body.status;
  await membership.save();
  await logAudit({ req, organisation: membership.organisation, actorOrganisation: membership.organisation, action: "operator.member.update", entityType: "organisationMembership", entityId: membership._id, before, after: membership.toObject(), source: "operator" });
  ok(res, "Member updated", membership);
});

const revokeInvitation = catchAsync(async (req, res) => {
  const invite = await OrganisationMemberInvitation.findOne({ _id: req.params.invitationId, organisation: req.params.organisationId });
  if (!invite) throw new AppError(404, "Invitation not found");
  invite.status = "revoked"; invite.revokedAt = new Date(); await invite.save();
  await logAudit({ req, organisation: invite.organisation, actorOrganisation: invite.organisation, action: "operator.member.invitation_revoke", entityType: "organisationMemberInvitation", entityId: invite._id, after: { status: invite.status }, source: "operator" });
  ok(res, "Invitation revoked", invite);
});

const inspectInvitation = catchAsync(async (req, res) => ok(res, "Invitation retrieved", await inspectMemberInvitation(req.params.token)));
const acceptInvitation = catchAsync(async (req, res) => ok(res, "Invitation accepted", await acceptMemberInvitation({ token: req.params.token, fullName: req.body.fullName, password: req.body.password, phone: req.body.phone, whatsapp: req.body.whatsapp })));

const listVessels = catchAsync(async (req, res) => ok(res, "Vessels retrieved", await Vessel.find({ organisation: req.params.organisationId }).sort({ name: 1 }).lean()));
const getVessel = catchAsync(async (req, res) => ok(res, "Vessel retrieved", await vesselDetail({ organisationId: req.params.organisationId, vesselId: req.params.id })));
const listResorts = catchAsync(async (req, res) => ok(res, "Resorts retrieved", await Resort.find({ organisation: req.params.organisationId }).sort({ name: 1 }).lean()));
const getResort = catchAsync(async (req, res) => ok(res, "Resort retrieved", await resortDetail({ organisationId: req.params.organisationId, resortId: req.params.id })));

const createCabin = catchAsync(async (req, res) => {
  await assertOwnedProduct({ organisationId: req.params.organisationId, productType: "vessel", productId: req.body.vessel });
  const item = await CabinType.create({ ...req.body, organisation: req.params.organisationId });
  await logAudit({ req, organisation: req.params.organisationId, actorOrganisation: req.params.organisationId, action: "operator.cabin.create", entityType: "cabinType", entityId: item._id, after: item.toObject(), source: "operator" });
  ok(res, "Cabin type created", item, httpStatus.CREATED);
});
const updateCabin = catchAsync(async (req, res) => {
  const item = await CabinType.findOne({ _id: req.params.id, organisation: req.params.organisationId });
  if (!item) throw new AppError(404, "Cabin type not found");
  if (req.body.vessel && String(req.body.vessel) !== String(item.vessel)) throw new AppError(400, "Cabin vessel cannot be changed");
  const before = item.toObject(); Object.assign(item, req.body); item.organisation = req.params.organisationId; item.vessel = before.vessel; await item.save();
  await logAudit({ req, organisation: item.organisation, actorOrganisation: item.organisation, action: "operator.cabin.update", entityType: "cabinType", entityId: item._id, before, after: item.toObject(), source: "operator" });
  ok(res, "Cabin type updated", item);
});

const updateRoomType = catchAsync(async (req, res) => {
  const item = await RoomType.findOne({ _id: req.params.id, organisation: req.params.organisationId });
  if (!item) throw new AppError(404, "Room type not found");
  const before = item.toObject(); const resort = item.resort; Object.assign(item, req.body); item.organisation = req.params.organisationId; item.resort = resort; await item.save();
  await logAudit({ req, organisation: item.organisation, actorOrganisation: item.organisation, action: "operator.room.update", entityType: "roomType", entityId: item._id, before, after: item.toObject(), source: "operator" });
  ok(res, "Room type updated", item);
});
const updatePackage = catchAsync(async (req, res) => {
  const item = await ResortPackage.findOne({ _id: req.params.id, organisation: req.params.organisationId });
  if (!item) throw new AppError(404, "Package not found");
  if (req.body.roomType) {
    const room = await RoomType.findOne({ _id: req.body.roomType, organisation: req.params.organisationId, resort: item.resort });
    if (!room) throw new AppError(400, "Room type does not belong to this resort");
  }
  const before = item.toObject(); const resort = item.resort; Object.assign(item, req.body); item.organisation = req.params.organisationId; item.resort = resort; await item.save();
  await logAudit({ req, organisation: item.organisation, actorOrganisation: item.organisation, action: "operator.package.update", entityType: "resortPackage", entityId: item._id, before, after: item.toObject(), source: "operator" });
  ok(res, "Package updated", item);
});
const updateRate = catchAsync(async (req, res) => {
  const item = await ResortRatePeriod.findOne({ _id: req.params.id, organisation: req.params.organisationId });
  if (!item) throw new AppError(404, "Rate period not found");
  if (req.body.roomType) {
    const room = await RoomType.findOne({ _id: req.body.roomType, organisation: req.params.organisationId, resort: item.resort });
    if (!room) throw new AppError(400, "Room type does not belong to this resort");
  }
  const before = item.toObject(); const parent = { resort: item.resort, package: item.package }; Object.assign(item, req.body); item.organisation = req.params.organisationId; item.resort = parent.resort; item.package = parent.package; await item.save();
  await logAudit({ req, organisation: item.organisation, actorOrganisation: item.organisation, action: "operator.rate.update", entityType: "resortRatePeriod", entityId: item._id, before, after: item.toObject(), source: "operator" });
  ok(res, "Rate period updated", item);
});

const listDefinitions = catchAsync(async (req, res) => {
  const filter = { active: true, visibleOnPage: true };
  if (req.query.productType) filter.applicableTo = { $in: [req.query.productType, "both"] };
  ok(res, "Attribute definitions retrieved", await AttributeDefinition.find(filter).sort({ group: 1, sortOrder: 1, label: 1 }).lean());
});

const operatorVerify = catchAsync(async (req, res) => {
  const product = await assertOwnedProduct({ organisationId: req.params.organisationId, productType: req.params.productType, productId: req.params.id });
  const result = await setVerification({ entityType: req.params.productType === "resort" ? "resort" : "vessel", entityId: product._id, status: "operator_verified", actorUserId: req.v2User._id, sourceType: "operator", scope: req.body.scope || "operator supplied listing data", notes: req.body.notes, operationId: req.operationId });
  await logAudit({ req, organisation: req.params.organisationId, actorOrganisation: req.params.organisationId, action: "operator.listing.verify", entityType: req.params.productType, entityId: product._id, after: { verificationStatus: "operator_verified" }, source: "operator" });
  ok(res, "Listing marked operator verified", result);
});

const listMedia = catchAsync(async (req, res) => ok(res, "Media retrieved", await MediaAsset.find({ organisation: req.params.organisationId, ...(req.query.entityType ? { entityType: req.query.entityType } : {}), ...(req.query.entityId ? { entityId: req.query.entityId } : {}) }).sort({ sortOrder: 1, createdAt: 1 }).lean()));
const createMedia = catchAsync(async (req, res) => {
  const { entityType, entityId, url } = req.body;
  if (!['vessel','resort'].includes(entityType)) throw new AppError(400, "Media entityType must be vessel or resort");
  const product = await assertOwnedProduct({ organisationId: req.params.organisationId, productType: entityType, productId: entityId });
  if (!/^https?:\/\//i.test(String(url || ""))) throw new AppError(400, "Media URL must use http or https");
  const featured = Boolean(req.body.featured);
  if (featured) await MediaAsset.updateMany({ organisation: req.params.organisationId, entityType, entityId, featured: true }, { $set: { featured: false } });
  const item = await MediaAsset.create({ organisation: req.params.organisationId, entityType, entityId, url, type: req.body.type || "image", title: req.body.title, altText: req.body.altText, source: "operator", sourceUrl: req.body.sourceUrl, sortOrder: Number(req.body.sortOrder || 0), featured, usageApproved: req.v2User?.role === "admin" ? Boolean(req.body.usageApproved) : false });
  if (item.type === "image") {
    const Model = entityType === "resort" ? Resort : Vessel;
    const update = item.featured ? { $set: { featuredImage: item.url }, $addToSet: { gallery: item.url } } : { $addToSet: { gallery: item.url } };
    await Model.updateOne({ _id: product._id }, update);
  }
  await logAudit({ req, organisation: req.params.organisationId, actorOrganisation: req.params.organisationId, action: "operator.media.create", entityType: "mediaAsset", entityId: item._id, after: item.toObject(), source: "operator" });
  ok(res, "Media added", item, httpStatus.CREATED);
});
const updateMedia = catchAsync(async (req, res) => {
  const item = await MediaAsset.findOne({ _id: req.params.id, organisation: req.params.organisationId });
  if (!item) throw new AppError(404, "Media asset not found");
  const before = item.toObject();
  for (const key of ['title','altText','sortOrder','featured','sourceUrl']) if (Object.prototype.hasOwnProperty.call(req.body,key)) item[key]=req.body[key];
  if (item.featured) await MediaAsset.updateMany({ organisation: item.organisation, entityType: item.entityType, entityId: item.entityId, _id: { $ne: item._id }, featured: true }, { $set: { featured: false } });
  await item.save();
  if (item.featured && item.type === 'image' && item.entityId) {
    const Model = item.entityType === 'resort' ? Resort : Vessel;
    await Model.updateOne({ _id: item.entityId, organisation: item.organisation }, { $set: { featuredImage: item.url }, $addToSet: { gallery: item.url } });
  }
  await logAudit({ req, organisation: item.organisation, actorOrganisation: item.organisation, action: "operator.media.update", entityType: "mediaAsset", entityId: item._id, before, after: item.toObject(), source: "operator" });
  ok(res, "Media updated", item);
});
const deleteMedia = catchAsync(async (req, res) => {
  const item = await MediaAsset.findOne({ _id: req.params.id, organisation: req.params.organisationId });
  if (!item) throw new AppError(404, "Media asset not found");
  if (item.type === 'image' && item.entityId) {
    const Model = item.entityType === 'resort' ? Resort : Vessel;
    await Model.updateOne({ _id: item.entityId, organisation: item.organisation }, { $pull: { gallery: item.url }, $unset: item.featured ? { featuredImage: 1 } : {} });
  }
  await item.deleteOne();
  await logAudit({ req, organisation: item.organisation, actorOrganisation: item.organisation, action: "operator.media.delete", entityType: "mediaAsset", entityId: item._id, before: item.toObject(), source: "operator" });
  ok(res, "Media removed", { id: item._id });
});

const notifications = catchAsync(async (req, res) => {
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
  const query = { audience: "operator", $or: [{ recipientUser: req.v2User._id }, { recipientOrganisation: req.params.organisationId }] };
  if (String(req.query.unread) === "true") query.readAt = { $exists: false };
  const [items, unread] = await Promise.all([Notification.find(query).sort({ createdAt: -1 }).limit(limit).lean(), Notification.countDocuments({ ...query, readAt: { $exists: false } })]);
  ok(res, "Notifications retrieved", { items, unread });
});
const markNotificationRead = catchAsync(async (req, res) => {
  const item = await Notification.findOneAndUpdate({ _id: req.params.id, audience: "operator", $or: [{ recipientUser: req.v2User._id }, { recipientOrganisation: req.params.organisationId }] }, { $set: { readAt: new Date() } }, { new: true });
  if (!item) throw new AppError(404, "Notification not found");
  ok(res, "Notification marked read", item);
});

const enquiries = catchAsync(async (req, res) => ok(res, "Enquiries retrieved", await Enquiry.find({ organisation: req.params.organisationId, status: { $in: ["sent_to_operator","operator_accepted","operator_replied","quoted","confirmed"] } }).sort({ createdAt: -1 }).limit(100).lean()));

const availability = catchAsync(async (req, res) => {
  const limit = Math.min(250, Math.max(1, Number(req.query.limit) || 100));
  const query = { organisation: req.params.organisationId };
  if (req.query.productType) query.productType = req.query.productType;
  if (req.query.freshnessState) query.freshnessState = req.query.freshnessState;
  if (String(req.query.conflict) === "true") query.conflictState = true;
  const items = await AvailabilityEffective.find(query).sort({ updatedAt: -1, inventoryKey: 1 }).limit(limit).lean();
  ok(res, "Availability retrieved", items);
});

const previewImport = catchAsync(async (req, res) => {
  const rows = req.file ? await parseSpreadsheet(req.file) : req.body.rows;
  const name = req.file?.originalname || req.body.sourceFilename;
  const ext = String(name || "").toLowerCase();
  const sourceType = ext.endsWith(".xlsx") || ext.endsWith(".xls") ? "xlsx" : ext.endsWith(".csv") ? "csv" : "json";
  const batch = await previewOperatorImport({ organisationId: req.params.organisationId, importType: req.params.importType, rows, sourceType, sourceFilename: name, createdBy: req.v2User._id, operationId: req.operationId });
  await logAudit({ req, organisation: req.params.organisationId, actorOrganisation: req.params.organisationId, action: "operator.import.preview", entityType: "importBatch", entityId: batch._id, after: { importType: batch.importType, summary: batch.summary }, source: "operator" });
  ok(res, "Import preview created", batch, httpStatus.CREATED);
});
const commitImport = catchAsync(async (req, res) => {
  const batch = await commitOperatorImport({ batchId: req.params.batchId, organisationId: req.params.organisationId, userId: req.v2User._id, operationId: req.operationId });
  await logAudit({ req, organisation: req.params.organisationId, actorOrganisation: req.params.organisationId, action: "operator.import.commit", entityType: "importBatch", entityId: batch._id, after: { importType: batch.importType, summary: batch.summary, status: batch.status }, source: "operator" });
  await publishDomainEvent({ name: "operator.import.completed", aggregateType: "importBatch", aggregateId: batch._id, organisation: req.params.organisationId, actorUser: req.v2User._id, operationId: req.operationId, payload: { importType: batch.importType, status: batch.status }, retentionClass: "business" });
  await refreshOrganisationCompleteness(req.params.organisationId);
  ok(res, "Import committed", batch);
});
const importHistory = catchAsync(async (req, res) => ok(res, "Operator import history retrieved", await ImportBatch.find({ organisation: req.params.organisationId, kind: "operator_inventory" }).sort({ createdAt: -1 }).limit(100).lean()));
const getImportBatch = catchAsync(async (req, res) => {
  const batch = await ImportBatch.findOne({ _id: req.params.batchId, organisation: req.params.organisationId, kind: "operator_inventory" }).lean();
  if (!batch) throw new AppError(404, "Import batch not found");
  ok(res, "Operator import batch retrieved", batch);
});

module.exports = {
  organisations, dashboard, getProfile, updateProfile, members, inviteMember, updateMember, revokeInvitation, inspectInvitation, acceptInvitation,
  listVessels, getVessel, listResorts, getResort, createCabin, updateCabin, updateRoomType, updatePackage, updateRate,
  listDefinitions, operatorVerify, listMedia, createMedia, updateMedia, deleteMedia, notifications, markNotificationRead,
  enquiries, availability, previewImport, commitImport, importHistory, getImportBatch,
};
