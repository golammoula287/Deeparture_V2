const httpStatus = require("http-status");
const catchAsync = require("../../utilities/catchAsync");
const sendResponse = require("../../utilities/sendResponse");
const AppError = require("../../error/appError");
const Organisation = require("../models/organisation.model");
const Vessel = require("../models/vessel.model");
const Resort = require("../models/resort.model");
const ResortRatePeriod = require("../models/resortRatePeriod.model");
const ResortPackage = require("../models/resortPackage.model");
const RoomType = require("../models/roomType.model");
const Departure = require("../models/departure.model");
const Itinerary = require("../models/itinerary.model");
const Location = require("../models/location.model");
const AttributeDefinition = require("../models/attributeDefinition.model");
const Enquiry = require("../models/enquiry.model");
const AuditLog = require("../models/auditLog.model");
const ClaimToken = require("../models/claimToken.model");
const slugify = require("../utilities/slugify");
const { logAudit } = require("../services/audit.service");
const { createClaimInvitation } = require("../services/claim.service");
const { sendEnquiryToOperator } = require("../services/notification.service");

const escapeRegex = (value) => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const LISTING_STATUSES = ["draft", "pending_review", "published", "restricted", "archived"];

const uniqueSlug = async (Model, value, id) => {
  const base = slugify(value) || "item";
  let candidate = base;
  let n = 2;
  while (await Model.exists({ slug: candidate, ...(id ? { _id: { $ne: id } } : {}) })) candidate = `${base}-${n++}`;
  return candidate;
};

const dashboard = catchAsync(async (req, res) => {
  const [liveaboards, resorts, drafts, pending, unclaimed, invited, enquiries, recent, claimed] = await Promise.all([
    Vessel.countDocuments({ listingStatus: { $ne: "archived" } }),
    Resort.countDocuments({ listingStatus: { $ne: "archived" } }),
    Promise.all([Vessel.countDocuments({ listingStatus: "draft" }), Resort.countDocuments({ listingStatus: "draft" })]).then((v) => v[0] + v[1]),
    Promise.all([Vessel.countDocuments({ listingStatus: "pending_review" }), Resort.countDocuments({ listingStatus: "pending_review" })]).then((v) => v[0] + v[1]),
    Organisation.countDocuments({ type: "operator", status: "unclaimed" }),
    Organisation.countDocuments({ type: "operator", status: "invited" }),
    Enquiry.countDocuments({ status: "new" }),
    AuditLog.find().select("action entityType entityId createdAt source").sort({ createdAt: -1 }).limit(12).lean(),
    Organisation.countDocuments({ type: 'operator', status: { $in: ['claimed','verified'] } }),
  ]);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Admin dashboard", data: { counts: { liveaboards, resorts, drafts, pending, unclaimed, invited, claimed, enquiries }, recent } });
});

const listProducts = (Model) => catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.listingStatus = req.query.status;
  if (req.query.organisation) filter.organisation = req.query.organisation;
  if (req.query.claimStatus) {
    const ids = await Organisation.distinct('_id', { status: req.query.claimStatus });
    filter.organisation = { $in: ids.filter(id => !req.query.organisation || String(id) === req.query.organisation) };
  }
  if (req.query.destination) filter.destinationSlugs = slugify(req.query.destination);
  if (req.query.q) filter.name = new RegExp(escapeRegex(req.query.q), "i");
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 50)));
  const [items, total] = await Promise.all([
    Model.find(filter).populate("organisation", "name status primaryEmail").sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Model.countDocuments(filter),
  ]);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Catalogue retrieved", data: { items, total, page, limit } });
});

const getProduct = (Model) => catchAsync(async (req, res) => {
  const item = await Model.findById(req.params.id).populate("organisation", "name status primaryEmail website").populate("destinationLocations", "name slug type").lean();
  if (!item) throw new AppError(httpStatus.NOT_FOUND, "Listing not found");
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Listing retrieved", data: item });
});

