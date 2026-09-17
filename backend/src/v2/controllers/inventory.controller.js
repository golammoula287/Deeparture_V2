const httpStatus = require("http-status");
const catchAsync = require("../../utilities/catchAsync");
const sendResponse = require("../../utilities/sendResponse");
const AppError = require("../../error/appError");
const Vessel = require("../models/vessel.model");
const Itinerary = require("../models/itinerary.model");
const Departure = require("../models/departure.model");
const Resort = require("../models/resort.model");
const RoomType = require("../models/roomType.model");
const ResortPackage = require("../models/resortPackage.model");
const ResortRatePeriod = require("../models/resortRatePeriod.model");
const ResortAvailability = require("../models/resortAvailability.model");
const { materializeDeparturePricing, repriceDeparturesForItinerary } = require("../services/pricing.service");
const { logAudit } = require("../services/audit.service");
const slugify = require("../utilities/slugify");

const assertOwned = async (Model, id, organisationId) => {
  const item = await Model.findOne({ _id: id, organisation: organisationId });
  if (!item) throw new AppError(httpStatus.NOT_FOUND, "Record not found for this organisation");
  return item;
};

const createVessel = catchAsync(async (req, res) => {
  const payload = { ...req.body, organisation: req.params.organisationId };
  if (!payload.slug && payload.name) payload.slug = slugify(payload.name);
  const item = await Vessel.create(payload);
  await logAudit({ req, organisation: item.organisation, action: "vessel.create", entityType: "vessel", entityId: item._id, after: item.toObject() });
  sendResponse(res, { statusCode: httpStatus.CREATED, success: true, message: "Vessel created", data: item });
});

const updateVessel = catchAsync(async (req, res) => {
  const item = await assertOwned(Vessel, req.params.id, req.params.organisationId);
  const before = item.toObject();
  Object.assign(item, req.body);
  await item.save();
  await logAudit({ req, organisation: item.organisation, action: "vessel.update", entityType: "vessel", entityId: item._id, before, after: item.toObject() });
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Vessel updated", data: item });
});

const createItinerary = catchAsync(async (req, res) => {
  await assertOwned(Vessel, req.body.vessel, req.params.organisationId);
  const payload = { ...req.body, organisation: req.params.organisationId };
  if (!payload.slug && payload.name) payload.slug = slugify(payload.name);
  const item = await Itinerary.create(payload);
  if (item.destinationSlugs?.length) await Vessel.findByIdAndUpdate(item.vessel, { $addToSet: { destinationSlugs: { $each: item.destinationSlugs } } });
  sendResponse(res, { statusCode: httpStatus.CREATED, success: true, message: "Itinerary created", data: item });
});

const updateItinerary = catchAsync(async (req, res) => {
  const item = await assertOwned(Itinerary, req.params.id, req.params.organisationId);
  Object.assign(item, req.body);
  await item.save();
  if (item.destinationSlugs?.length) await Vessel.findByIdAndUpdate(item.vessel, { $addToSet: { destinationSlugs: { $each: item.destinationSlugs } } });
  const repriced = await repriceDeparturesForItinerary(item._id);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Itinerary updated", data: { item, repricedDepartures: repriced } });
});

const createDeparture = catchAsync(async (req, res) => {
  const itinerary = await assertOwned(Itinerary, req.body.itinerary, req.params.organisationId);
  const payload = { ...req.body, organisation: req.params.organisationId, vessel: itinerary.vessel };
  const item = new Departure(payload);
  await materializeDeparturePricing(item);
  await item.save();
  sendResponse(res, { statusCode: httpStatus.CREATED, success: true, message: "Departure created", data: item });
});

const updateDeparture = catchAsync(async (req, res) => {
  const item = await assertOwned(Departure, req.params.id, req.params.organisationId);
  Object.assign(item, req.body);
  if (req.body.availability) item.availabilityUpdatedAt = new Date();
  await materializeDeparturePricing(item);
  await item.save();
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Departure updated", data: item });
});

const createResort = catchAsync(async (req, res) => {
  const payload = { ...req.body, organisation: req.params.organisationId };
  if (!payload.slug && payload.name) payload.slug = slugify(payload.name);
  const item = await Resort.create(payload);
  sendResponse(res, { statusCode: httpStatus.CREATED, success: true, message: "Resort created", data: item });
});

const updateResort = catchAsync(async (req, res) => {
  const item = await assertOwned(Resort, req.params.id, req.params.organisationId);
  Object.assign(item, req.body);
  await item.save();
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Resort updated", data: item });
});

const createRoomType = catchAsync(async (req, res) => {
  await assertOwned(Resort, req.body.resort, req.params.organisationId);
  const item = await RoomType.create({ ...req.body, organisation: req.params.organisationId });
  sendResponse(res, { statusCode: httpStatus.CREATED, success: true, message: "Room type created", data: item });
});

const createPackage = catchAsync(async (req, res) => {
  await assertOwned(Resort, req.body.resort, req.params.organisationId);
  const item = await ResortPackage.create({ ...req.body, organisation: req.params.organisationId });
  sendResponse(res, { statusCode: httpStatus.CREATED, success: true, message: "Resort package created", data: item });
});

const createRatePeriod = catchAsync(async (req, res) => {
  await assertOwned(ResortPackage, req.body.package, req.params.organisationId);
  const item = await ResortRatePeriod.create({ ...req.body, organisation: req.params.organisationId });
  sendResponse(res, { statusCode: httpStatus.CREATED, success: true, message: "Rate period created", data: item });
});

const upsertAvailability = catchAsync(async (req, res) => {
  await assertOwned(RoomType, req.body.roomType, req.params.organisationId);
  const item = await ResortAvailability.findOneAndUpdate(
    { roomType: req.body.roomType, date: new Date(req.body.date) },
    { ...req.body, organisation: req.params.organisationId, sourceUpdatedAt: new Date() },
    { new: true, upsert: true, runValidators: true }
  );
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Availability updated", data: item });
});

module.exports = { createVessel, updateVessel, createItinerary, updateItinerary, createDeparture, updateDeparture, createResort, updateResort, createRoomType, createPackage, createRatePeriod, upsertAvailability };
