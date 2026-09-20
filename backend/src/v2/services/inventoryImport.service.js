const httpStatus = require("http-status");
const AppError = require("../../error/appError");
const Vessel = require("../models/vessel.model");
const CabinType = require("../models/cabinType.model");
const Itinerary = require("../models/itinerary.model");
const Departure = require("../models/departure.model");
const Resort = require("../models/resort.model");
const RoomType = require("../models/roomType.model");
const ResortPackage = require("../models/resortPackage.model");
const ResortAvailability = require("../models/resortAvailability.model");
const { materializeDeparturePricing, repriceDeparturesForItinerary } = require("./pricing.service");
const slugify = require("../utilities/slugify");

const findVessel = async (organisationId, name) => {
  const vessel = await Vessel.findOne({ organisation: organisationId, name: new RegExp(`^${String(name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") });
  if (!vessel) throw new AppError(httpStatus.BAD_REQUEST, `Unknown vessel: ${name}`);
  return vessel;
};

const findOrCreateCabin = async (organisationId, vesselId, name, row = {}) => {
  let cabin = await CabinType.findOne({ vessel: vesselId, name: new RegExp(`^${String(name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") });
  if (!cabin) {
    cabin = await CabinType.create({
      organisation: organisationId,
      vessel: vesselId,
      name,
      totalCabins: row.totalCabins ? Number(row.totalCabins) : undefined,
      maxOccupancy: row.maxOccupancy ? Number(row.maxOccupancy) : undefined,
      ensuite: ["yes", "true", "1", true].includes(typeof row.ensuite === "string" ? row.ensuite.toLowerCase() : row.ensuite),
      accessible: ["yes", "true", "1", true].includes(typeof row.accessible === "string" ? row.accessible.toLowerCase() : row.accessible),
    });
  }
  return cabin;
};

const importItineraryRows = async ({ organisationId, rows }) => {
  const groups = new Map();
  for (const row of rows) {
    const key = `${row.vesselName}|${row.itineraryName}`.toLowerCase();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  const results = [];
  for (const groupRows of groups.values()) {
    const first = groupRows[0];
    const vessel = await findVessel(organisationId, first.vesselName);
    const basePrices = [];
    for (const row of groupRows) {
      if (!row.cabinName || row.basePrice === undefined || row.basePrice === "") continue;
      const cabin = await findOrCreateCabin(organisationId, vessel._id, row.cabinName, row);
      basePrices.push({ cabinType: cabin._id, amount: Number(row.basePrice), amountUsd: row.basePriceUsd !== undefined && row.basePriceUsd !== "" ? Number(row.basePriceUsd) : (row.currency || "USD") === "USD" ? Number(row.basePrice) : undefined, currency: row.currency || "USD", pricingBasis: row.pricingBasis || "per_person" });
    }
    let itinerary = await Itinerary.findOne({ vessel: vessel._id, name: new RegExp(`^${String(first.itineraryName).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") });
    const payload = {
      organisation: organisationId,
      vessel: vessel._id,
      name: first.itineraryName,
      slug: slugify(first.itineraryName),
      destinationSlugs: String(first.destinations || "").split(/[|;,]/).map((v) => slugify(v)).filter(Boolean),
      country: first.country,
      region: first.region,
      embarkation: { name: first.embarkation, slug: slugify(first.embarkation || "") },
      disembarkation: { name: first.disembarkation, slug: slugify(first.disembarkation || "") },
      description: first.description,
      routeSummary: first.routeSummary,
      numberOfDays: first.numberOfDays ? Number(first.numberOfDays) : undefined,
      numberOfNights: first.numberOfNights ? Number(first.numberOfNights) : undefined,
      numberOfDives: first.numberOfDives ? Number(first.numberOfDives) : undefined,
      minimumCertification: first.minimumCertification,
      minimumLoggedDives: first.minimumLoggedDives ? Number(first.minimumLoggedDives) : undefined,
      basePrices,
      source: "operator",
      lastCheckedAt: new Date(),
    };
    if (itinerary) {
      Object.assign(itinerary, payload);
      await itinerary.save();
    } else itinerary = await Itinerary.create(payload);
    if (payload.destinationSlugs.length) await Vessel.findByIdAndUpdate(vessel._id, { $addToSet: { destinationSlugs: { $each: payload.destinationSlugs } } });
    await repriceDeparturesForItinerary(itinerary._id);
    results.push(itinerary);
  }
  return results;
};

const importDepartureRows = async ({ organisationId, rows }) => {
  const groups = new Map();
  for (const row of rows) {
    const code = row.departureCode || `${row.vesselName}|${row.itineraryName}|${row.startDate}`;
    if (!groups.has(code)) groups.set(code, []);
    groups.get(code).push(row);
  }
  const results = [];
  for (const [code, groupRows] of groups.entries()) {
    const first = groupRows[0];
    const vessel = await findVessel(organisationId, first.vesselName);
    const itinerary = await Itinerary.findOne({ vessel: vessel._id, name: new RegExp(`^${String(first.itineraryName).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") });
    if (!itinerary) throw new AppError(httpStatus.BAD_REQUEST, `Unknown itinerary: ${first.itineraryName}`);
    const availability = [];
    const priceOverrides = [];
    const offers = [];
    for (const row of groupRows) {
      if (!row.cabinName) continue;
      const cabin = await findOrCreateCabin(organisationId, vessel._id, row.cabinName, row);
      if (row.spacesAvailable !== undefined && row.spacesAvailable !== "") {
        const spaces = Number(row.spacesAvailable);
        availability.push({
          cabinType: cabin._id,
          totalSpaces: row.totalSpaces ? Number(row.totalSpaces) : undefined,
          spacesAvailable: spaces,
          totalCabins: row.totalCabins ? Number(row.totalCabins) : undefined,
          cabinsAvailable: row.cabinsAvailable ? Number(row.cabinsAvailable) : undefined,
          status: spaces === 0 ? "sold_out" : spaces <= 2 ? "limited" : "available",
          updatedAt: new Date(),
        });
      }
      if (row.priceOverride !== undefined && row.priceOverride !== "") {
        priceOverrides.push({ cabinType: cabin._id, amount: Number(row.priceOverride), amountUsd: row.priceOverrideUsd !== undefined && row.priceOverrideUsd !== "" ? Number(row.priceOverrideUsd) : (row.currency || "USD") === "USD" ? Number(row.priceOverride) : undefined, currency: row.currency || "USD", reason: row.priceOverrideReason });
      }
      if (row.offerPercent !== undefined && row.offerPercent !== "") {
        offers.push({
          name: row.offerName || "Special offer",
          type: "percent",
          percent: Number(row.offerPercent),
          cabinType: cabin._id,
          validFrom: row.offerValidFrom ? new Date(row.offerValidFrom) : undefined,
          validUntil: row.offerValidUntil ? new Date(row.offerValidUntil) : undefined,
          description: row.offerDescription,
          active: true,
        });
      }
    }
    let departure = await Departure.findOne({ itinerary: itinerary._id, externalCode: code });
    if (!departure) departure = new Departure({ organisation: organisationId, vessel: vessel._id, itinerary: itinerary._id, externalCode: code });
    departure.startDate = new Date(first.startDate);
    departure.endDate = new Date(first.endDate);
    departure.status = first.status || "scheduled";
    departure.availability = availability;
    departure.priceOverrides = priceOverrides;
    departure.offers = offers;
    departure.availabilityUpdatedAt = availability.length ? new Date() : departure.availabilityUpdatedAt;
    departure.sourceUpdatedAt = new Date();
    departure.source = "operator";
    await materializeDeparturePricing(departure);
    await departure.save();
    results.push(departure);
  }
  return results;
};

const importResortAvailabilityRows = async ({ organisationId, rows }) => {
  const results = [];
  for (const row of rows) {
    const resort = await Resort.findOne({ organisation: organisationId, name: new RegExp(`^${String(row.resortName).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") });
    if (!resort) throw new AppError(httpStatus.BAD_REQUEST, `Unknown resort: ${row.resortName}`);
    let roomType = await RoomType.findOne({ resort: resort._id, name: new RegExp(`^${String(row.roomType).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") });
    if (!roomType) roomType = await RoomType.create({ organisation: organisationId, resort: resort._id, name: row.roomType });
    const item = await ResortAvailability.findOneAndUpdate(
      { roomType: roomType._id, date: new Date(row.date) },
      {
        organisation: organisationId,
        resort: resort._id,
        roomType: roomType._id,
        date: new Date(row.date),
        roomsAvailable: row.roomsAvailable !== "" ? Number(row.roomsAvailable) : undefined,
        status: row.status || (Number(row.roomsAvailable) === 0 ? "sold_out" : "available"),
        source: "operator",
        sourceUpdatedAt: new Date(),
      },
      { new: true, upsert: true, runValidators: true }
    );
    results.push(item);
  }
  return results;
};

const importResortPackageRows = async ({ organisationId, rows }) => {
  const results = [];
  for (const row of rows) {
    const resort = await Resort.findOne({ organisation: organisationId, name: new RegExp(`^${String(row.resortName).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") });
    if (!resort) throw new AppError(httpStatus.BAD_REQUEST, `Unknown resort: ${row.resortName}`);
    let roomType = null;
    if (row.roomType) {
      roomType = await RoomType.findOne({ resort: resort._id, name: new RegExp(`^${String(row.roomType).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") });
      if (!roomType) roomType = await RoomType.create({ organisation: organisationId, resort: resort._id, name: row.roomType });
    }
    let item = await ResortPackage.findOne({ resort: resort._id, name: row.packageName });
    const payload = {
      organisation: organisationId,
      resort: resort._id,
      roomType: roomType?._id,
      name: row.packageName,
      description: row.description,
      numberOfDays: row.numberOfDays ? Number(row.numberOfDays) : undefined,
      numberOfNights: row.numberOfNights ? Number(row.numberOfNights) : undefined,
      numberOfDives: row.numberOfDives ? Number(row.numberOfDives) : undefined,
      mealPlan: row.mealPlan || "custom",
      basePrice: { amount: Number(row.basePrice), amountUsd: row.basePriceUsd !== undefined && row.basePriceUsd !== "" ? Number(row.basePriceUsd) : (row.currency || "USD") === "USD" ? Number(row.basePrice) : undefined, currency: row.currency || "USD", pricingBasis: row.pricingBasis || "per_person" },
      active: String(row.active || "true").toLowerCase() !== "false",
    };
    if (item) { Object.assign(item, payload); await item.save(); } else item = await ResortPackage.create(payload);
    results.push(item);
  }
  return results;
};

const importInventoryRows = async ({ organisationId, importType, rows }) => {
  if (!Array.isArray(rows)) throw new AppError(httpStatus.BAD_REQUEST, "rows must be an array");
  switch (importType) {
    case "itineraries": return importItineraryRows({ organisationId, rows });
    case "departures": return importDepartureRows({ organisationId, rows });
    case "resort_packages": return importResortPackageRows({ organisationId, rows });
    case "resort_availability": return importResortAvailabilityRows({ organisationId, rows });
    default: throw new AppError(httpStatus.BAD_REQUEST, "Unsupported import type");
  }
};

module.exports = { importInventoryRows };