const syncDestinationLocations = async (payload) => {
  if (!Array.isArray(payload.destinationLocations)) return payload;
  const locations = await Location.find({ _id: { $in: payload.destinationLocations }, type: { $in: ["destination", "region", "country"] }, active: true }).select("_id slug").lean();
  if (locations.length !== new Set(payload.destinationLocations.map(String)).size) throw new AppError(400, 'Destinations must reference active canonical locations');
  payload.destinationLocations = locations.map((l) => l._id);
  payload.destinationSlugs = locations.map((l) => l.slug);
  return payload;
};

const PRODUCT_FIELDS = ["name", "slug", "listingStatus", "verificationStatus", "summary", "description", "featuredImage", "gallery", "destinationLocations", "destinationSlugs", "facilities", "dietary", "accessibility", "divingFeatures", "veganRating", "environmentalRating", "sourceUrl", "lastCheckedAt", "verifiedAt", "vesselType", "yearBuilt", "yearRefit", "lengthMeters", "beamMeters", "maxGuests", "cabinCount", "homePort", "country", "region", "district"];

const createProduct = (Model, type) => catchAsync(async (req, res) => {
  const organisation = await Organisation.findById(req.body.organisation);
  if (!organisation) throw new AppError(httpStatus.BAD_REQUEST, "Valid organisation is required");
  const payload = { ...req.body, slug: await uniqueSlug(Model, req.body.slug || req.body.name), listingStatus: req.body.listingStatus || "draft", source: req.body.source || "admin", lastCheckedAt: new Date() };
  await syncDestinationLocations(payload);
  const item = await Model.create(payload);
  await logAudit({ req, organisation: item.organisation, action: `${type}.create`, entityType: type, entityId: item._id, after: item.toObject(), source: "admin" });
  sendResponse(res, { statusCode: httpStatus.CREATED, success: true, message: "Listing created", data: item });
});

const updateProduct = (Model, type) => catchAsync(async (req, res) => {
  const item = await Model.findById(req.params.id);
  if (!item) throw new AppError(httpStatus.NOT_FOUND, "Listing not found");
  if (req.body.organisation && String(req.body.organisation) !== String(item.organisation)) throw new AppError(httpStatus.BAD_REQUEST, "Organisation cannot be transferred through this endpoint");
  const before = item.toObject();
  const payload = {};
  for (const key of PRODUCT_FIELDS) if (Object.prototype.hasOwnProperty.call(req.body, key)) payload[key] = req.body[key];
  if (payload.slug && payload.slug !== item.slug) payload.slug = await uniqueSlug(Model, payload.slug, item._id);
  await syncDestinationLocations(payload);
  Object.assign(item, payload);
  item.lastCheckedAt = new Date();
  await item.save();
  await logAudit({ req, organisation: item.organisation, action: `${type}.update`, entityType: type, entityId: item._id, before, after: item.toObject(), source: "admin" });
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Listing updated", data: item });
});

const setProductStatus = (Model, type) => catchAsync(async (req, res) => {
  if (!LISTING_STATUSES.includes(req.body.listingStatus)) throw new AppError(httpStatus.BAD_REQUEST, "Invalid listing status");
  const item = await Model.findById(req.params.id);
  if (!item) throw new AppError(httpStatus.NOT_FOUND, "Listing not found");
  const before = item.listingStatus;
  item.listingStatus = req.body.listingStatus;
  await item.save();
  await logAudit({ req, organisation: item.organisation, action: `${type}.status`, entityType: type, entityId: item._id, before: { listingStatus: before }, after: { listingStatus: item.listingStatus }, source: "admin" });
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Listing status updated", data: item });
});

