const httpStatus = require("http-status");
const catchAsync = require("../../utilities/catchAsync");
const sendResponse = require("../../utilities/sendResponse");
const AppError = require("../../error/appError");
const { isObjectIdOrHexString } = require("mongoose");
const Departure = require("../models/departure.model");
const Vessel = require("../models/vessel.model");
const Resort = require("../models/resort.model");
const RoomType = require("../models/roomType.model");
const ResortPackage = require("../models/resortPackage.model");
const ResortRatePeriod = require("../models/resortRatePeriod.model");
const { listVessels, getVesselBySlug, listResorts, listEmbarkationPorts } = require("../services/search.service");
const { vesselPromotions, resortPromotions } = require("../services/catalogueOffers.service");

async function publishedListing(Model, id, organisation) {
  return Model.findOne({ _id: id, organisation, listingStatus: "published" }).select("slug").lean();
}

function sendSelection(res, data) {
  if (!data) throw new AppError(httpStatus.NOT_FOUND, "This trip option is no longer available.");
  return sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Trip option retrieved", data });
}

const departureLink = catchAsync(async (req, res) => {
  if (!isObjectIdOrHexString(req.params.id)) return sendSelection(res);
  const item = await Departure.findOne({
    _id: req.params.id, startDate: { $gte: new Date() }, status: { $ne: "cancelled" },
  }).select("vessel organisation").lean();
  const listing = item && await publishedListing(Vessel, item.vessel, item.organisation);
  return sendSelection(res, listing && { slug: listing.slug, type: "vessel", departureId: item._id });
});

const packageLink = catchAsync(async (req, res) => {
  if (!isObjectIdOrHexString(req.params.id)) return sendSelection(res);
  const item = await ResortPackage.findOne({ _id: req.params.id, active: true }).select("resort organisation").lean();
  const listing = item && await publishedListing(Resort, item.resort, item.organisation);
  return sendSelection(res, listing && { slug: listing.slug, type: "resort", packageId: item._id });
});

const offerLink = catchAsync(async (req, res) => {
  const id = req.params.id;
  if (!isObjectIdOrHexString(id)) return sendSelection(res);
  const now = new Date();
  const [departure, rate] = await Promise.all([
    Departure.findOne({ "offers._id": id }).select("vessel organisation").lean(),
    ResortRatePeriod.findById(id).select("resort organisation").lean(),
  ]);
  if (departure) {
    const listing = await publishedListing(Vessel, departure.vessel, departure.organisation);
    if (listing) {
      const offers = await vesselPromotions(now, { _id: departure._id }, [departure.vessel]);
      const match = offers.find(({ promotion }) => String(promotion.offerId) === id.toLowerCase());
      if (match) return sendSelection(res, { slug: listing.slug, type: "vessel", departureId: departure._id, promotion: match.promotion });
    }
  }
  if (rate) {
    const listing = await publishedListing(Resort, rate.resort, rate.organisation);
    if (listing) {
      const [match] = await resortPromotions(now, { rateId: rate._id, resortIds: [rate.resort], packageFilter: { organisation: rate.organisation } });
      if (match) return sendSelection(res, { slug: listing.slug, type: "resort", packageId: match.promotion.packageId, promotion: match.promotion });
    }
  }
  return sendSelection(res);
});

const vessels = catchAsync(async (req, res) => {
  const data = await listVessels(req.query);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Vessels retrieved", data });
});

const vessel = catchAsync(async (req, res) => {
  const data = await getVesselBySlug(req.params.slug);
  if (!data) throw new AppError(httpStatus.NOT_FOUND, "Vessel not found");
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Vessel retrieved", data });
});

const resorts = catchAsync(async (req, res) => {
  const data = await listResorts(req.query);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Resorts retrieved", data });
});

const resort = catchAsync(async (req, res) => {
  const item = await Resort.findOne({ slug: req.params.slug, listingStatus: "published" }).populate("organisation", "name slug status website").lean();
  if (!item) throw new AppError(httpStatus.NOT_FOUND, "Resort not found");
  const roomTypes = await RoomType.find({ resort: item._id, active: true }).lean();
  const packages = await ResortPackage.find({ resort: item._id, active: true }).populate("roomType").lean();
  const packageIds = packages.map((p) => p._id);
  const ratePeriods = await ResortRatePeriod.find({ package: { $in: packageIds }, active: true }).lean();
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Resort retrieved", data: { ...item, roomTypes, packages, ratePeriods } });
});

const embarkationPorts = catchAsync(async (req, res) => {
  const data = await listEmbarkationPorts();
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Embarkation ports retrieved", data });
});

module.exports = { embarkationPorts, vessels, vessel, resorts, resort, departureLink, packageLink, offerLink };
