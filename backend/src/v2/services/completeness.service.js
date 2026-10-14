const Vessel = require('../models/vessel.model');
const Resort = require('../models/resort.model');
const ProductAttribute = require('../models/productAttribute.model');
const Departure = require('../models/departure.model');
const ResortPackage = require('../models/resortPackage.model');

const DEFAULT_RULES = {
  vessel: [
    ['name', 10, 'name'], ['featuredImage', 10, 'hero image'], ['gallery', 8, 'gallery'], ['summary', 8, 'summary'],
    ['description', 8, 'description'], ['destinationLocations', 12, 'destinations'], ['facilities', 8, 'facilities'],
    ['dietary', 8, 'dietary details'], ['accessibility', 8, 'accessibility details'], ['divingFeatures', 8, 'diving details'],
    ['departures', 12, 'current departures'],
  ],
  resort: [
    ['name', 10, 'name'], ['featuredImage', 10, 'hero image'], ['gallery', 8, 'gallery'], ['summary', 8, 'summary'],
    ['description', 8, 'description'], ['destinationLocations', 12, 'destinations'], ['facilities', 8, 'facilities'],
    ['dietary', 8, 'dietary details'], ['accessibility', 8, 'accessibility details'], ['divingFeatures', 8, 'diving details'],
    ['packages', 12, 'packages/pricing'],
  ],
};

const hasValue = (value) => Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null && String(value).trim() !== '';

const calculateCompleteness = async ({ productType, product }) => {
  const rules = DEFAULT_RULES[productType];
  const dynamic = { ...product };
  if (productType === 'vessel') dynamic.departures = await Departure.exists({ vessel: product._id, status: { $ne: 'cancelled' } });
  else dynamic.packages = await ResortPackage.exists({ resort: product._id, active: true });
  const attrs = await ProductAttribute.countDocuments({ product: product._id });
  if (attrs > 0) {
    dynamic.facilities = hasValue(dynamic.facilities) ? dynamic.facilities : ['structured_attribute'];
  }
  let score = 0;
  const missing = [];
  for (const [key, weight, label] of rules) {
    if (hasValue(dynamic[key])) score += weight;
    else missing.push(label);
  }
  return { score: Math.min(100, score), missing, categories: rules.map(([key, weight, label]) => ({ key, label, weight, complete: hasValue(dynamic[key]) })) };
};

const refreshProductCompleteness = async ({ productType, productId }) => {
  const Model = productType === 'resort' ? Resort : Vessel;
  const product = await Model.findById(productId).lean();
  if (!product) return null;
  const result = await calculateCompleteness({ productType, product });
  await Model.updateOne({ _id: productId }, { $set: { completenessScore: result.score, completenessMissing: result.missing, completenessUpdatedAt: new Date() } });
  return result;
};

module.exports = { DEFAULT_RULES, calculateCompleteness, refreshProductCompleteness };
