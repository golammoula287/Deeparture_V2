const httpStatus = require("http-status");
const AppError = require("../../error/appError");
const AttributeDefinition = require("../models/attributeDefinition.model");
const ProductAttribute = require("../models/productAttribute.model");
const Vessel = require("../models/vessel.model");
const Resort = require("../models/resort.model");

const productConfig = {
  vessel: { Model: Vessel, modelName: "VesselV2" },
  resort: { Model: Resort, modelName: "ResortV2" },
};

const normalizeKey = (value) => String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

const validateValue = (definition, value) => {
  if (definition.dataType === "boolean") return Boolean(value === true || ["true", "yes", "1", 1].includes(typeof value === "string" ? value.toLowerCase() : value));
  if (definition.dataType === "number") {
    const number = Number(value);
    if (!Number.isFinite(number)) throw new AppError(httpStatus.BAD_REQUEST, `${definition.label} must be a number`);
    return number;
  }
  if (definition.dataType === "multi_select") {
    const values = Array.isArray(value) ? value : String(value || "").split(/[|;,]/);
    const normalized = values.map((v) => String(v).trim()).filter(Boolean);
    if (definition.options?.length) {
      const invalid = normalized.filter((v) => !definition.options.includes(v));
      if (invalid.length) throw new AppError(httpStatus.BAD_REQUEST, `Invalid ${definition.label} values: ${invalid.join(", ")}`);
    }
    return normalized;
  }
  if (definition.dataType === "select" && definition.options?.length && !definition.options.includes(value)) {
    throw new AppError(httpStatus.BAD_REQUEST, `Invalid ${definition.label} value`);
  }
  return String(value ?? "").trim();
};

const facetFieldByGroup = {
  facility: "facilities",
  dietary: "dietary",
  accessibility: "accessibility",
  diving: "divingFeatures",
};

const refreshFacets = async (productType, productId) => {
  const cfg = productConfig[productType];
  if (!cfg) throw new AppError(httpStatus.BAD_REQUEST, "Invalid product type");
  const attributes = await ProductAttribute.find({ product: productId, productModel: cfg.modelName }).populate("definition").lean();
  const update = { facilities: [], dietary: [], accessibility: [], divingFeatures: [] };
  for (const attribute of attributes) {
    const definition = attribute.definition;
    if (!definition?.active) continue;
    const field = facetFieldByGroup[definition.group];
    if (!field) continue;
    if (definition.dataType === "boolean") {
      if (attribute.value === true) update[field].push(definition.key);
    } else if (definition.dataType === "multi_select" && Array.isArray(attribute.value)) {
      update[field].push(...attribute.value.map((value) => normalizeKey(`${definition.key}_${value}`)));
    } else if (attribute.value !== undefined && attribute.value !== null && attribute.value !== "") {
      update[field].push(definition.key);
    }
  }
  for (const field of Object.keys(update)) update[field] = [...new Set(update[field])];
  await cfg.Model.findByIdAndUpdate(productId, { $set: update });
  return update;
};

const setProductAttributes = async ({ organisationId, productType, productId, attributes, source = "operator" }) => {
  const cfg = productConfig[productType];
  if (!cfg) throw new AppError(httpStatus.BAD_REQUEST, "Invalid product type");
  const product = await cfg.Model.findOne({ _id: productId, organisation: organisationId });
  if (!product) throw new AppError(httpStatus.NOT_FOUND, "Product not found for this organisation");
  const results = [];
  for (const item of attributes || []) {
    const key = normalizeKey(item.key);
    const definition = await AttributeDefinition.findOne({ key, active: true });
    if (!definition) throw new AppError(httpStatus.BAD_REQUEST, `Unknown attribute: ${key}`);
    const applies = definition.applicableTo || [];
    if (!(applies.includes("both") || applies.includes(productType))) {
      throw new AppError(httpStatus.BAD_REQUEST, `${definition.label} does not apply to ${productType}s`);
    }
    const value = validateValue(definition, item.value);
    const record = await ProductAttribute.findOneAndUpdate(
      { product: product._id, productModel: cfg.modelName, definition: definition._id },
      {
        product: product._id,
        productModel: cfg.modelName,
        definition: definition._id,
        value,
        source,
        sourceUrl: item.sourceUrl,
        lastCheckedAt: new Date(),
        verificationStatus: item.verificationStatus || "unverified",
      },
      { new: true, upsert: true, runValidators: true }
    );
    results.push(record);
  }
  const facets = await refreshFacets(productType, product._id);
  return { attributes: results, facets };
};

module.exports = { setProductAttributes, refreshFacets, normalizeKey, validateValue };
