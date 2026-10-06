const httpStatus = require("http-status");
const AppError = require("../../error/appError");
const Departure = require("../models/departure.model");
const CabinType = require("../models/cabinType.model");
const ResortAvailability = require("../models/resortAvailability.model");
const RoomType = require("../models/roomType.model");

const ALLOWED_STATUS = new Set(["unknown", "available", "limited", "sold_out", "on_request", "stop_sell"]);
const normalizeSource = (sourceType) => String(sourceType || "operator").trim().toLowerCase();

const normalizeAvailabilityInput = (input = {}, defaults = {}) => {
  const quantity = input.spacesAvailable ?? input.cabinsAvailable;
  const status = String(input.status || defaults.status || (quantity === 0 ? 'sold_out' : Number(quantity) > 0 ? 'available' : 'on_request')).toLowerCase();
  if (!ALLOWED_STATUS.has(status)) throw new AppError(httpStatus.BAD_REQUEST, `Unsupported availability status: ${status}`);
  const number = (value) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (!Number.isInteger(Number(value)) || Number(value) < 0) throw new AppError(400, 'Inventory quantities must be non-negative integers');
    return Number(value);
  };
  for (const [available,total] of [['spacesAvailable','totalSpaces'],['cabinsAvailable','totalCabins']]) {
    if (number(input[available]) !== undefined && number(input[total]) !== undefined && number(input[available]) > number(input[total])) throw new AppError(400, 'Available inventory cannot exceed total inventory');
  }
  if (input.sourceUpdatedAt && !Number.isFinite(new Date(input.sourceUpdatedAt).getTime())) throw new AppError(400, 'Invalid source timestamp');
  return {
    cabinType: input.cabinType || defaults.cabinType,
    totalCabins: number(input.totalCabins),
    cabinsAvailable: number(input.cabinsAvailable),
    totalSpaces: number(input.totalSpaces),
    spacesAvailable: number(input.spacesAvailable),
    status,
    updatedAt: new Date(),
    sourceType: normalizeSource(input.sourceType || defaults.sourceType),
    sourceReference: input.sourceReference || defaults.sourceReference,
    sourceUpdatedAt: input.sourceUpdatedAt ? new Date(input.sourceUpdatedAt) : (defaults.sourceUpdatedAt ? new Date(defaults.sourceUpdatedAt) : new Date()),
    receivedAt: new Date(),
  };
};

const validateCabin = async ({ organisationId, vesselId, cabinType }) => {
  if (!cabinType) return;
  const exists = await CabinType.exists({ _id: cabinType, organisation: organisationId, vessel: vesselId });
  if (!exists) throw new AppError(httpStatus.BAD_REQUEST, "Cabin type does not belong to this vessel/organisation");
};

const replaceDepartureAvailability = async ({ organisationId, departureId, updates = [], sourceType = "operator", sourceReference, sourceUpdatedAt }) => {
  const departure = await Departure.findOne({ _id: departureId, organisation: organisationId });
  if (!departure) throw new AppError(httpStatus.NOT_FOUND, "Departure not found for this organisation");
  const normalized = [];
  for (const update of updates) {
    const item = normalizeAvailabilityInput(update, { sourceType, sourceReference, sourceUpdatedAt });
    if (item.status === "stop_sell") throw new AppError(httpStatus.BAD_REQUEST, "stop_sell is a resort availability status, not a liveaboard departure status");
    await validateCabin({ organisationId, vesselId: departure.vessel, cabinType: item.cabinType });
    normalized.push(item);
  }
  const byCabin = new Map((departure.availability || []).map(item => [String(item.cabinType || '__overall__'), item.toObject()]));
  for (const item of normalized) {
    const key = String(item.cabinType || '__overall__');
    const patch = Object.fromEntries(Object.entries(item).filter(([,value]) => value !== undefined));
    byCabin.set(key, { ...byCabin.get(key), ...patch });
  }
  departure.availability = [...byCabin.values()];
  departure.availabilityUpdatedAt = normalized.length ? new Date(Math.max(...normalized.map((item) => item.sourceUpdatedAt?.getTime?.() || Date.now()))) : new Date();
  departure.sourceUpdatedAt = departure.availabilityUpdatedAt;
  if (sourceType) departure.source = normalizeSource(sourceType);
  await departure.save();
  return departure;
};

const upsertDepartureAvailability = async ({ organisationId, departureId, update, sourceType = "operator", sourceReference, sourceUpdatedAt }) => {
  const departure = await Departure.findOne({ _id: departureId, organisation: organisationId });
  if (!departure) throw new AppError(httpStatus.NOT_FOUND, "Departure not found for this organisation");
  const item = normalizeAvailabilityInput(update, { sourceType, sourceReference, sourceUpdatedAt });
  if (item.status === "stop_sell") throw new AppError(httpStatus.BAD_REQUEST, "stop_sell is a resort availability status, not a liveaboard departure status");
  await validateCabin({ organisationId, vesselId: departure.vessel, cabinType: item.cabinType });
  const key = item.cabinType ? String(item.cabinType) : "__overall__";
  const existingIndex = (departure.availability || []).findIndex((value) => (value.cabinType ? String(value.cabinType) : "__overall__") === key);
  if (existingIndex >= 0) Object.assign(departure.availability[existingIndex], item);
  else departure.availability.push(item);
  departure.availabilityUpdatedAt = new Date();
  departure.sourceUpdatedAt = item.sourceUpdatedAt;
  await departure.save();
  return departure;
};

const upsertResortAvailability = async ({ organisationId, roomTypeId, date, roomsAvailable, status, sourceType = "operator", sourceReference, sourceUpdatedAt }) => {
  const room = await RoomType.findOne({ _id: roomTypeId, organisation: organisationId });
  if (!room) throw new AppError(httpStatus.NOT_FOUND, "Room type not found for this organisation");
  const numeric = roomsAvailable === undefined || roomsAvailable === null || roomsAvailable === "" ? undefined : Number(roomsAvailable);
  if (numeric !== undefined && (!Number.isInteger(numeric) || numeric < 0)) throw new AppError(400, 'roomsAvailable must be a non-negative integer');
  const day = new Date(date);
  if (!date || !Number.isFinite(day.getTime())) throw new AppError(400, 'A valid availability date is required');
  day.setUTCHours(0,0,0,0);
  const resolvedStatus = String(status || (numeric === 0 ? "sold_out" : numeric > 0 ? "available" : "on_request")).toLowerCase();
  if (!ALLOWED_STATUS.has(resolvedStatus)) throw new AppError(httpStatus.BAD_REQUEST, `Unsupported availability status: ${resolvedStatus}`);
  return ResortAvailability.findOneAndUpdate(
    { roomType: room._id, date: day },
    {
      organisation: organisationId,
      resort: room.resort,
      roomType: room._id,
      date: day,
      roomsAvailable: numeric,
      status: resolvedStatus,
      source: normalizeSource(sourceType),
      sourceReference,
      sourceUpdatedAt: sourceUpdatedAt ? new Date(sourceUpdatedAt) : new Date(),
      receivedAt: new Date(),
    },
    { new: true, upsert: true, runValidators: true }
  );
};

const effectiveDepartureAvailability = (departure) => ({
  departureId: departure._id,
  availability: departure.availability || [],
  lastUpdatedAt: departure.availabilityUpdatedAt || departure.sourceUpdatedAt || departure.updatedAt,
});

module.exports = { normalizeAvailabilityInput, replaceDepartureAvailability, upsertDepartureAvailability, upsertResortAvailability, effectiveDepartureAvailability };