const previewVessel = catchAsync(async (req, res) => {
  const item = await Vessel.findById(req.params.id).populate("organisation", "name slug status website").lean();
  if (!item) throw new AppError(httpStatus.NOT_FOUND, "Listing not found");
  const itineraries = await Itinerary.find({ vessel: item._id, status: { $ne: "archived" } }).populate("basePrices.cabinType").lean();
  const departures = await Departure.find({ vessel: item._id, status: { $ne: "cancelled" } }).sort({ startDate: 1 }).populate("itinerary", "name slug numberOfNights embarkation disembarkation").populate("effectivePrices.cabinType", "name").populate("availability.cabinType", "name").lean();
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Liveaboard preview", data: { ...item, itineraries, departures } });
});

const previewResort = catchAsync(async (req, res) => {
  const item = await Resort.findById(req.params.id).populate("organisation", "name slug status website").lean();
  if (!item) throw new AppError(httpStatus.NOT_FOUND, "Listing not found");
  const roomTypes = await RoomType.find({ resort: item._id, active: true }).lean();
  const packages = await ResortPackage.find({ resort: item._id, active: true }).populate("roomType").lean();
  const ratePeriods = await ResortRatePeriod.find({ package: { $in: packages.map((p) => p._id) }, active: true }).lean();
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Resort preview", data: { ...item, roomTypes, packages, ratePeriods } });
});

const listOrganisations = catchAsync(async (req, res) => {
  const filter = { type: "operator" };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.q) filter.name = new RegExp(escapeRegex(req.query.q), "i");
  const items = await Organisation.find(filter).sort({ name: 1 }).lean();
  const vesselCounts = await Vessel.aggregate([{ $match: { organisation: { $in: items.map((i) => i._id) } } }, { $group: { _id: "$organisation", count: { $sum: 1 } } }]);
  const resortCounts = await Resort.aggregate([{ $match: { organisation: { $in: items.map((i) => i._id) } } }, { $group: { _id: "$organisation", count: { $sum: 1 } } }]);
  const vc = new Map(vesselCounts.map((x) => [String(x._id), x.count]));
  const rc = new Map(resortCounts.map((x) => [String(x._id), x.count]));
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Organisations retrieved", data: items.map((item) => ({ ...item, vesselCount: vc.get(String(item._id)) || 0, resortCount: rc.get(String(item._id)) || 0 })) });
});

const createOrganisation = catchAsync(async (req, res) => {
  if (!req.body.name) throw new AppError(httpStatus.BAD_REQUEST, "Organisation name is required");
  const item = await Organisation.create({ ...req.body, slug: await uniqueSlug(Organisation, req.body.slug || req.body.name), type: "operator", status: req.body.status || "unclaimed", accountStatus: req.body.accountStatus || "active", source: req.body.source || "admin" });
  await logAudit({ req, organisation: item._id, action: "organisation.create", entityType: "organisation", entityId: item._id, after: item.toObject(), source: "admin" });
  sendResponse(res, { statusCode: httpStatus.CREATED, success: true, message: "Organisation created", data: item });
});

const updateOrganisation = catchAsync(async (req, res) => {
  const item = await Organisation.findById(req.params.id);
  if (!item) throw new AppError(httpStatus.NOT_FOUND, "Organisation not found");
  const before = item.toObject();
  const allowed = ["name", "primaryEmail", "phone", "whatsapp", "website", "address", "country", "status", "accountStatus", "verifiedAt", "lastCheckedAt"];
  for (const key of allowed) if (Object.prototype.hasOwnProperty.call(req.body, key)) item[key] = req.body[key];
  if (req.body.slug && req.body.slug !== item.slug) item.slug = await uniqueSlug(Organisation, req.body.slug, item._id);
  await item.save();
  await logAudit({ req, organisation: item._id, action: "organisation.update", entityType: "organisation", entityId: item._id, before, after: item.toObject(), source: "admin" });
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Organisation updated", data: item });
});

