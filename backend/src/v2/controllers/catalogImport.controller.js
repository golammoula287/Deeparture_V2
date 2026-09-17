const httpStatus = require("http-status");
const catchAsync = require("../../utilities/catchAsync");
const sendResponse = require("../../utilities/sendResponse");
const AppError = require("../../error/appError");
const { importCatalogRows } = require("../services/catalogImport.service");
const { parseSpreadsheet } = require("../services/bulkFile.service");

const importJson = catchAsync(async (req, res) => {
  const { productType = "vessel", rows } = req.body;
  if (!Array.isArray(rows)) throw new AppError(httpStatus.BAD_REQUEST, "rows must be an array");
  const data = await importCatalogRows({ productType, rows });
  sendResponse(res, { statusCode: httpStatus.OK, success: data.failed === 0, message: "Catalog import processed", data });
});

const importFile = catchAsync(async (req, res) => {
  if (!req.file) throw new AppError(httpStatus.BAD_REQUEST, "CSV/XLSX file is required");
  const rows = await parseSpreadsheet(req.file);
  const productType = req.body.productType === "resort" ? "resort" : "vessel";
  const data = await importCatalogRows({ productType, rows });
  sendResponse(res, { statusCode: httpStatus.OK, success: data.failed === 0, message: "Catalog file import processed", data });
});

const templateFields = catchAsync(async (req, res) => {
  const productType = req.query.productType === "resort" ? "resort" : "vessel";
  const common = ["operatorName", "operatorEmail", "operatorWebsite", "sourceUrl", "summary", "description", "featuredImage", "gallery", "destinations", "facilities", "dietary", "accessibility", "divingFeatures", "veganRating", "environmentalRating", "publish"];
  const fields = productType === "resort"
    ? [...common, "resortName", "country", "region", "district"]
    : [...common, "vesselName", "vesselType", "yearBuilt", "yearRefit", "lengthMeters", "beamMeters", "maxGuests", "cabinCount"];
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Import template fields", data: { productType, fields } });
});

module.exports = { importJson, importFile, templateFields };
