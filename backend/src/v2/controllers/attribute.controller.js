const httpStatus = require("http-status");
const catchAsync = require("../../utilities/catchAsync");
const sendResponse = require("../../utilities/sendResponse");
const AttributeDefinition = require("../models/attributeDefinition.model");
const ProductAttribute = require("../models/productAttribute.model");
const { setProductAttributes, normalizeKey } = require("../services/attribute.service");

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
  sendResponse(res, { statusCode: httpStatus.CREATED, success: true, message: "Attribute created", data });
});

const updateDefinition = catchAsync(async (req, res) => {
  const data = await AttributeDefinition.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
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
