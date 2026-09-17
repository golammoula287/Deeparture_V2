const httpStatus = require("http-status");
const catchAsync = require("../../utilities/catchAsync");
const sendResponse = require("../../utilities/sendResponse");
const AppError = require("../../error/appError");
const Resort = require("../models/resort.model");
const RoomType = require("../models/roomType.model");
const ResortPackage = require("../models/resortPackage.model");
const ResortRatePeriod = require("../models/resortRatePeriod.model");
const { listVessels, getVesselBySlug, listResorts } = require("../services/search.service");

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

module.exports = { vessels, vessel, resorts, resort };
