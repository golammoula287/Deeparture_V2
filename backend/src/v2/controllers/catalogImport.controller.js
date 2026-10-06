const httpStatus = require("http-status");
const catchAsync = require("../../utilities/catchAsync");
const sendResponse = require("../../utilities/sendResponse");
const AppError = require("../../error/appError");
const { createPreview, commitBatch, getBatch } = require("../services/catalogImport.service");
const { parseCatalogSpreadsheet } = require("../services/bulkFile.service");
const { logAudit } = require('../services/audit.service');

const previewJson = catchAsync(async (req, res) => {
  const { productType = "vessel", rows } = req.body;
  if (!Array.isArray(rows)) throw new AppError(httpStatus.BAD_REQUEST, "rows must be an array");
  const data = await createPreview({ productType: productType === "resort" ? "resort" : "vessel", rows, sourceType: "json", createdBy: req.v2User._id });
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Catalog preview created; no database changes have been committed", data });
});

const previewFile = catchAsync(async (req, res) => {
  if (!req.file) throw new AppError(httpStatus.BAD_REQUEST, "CSV/XLSX file is required");
  const productType = req.body.productType === "resort" ? "resort" : "vessel";
  const parsed = await parseCatalogSpreadsheet(req.file, productType);
  const data = await createPreview({ productType, rows: parsed.rows, sourceType: parsed.sourceType, sourceFilename: req.file.originalname, createdBy: req.v2User._id });
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Catalog file preview created; confirm the batch before writing", data });
});

const commit = catchAsync(async (req, res) => {
  const data = await commitBatch({ batchId: req.params.batchId, committedBy: req.v2User._id, allowPartial: req.body?.allowPartial === true });
  await logAudit({ req, action: 'catalog.import.commit', entityType: 'importBatch', entityId: data.batchId, after: { summary: data.summary, status: data.status }, source: 'admin' });
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: data.errors.length ? "Catalog import completed with row errors" : "Catalog import committed", data });
});

const batch = catchAsync(async (req, res) => {
  const data = await getBatch(req.params.batchId);
  if (!data) throw new AppError(httpStatus.NOT_FOUND, "Import batch not found");
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Import batch retrieved", data });
});

const templateFields = catchAsync(async (req, res) => {
  const productType = req.query.productType === "resort" ? "resort" : "vessel";
  const common = ["operatorName", "operatorEmail", "operatorWebsite", "sourceUrl", "summary", "description", "featuredImage", "gallery", "destinations", "facilities", "dietary", "accessibility", "divingFeatures", "veganRating", "environmentalRating", "publish"];
  const fields = productType === "resort"
    ? [...common, "resortName", "country", "region", "district"]
    : [...common, "vesselName", "vesselType", "yearBuilt", "yearRefit", "lengthMeters", "beamMeters", "maxGuests", "cabinCount"];
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Import template fields", data: { schemaVersion: 1, preferredFormat: "xlsx", productType, fields } });
});

module.exports = { previewJson, previewFile, commit, batch, templateFields };
