const httpStatus = require("http-status");
const catchAsync = require("../../utilities/catchAsync");
const sendResponse = require("../../utilities/sendResponse");
const AttributeDefinition = require("../models/attributeDefinition.model");
const ProductAttribute = require("../models/productAttribute.model");
const AppError = require('../../error/appError');
const { setProductAttributes, normalizeKey } = require("../services/attribute.service");
const { logAudit } = require('../services/audit.service');

const listDefinitions = catchAsync(async (req, res) => {
  const filter = { active: true };
  if (req.query.group) filter.group = req.query.group;
  if (req.query.productType) filter.applicableTo = { $in: [req.query.productType, "both"] };
  const data = await AttributeDefinition.find(filter).sort({ group: 1, sortOrder: 1, label: 1 }).lean();
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Attributes retrieved", data });
});

const createDefinition = catchAsync(async (req, res) => {
  const payload = { ...req.body, key: normalizeKey(req.body.key || req.body.label) };
  const data = await AttributeDefinition.create(payload);
  await logAudit({ req, action: 'attribute.create', entityType: 'attributeDefinition', entityId: data._id, after: data.toObject(), source: 'admin' });
  sendResponse(res, { statusCode: httpStatus.CREATED, success: true, message: "Attribute created", data });
});

const updateDefinition = catchAsync(async (req, res) => {
  const existing = await AttributeDefinition.findById(req.params.id);
  if (!existing) throw new AppError(404, 'Attribute not found');
  if (req.body.expectedUpdatedAt && new Date(req.body.expectedUpdatedAt).getTime() !== new Date(existing.updatedAt).getTime()) throw new AppError(409, 'Attribute changed since it was loaded', { code: 'conflict', details: { currentUpdatedAt: existing.updatedAt } });
  if (req.body.key !== undefined && normalizeKey(req.body.key) !== existing.key) throw new AppError(400, 'Attribute key is stable; edit its label instead');
  const before = existing.toObject();
  const payload = { ...req.body };
  delete payload.key;
  delete payload.expectedUpdatedAt;
  Object.assign(existing, payload);
  await existing.save();
  const data = existing;
  await logAudit({ req, action: 'attribute.update', entityType: 'attributeDefinition', entityId: data._id, before, after: data.toObject(), source: 'admin' });
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Attribute updated", data });
});

const setAttributes = catchAsync(async (req, res) => {
  const data = await setProductAttributes({
    organisationId: req.params.organisationId,
    productType: req.body.productType,
    productId: req.body.productId,
    attributes: req.body.attributes,
    source: "operator",
  });
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Product attributes updated", data });
});

const getProductAttributes = catchAsync(async (req, res) => {
  const data = await ProductAttribute.find({ product: req.params.productId }).populate("definition").lean();
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Product attributes retrieved", data });
});

module.exports = { listDefinitions, createDefinition, updateDefinition, setAttributes, getProductAttributes };
