const Vessel = require("../models/vessel.model");
const Resort = require("../models/resort.model");
const Itinerary = require("../models/itinerary.model");
const Departure = require("../models/departure.model");
const ResortPackage = require("../models/resortPackage.model");
const slugify = require("../utilities/slugify");
const normalizeFacet = (value) => String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

const listVessels = async (query) => {
  const filter = { listingStatus: "published" };
  if (query.veganRatingMin) filter.veganRating = { $gte: Number(query.veganRatingMin) };
  if (query.facility) filter.facilities = normalizeFacet(query.facility);
  if (query.accessibility) filter.accessibility = normalizeFacet(query.accessibility);
  if (query.dietary) filter.dietary = normalizeFacet(query.dietary);
  if (query.destination) filter.destinationSlugs = slugify(query.destination);
  if (query.q) filter.$text = { $search: query.q };

  let vesselIds = null;
  const itineraryFilter = {};
  if (query.embarkation) itineraryFilter["embarkation.slug"] = slugify(query.embarkation);
  if (query.minNights || query.maxNights) {
    itineraryFilter.numberOfNights = {};
    if (query.minNights) itineraryFilter.numberOfNights.$gte = Number(query.minNights);
    if (query.maxNights) itineraryFilter.numberOfNights.$lte = Number(query.maxNights);
  }
  if (Object.keys(itineraryFilter).length) {
    vesselIds = (await Itinerary.distinct("vessel", itineraryFilter)).map(String);
  }

  if (query.startDate || query.endDate || query.maxPrice || query.availableOnly === "true") {
    const departureFilter = { status: { $nin: ["cancelled"] } };
    if (query.startDate) departureFilter.startDate = { ...(departureFilter.startDate || {}), $gte: new Date(query.startDate) };
    if (query.endDate) departureFilter.startDate = { ...(departureFilter.startDate || {}), $lte: new Date(query.endDate) };
    if (query.maxPrice) departureFilter.effectiveMinPriceUsd = { $lte: Number(query.maxPrice) };
    if (query.availableOnly === "true") departureFilter["availability.status"] = { $in: ["available", "limited", "on_request"] };
    const departureVessels = (await Departure.distinct("vessel", departureFilter)).map(String);
    vesselIds = vesselIds ? vesselIds.filter((id) => departureVessels.includes(id)) : departureVessels;
  }

  if (vesselIds) filter._id = { $in: vesselIds };
  const page = Math.max(1, Number(query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(query.limit || 24)));
  const [items, total] = await Promise.all([
    Vessel.find(filter).sort({ name: 1 }).skip((page - 1) * limit).limit(limit).lean(),
    Vessel.countDocuments(filter),
  ]);
  return { items, total, page, limit };
};

const getVesselBySlug = async (slug) => {
  const vessel = await Vessel.findOne({ slug, listingStatus: "published" }).populate("organisation", "name slug status website").lean();
  if (!vessel) return null;
  const itineraries = await Itinerary.find({ vessel: vessel._id, status: "active" }).populate("basePrices.cabinType").lean();
  const departures = await Departure.find({ vessel: vessel._id, status: { $ne: "cancelled" }, startDate: { $gte: new Date() } })
    .sort({ startDate: 1 })
    .populate("itinerary", "name slug numberOfNights embarkation disembarkation destinationSlugs")
    .populate("effectivePrices.cabinType", "name")
    .lean();
  return { ...vessel, itineraries, departures };
};

const listResorts = async (query) => {
  const filter = { listingStatus: "published" };
  if (query.veganRatingMin) filter.veganRating = { $gte: Number(query.veganRatingMin) };
  if (query.facility) filter.facilities = normalizeFacet(query.facility);
  if (query.accessibility) filter.accessibility = normalizeFacet(query.accessibility);
  if (query.dietary) filter.dietary = normalizeFacet(query.dietary);
  if (query.destination) filter.destinationSlugs = slugify(query.destination);
  if (query.q) filter.$text = { $search: query.q };
  if (query.maxPrice) {
    const resortIds = await ResortPackage.distinct("resort", { "basePrice.amountUsd": { $lte: Number(query.maxPrice) }, active: true });
    filter._id = { $in: resortIds };
  }
  const page = Math.max(1, Number(query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(query.limit || 24)));
  const [items, total] = await Promise.all([
    Resort.find(filter).sort({ name: 1 }).skip((page - 1) * limit).limit(limit).lean(),
    Resort.countDocuments(filter),
  ]);
  return { items, total, page, limit };
};

module.exports = { listVessels, getVesselBySlug, listResorts };