const inviteOrganisation = catchAsync(async (req, res) => {
  const organisation = await Organisation.findById(req.params.id);
  if (!organisation) throw new AppError(httpStatus.NOT_FOUND, "Organisation not found");
  const result = await createClaimInvitation({ organisationId: organisation._id, email: req.body.email || organisation.primaryEmail, createdBy: req.v2User._id });
  await logAudit({ req, organisation: organisation._id, action: "organisation.claim.invited", entityType: "organisation", entityId: organisation._id, after: { email: req.body.email || organisation.primaryEmail, expiresAt: result.expiresAt }, source: "admin" });
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Claim invitation sent", data: { organisation: result.organisation, expiresAt: result.expiresAt } });
});

const listLocations = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.type) filter.type = req.query.type;
  if (req.query.active) filter.active = req.query.active === "true";
  const items = await Location.find(filter).populate("parent", "name type slug").sort({ type: 1, name: 1 }).lean();
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Locations retrieved", data: items });
});
const createLocation = catchAsync(async (req, res) => {
  await validateLocation(req.body);
  const item = await Location.create({ ...req.body, slug: await uniqueSlug(Location, req.body.slug || req.body.name) });
  await logAudit({ req, action: "location.create", entityType: "location", entityId: item._id, after: item.toObject(), source: "admin" });
  sendResponse(res, { statusCode: httpStatus.CREATED, success: true, message: "Location created", data: item });
});
const updateLocation = catchAsync(async (req, res) => {
  const item = await Location.findById(req.params.id);
  if (!item) throw new AppError(httpStatus.NOT_FOUND, "Location not found");
  const before = item.toObject();
  const payload = Object.fromEntries(['name','type','countryCode','country','parent','aliases','active'].filter(key => req.body[key] !== undefined).map(key => [key, req.body[key]]));
  await validateLocation({ ...before, ...payload }, item._id);
  Object.assign(item, payload);
  await item.save();
  await logAudit({ req, action: "location.update", entityType: "location", entityId: item._id, before, after: item.toObject(), source: "admin" });
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Location updated", data: item });
});

// Keep slugs stable when labels change; aliases cannot create another canonical record.
const validateLocation = async (payload, id) => {
  const keys = [payload.name, ...(payload.aliases || [])].map(slugify).filter(Boolean);
  if (!keys.length) throw new AppError(400, 'Location name is required');
  const peers = await Location.find({ type: payload.type, parent: payload.parent || null, ...(id ? { _id: { $ne: id } } : {}) }).lean();
  if (peers.some(peer => [peer.name, ...(peer.aliases || [])].map(slugify).some(key => keys.includes(key)))) throw new AppError(409, 'A canonical location already uses this name or alias');
  let parent = payload.parent; const visited = new Set(id ? [String(id)] : []);
  while (parent) {
    if (visited.has(String(parent))) throw new AppError(400, 'Location parent cycle is not allowed');
    visited.add(String(parent));
    const record = await Location.findById(parent);
    if (!record) throw new AppError(400, 'Location parent does not exist');
    parent = record.parent;
  }
};

const listAttributes = catchAsync(async (req, res) => {
  const items = await AttributeDefinition.find().sort({ group: 1, sortOrder: 1, label: 1 }).lean();
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Attributes retrieved", data: items });
});

const listEnquiries = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const items = await Enquiry.find(filter).populate("organisation", "name primaryEmail").populate("product", "name slug").sort({ createdAt: -1 }).limit(250).lean();
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Enquiries retrieved", data: items });
});

const approveEnquiry = catchAsync(async (req, res) => {
  const enquiry = await Enquiry.findById(req.params.id).populate("product").populate("organisation");
  if (!enquiry) throw new AppError(httpStatus.NOT_FOUND, "Enquiry not found");
  if (!["new", "admin_approved"].includes(enquiry.status)) throw new AppError(httpStatus.BAD_REQUEST, `Enquiry cannot be approved from ${enquiry.status}`);
  const lock = await Enquiry.findOneAndUpdate({ _id: enquiry._id, status: { $in: ['new','admin_approved'] }, notificationInFlight: { $ne: true } }, { $set: { notificationInFlight: true } });
  if (!lock) throw new AppError(409, 'Approval is already in progress or completed');
  enquiry.status = "admin_approved";
  enquiry.statusHistory.push({ status: "admin_approved", actorUser: req.v2User._id, note: req.body.note });
  await enquiry.save();
  try { await sendEnquiryToOperator({ enquiry, product: enquiry.product, organisation: enquiry.organisation }); }
  catch (error) {
    await Enquiry.updateOne({ _id: enquiry._id }, { $set: { notificationInFlight: false } });
    await logAudit({ req, organisation: enquiry.organisation._id, action: 'enquiry.delivery_failed', entityType: 'enquiry', entityId: enquiry._id, after: { status: 'admin_approved' }, source: 'admin' });
    throw new AppError(502, 'Enquiry saved and approved; operator email failed. Retry approval.');
  }
  enquiry.notificationInFlight = false;
  enquiry.markModified('notificationInFlight');
  enquiry.status = "sent_to_operator";
  enquiry.statusHistory.push({ status: "sent_to_operator", actorUser: req.v2User._id });
  await enquiry.save();
  await logAudit({ req, organisation: enquiry.organisation._id, action: "enquiry.approved", entityType: "enquiry", entityId: enquiry._id, after: { status: enquiry.status }, source: "admin" });
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Enquiry approved and sent to operator", data: enquiry });
});

const updateEnquiryStatus = catchAsync(async (req, res) => {
  const allowed = ["confirmed", "rejected", "closed", "spam", "quoted"];
  if (!allowed.includes(req.body.status)) throw new AppError(httpStatus.BAD_REQUEST, "Unsupported admin enquiry status");
  const enquiry = await Enquiry.findById(req.params.id);
  if (!enquiry) throw new AppError(httpStatus.NOT_FOUND, "Enquiry not found");
  const transitions = {
    new: ['rejected','spam','closed'], admin_approved: ['rejected','closed'],
    sent_to_operator: ['quoted','confirmed','rejected','closed','spam'],
    operator_accepted: ['quoted','confirmed','rejected','closed'], operator_replied: ['quoted','confirmed','rejected','closed'],
    quoted: ['confirmed','rejected','closed'], confirmed: ['closed'], rejected: ['closed'], spam: ['closed'], closed: []
  };
  if (enquiry.notificationInFlight) throw new AppError(409, 'Wait for the active approval to complete');
  if (!(transitions[enquiry.status] || []).includes(req.body.status)) throw new AppError(400, `Cannot change ${enquiry.status} to ${req.body.status}`);
  enquiry.status = req.body.status;
  enquiry.statusHistory.push({ status: req.body.status, actorUser: req.v2User._id, note: req.body.note });
  await enquiry.save();
  await logAudit({ req, organisation: enquiry.organisation, action: "enquiry.status", entityType: "enquiry", entityId: enquiry._id, after: { status: enquiry.status }, source: "admin" });
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Enquiry status updated", data: enquiry });
});

module.exports = {
  dashboard,
  listVessels: listProducts(Vessel), getVessel: getProduct(Vessel), previewVessel, createVessel: createProduct(Vessel, "vessel"), updateVessel: updateProduct(Vessel, "vessel"), setVesselStatus: setProductStatus(Vessel, "vessel"),
  listResorts: listProducts(Resort), getResort: getProduct(Resort), previewResort, createResort: createProduct(Resort, "resort"), updateResort: updateProduct(Resort, "resort"), setResortStatus: setProductStatus(Resort, "resort"),
  listOrganisations, createOrganisation, updateOrganisation, inviteOrganisation,
  listLocations, createLocation, updateLocation,
  listAttributes,
  listEnquiries, approveEnquiry, updateEnquiryStatus,
};
