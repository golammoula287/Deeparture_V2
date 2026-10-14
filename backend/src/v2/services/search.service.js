const Vessel = require('../models/vessel.model');
const Resort = require('../models/resort.model');
const Itinerary = require('../models/itinerary.model');
const Departure = require('../models/departure.model');
const ResortPackage = require('../models/resortPackage.model');
const ResortAvailability = require('../models/resortAvailability.model');
const RoomType = require('../models/roomType.model');
const Organisation = require('../models/organisation.model');
const Location = require('../models/location.model');
const AttributeDefinition = require('../models/attributeDefinition.model');
const ProductAttribute = require('../models/productAttribute.model');
const slugify = require('../utilities/slugify');
const AppError = require('../../error/appError');
const { parsePagination, pagedResult } = require('./pagination.service');

const normalizeFacet = (value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const asBool = (value) => ['true','1','yes','y'].includes(String(value).toLowerCase());
const intersect = (left, right) => {
  if (right === null) return left;
  const b = new Set((right || []).map(String));
  return left === null ? [...b] : left.filter(id => b.has(String(id)));
};

const parseAttributeFilters = (query = {}) => {
  let filters = [];
  if (query.attributes) {
    try {
      const parsed = typeof query.attributes === 'string' ? JSON.parse(query.attributes) : query.attributes;
      if (Array.isArray(parsed)) filters.push(...parsed);
      else if (parsed && typeof parsed === 'object') filters.push(...Object.entries(parsed).map(([key, value]) => ({ key, op: 'eq', value })));
    } catch (_) {
      throw new AppError(400, 'attributes must be valid JSON', { code: 'validation_error' });
    }
  }
  for (const [raw, value] of Object.entries(query)) {
    if (!raw.startsWith('attr_')) continue;
    const body = raw.slice(5);
    const match = body.match(/^(.*)_(gte|lte|gt|lt|any|all|eq)$/);
    filters.push({ key: match ? match[1] : body, op: match ? match[2] : 'eq', value });
  }
  return filters.filter(f => f.key);
};

const typedValue = (definition, raw, op) => {
  if (definition.dataType === 'boolean') return asBool(raw);
  if (definition.dataType === 'number') {
    const value = Number(raw);
    if (!Number.isFinite(value)) throw new AppError(400, `Attribute ${definition.key} requires a number`);
    return value;
  }
  if (definition.dataType === 'multi_select' || ['any','all'].includes(op)) {
    return Array.isArray(raw) ? raw : String(raw).split(',').map(v => v.trim()).filter(Boolean);
  }
  return String(raw);
};

const productIdsForAttributes = async ({ productType, filters }) => {
  if (!filters.length) return null;
  const modelName = productType === 'resort' ? 'ResortV2' : 'VesselV2';
  let ids = null;
  for (const filter of filters) {
    const definition = await AttributeDefinition.findOne({ key: normalizeFacet(filter.key), active: true, filterable: true }).lean();
    if (!definition) return [];
    const value = typedValue(definition, filter.value, filter.op || 'eq');
    let condition = value;
    if (['gte','lte','gt','lt'].includes(filter.op)) condition = { [`$${filter.op}`]: value };
    else if (filter.op === 'any') condition = { $in: value };
    else if (filter.op === 'all') condition = { $all: value };
    const found = await ProductAttribute.distinct('product', { productModel: modelName, definition: definition._id, value: condition });
    ids = intersect(ids, found);
    if (!ids.length) return [];
  }
  return ids;
};

const canonicalLocationAndDescendants = async (value) => {
  if (!value) return [];
  const key = slugify(value);
  const root = await Location.findOne({ active: true, $or: [{ slug: key }, { aliases: new RegExp(`^${String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }] }).lean();
  if (!root) return [];
  const ids = [root._id];
  let frontier = [root._id];
  for (let depth = 0; depth < 5 && frontier.length; depth += 1) {
    const children = await Location.find({ active: true, parent: { $in: frontier } }).select('_id').lean();
    frontier = children.map(x => x._id);
    ids.push(...frontier);
  }
  return ids;
};

const vesselIdsFromOperationalFilters = async (query) => {
  let ids = null;
  const itineraryFilter = {};
  if (query.embarkation || query.departurePort) {
    const value = query.embarkation || query.departurePort;
    const locationIds = await canonicalLocationAndDescendants(value);
    itineraryFilter.$or = [{ 'embarkation.slug': slugify(value) }, ...(locationIds.length ? [{ 'embarkation.location': { $in: locationIds } }] : [])];
  }
  if (query.arrivalPort) {
    const locationIds = await canonicalLocationAndDescendants(query.arrivalPort);
    itineraryFilter.$and = [...(itineraryFilter.$and || []), { $or: [{ 'disembarkation.slug': slugify(query.arrivalPort) }, ...(locationIds.length ? [{ 'disembarkation.location': { $in: locationIds } }] : [])] }];
  }
  if (query.country) itineraryFilter.country = new RegExp(`^${String(query.country).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
  if (query.minNights || query.maxNights) {
    itineraryFilter.numberOfNights = {};
    if (query.minNights) itineraryFilter.numberOfNights.$gte = Number(query.minNights);
    if (query.maxNights) itineraryFilter.numberOfNights.$lte = Number(query.maxNights);
  }
  if (Object.keys(itineraryFilter).length) ids = (await Itinerary.distinct('vessel', itineraryFilter)).map(String);

  const departureFilter = { status: { $nin: ['cancelled'] } };
  let useDepartures = false;
  if (query.startDate) { departureFilter.startDate = { ...(departureFilter.startDate || {}), $gte: new Date(query.startDate) }; useDepartures = true; }
  if (query.endDate) { departureFilter.startDate = { ...(departureFilter.startDate || {}), $lte: new Date(query.endDate) }; useDepartures = true; }
  if (query.maxPrice) { departureFilter.effectiveMinPriceUsd = { ...(departureFilter.effectiveMinPriceUsd || {}), $lte: Number(query.maxPrice) }; useDepartures = true; }
  if (query.minPrice) { departureFilter.effectiveMinPriceUsd = { ...(departureFilter.effectiveMinPriceUsd || {}), $gte: Number(query.minPrice) }; useDepartures = true; }
  if (query.hasPricing === 'true') { departureFilter.effectiveMinPriceUsd = { ...(departureFilter.effectiveMinPriceUsd || {}), $exists: true, $ne: null }; useDepartures = true; }
  if (query.hasAvailability === 'true') { departureFilter['availability.0'] = { $exists: true }; useDepartures = true; }
  if (query.availableOnly === 'true' || query.availability) { departureFilter['availability.status'] = query.availability ? query.availability : { $in: ['available','limited','on_request'] }; useDepartures = true; }
  if (query.freshness) { departureFilter['availability.freshnessState'] = query.freshness; useDepartures = true; }
  if (query.availabilitySource) { departureFilter['availability.sourceType'] = query.availabilitySource; useDepartures = true; }
  if (query.conflict === 'true') { departureFilter['availability.conflictState'] = true; useDepartures = true; }
  if (query.override === 'true') { departureFilter['availability.manualOverride'] = true; useDepartures = true; }
  if (useDepartures) ids = intersect(ids, (await Departure.distinct('vessel', departureFilter)).map(String));
  return ids;
};

const resortIdsFromOperationalFilters = async (query) => {
  let ids = null;
  if (query.maxPrice || query.minPrice || query.hasPricing === 'true') {
    const price = { active: true };
    if (query.maxPrice || query.minPrice) {
      price['basePrice.amountUsd'] = {};
      if (query.maxPrice) price['basePrice.amountUsd'].$lte = Number(query.maxPrice);
      if (query.minPrice) price['basePrice.amountUsd'].$gte = Number(query.minPrice);
    }
    ids = (await ResortPackage.distinct('resort', price)).map(String);
  }
  if (query.hasAvailability === 'true' || query.availableOnly === 'true' || query.availability || query.freshness || query.availabilitySource || query.conflict === 'true' || query.override === 'true') {
    const availabilityFilter = {};
    if (query.availableOnly === 'true') availabilityFilter.status = { $in: ['available','limited','on_request'] };
    if (query.availability) availabilityFilter.status = query.availability;
    if (query.freshness) availabilityFilter.freshnessState = query.freshness;
    if (query.availabilitySource) availabilityFilter.source = query.availabilitySource;
    if (query.conflict === 'true') availabilityFilter.conflictState = true;
    if (query.override === 'true') availabilityFilter.manualOverride = true;
    const roomIds = await ResortAvailability.distinct('roomType', availabilityFilter);
    const resortIds = await RoomType.distinct('resort', { _id: { $in: roomIds } });
    ids = intersect(ids, resortIds.map(String));
  }
  return ids;
};

const baseProductFilter = async ({ productType, query, publicOnly }) => {
  const filter = publicOnly ? { listingStatus: 'published' } : {};
  if (!publicOnly && query.status) filter.listingStatus = query.status;
  if (query.organisation) filter.organisation = query.organisation;
  if (!publicOnly && query.claimStatus) {
    const orgIds = await Organisation.distinct('_id', { status: query.claimStatus });
    filter.organisation = query.organisation ? { $in: orgIds.filter(id => String(id) === String(query.organisation)) } : { $in: orgIds };
  }
  if (query.verification) filter.verificationStatus = query.verification;
  if (query.source) filter.source = query.source;
  if (query.veganRatingMin) filter.veganRating = { $gte: Number(query.veganRatingMin) };
  if (query.facility) filter.facilities = normalizeFacet(query.facility);
  if (query.accessibility) filter.accessibility = normalizeFacet(query.accessibility);
  if (query.dietary) filter.dietary = normalizeFacet(query.dietary);
  if (query.destination) filter.destinationSlugs = slugify(query.destination);
  if (query.completenessMin) filter.completenessScore = { ...(filter.completenessScore || {}), $gte: Number(query.completenessMin) };
  if (query.completenessMax) filter.completenessScore = { ...(filter.completenessScore || {}), $lte: Number(query.completenessMax) };
  if (query.hasImages === 'true') filter.featuredImage = { $exists: true, $nin: ['', null] };
  if (query.updatedAfter) filter.updatedAt = { ...(filter.updatedAt || {}), $gte: new Date(query.updatedAfter) };
  if (query.updatedBefore) filter.updatedAt = { ...(filter.updatedAt || {}), $lte: new Date(query.updatedBefore) };
  if (query.q) filter.$text = { $search: query.q };

  if (query.country) {
    const locationIds = await canonicalLocationAndDescendants(query.country);
    if (productType === 'resort') filter.$or = [{ country: new RegExp(`^${String(query.country).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }, ...(locationIds.length ? [{ destinationLocations: { $in: locationIds } }] : [])];
    else if (locationIds.length) filter.destinationLocations = { $in: locationIds };
  }
  return filter;
};

const searchProducts = async ({ productType, query = {}, publicOnly = false, populateOrganisation = false }) => {
  const Model = productType === 'resort' ? Resort : Vessel;
  const filter = await baseProductFilter({ productType, query, publicOnly });
  let ids = productType === 'resort' ? await resortIdsFromOperationalFilters(query) : await vesselIdsFromOperationalFilters(query);
  const attrIds = await productIdsForAttributes({ productType, filters: parseAttributeFilters(query) });
  ids = intersect(ids, attrIds);
  if (ids !== null) filter._id = { $in: ids };

  const { page, limit, skip, sort } = parsePagination(query, { defaultLimit: publicOnly ? 24 : 25, maxLimit: 100, allowedSort: ['name','updatedAt','createdAt','completenessScore','veganRating'], defaultSort: publicOnly ? 'name' : '-updatedAt' });
  let find = Model.find(filter).sort(sort).skip(skip).limit(limit);
  if (populateOrganisation) find = find.populate('organisation', 'name status primaryEmail website');
  const [items, total] = await Promise.all([find.lean(), Model.countDocuments(filter)]);
  return pagedResult({ items, total, page, limit });
};

const listVessels = (query) => searchProducts({ productType: 'vessel', query, publicOnly: true });
const listResorts = (query) => searchProducts({ productType: 'resort', query, publicOnly: true });
const searchAdminProducts = (productType, query) => searchProducts({ productType, query, publicOnly: false, populateOrganisation: true });

const getVesselBySlug = async (slug) => {
  const vessel = await Vessel.findOne({ slug, listingStatus: 'published' }).populate('organisation', 'name slug status website').lean();
  if (!vessel) return null;
  const itineraries = await Itinerary.find({ vessel: vessel._id, status: 'active' }).populate('basePrices.cabinType').lean();
  const departures = await Departure.find({ vessel: vessel._id, status: { $ne: 'cancelled' }, startDate: { $gte: new Date() } })
    .sort({ startDate: 1 })
    .populate('itinerary', 'name slug numberOfNights embarkation disembarkation destinationSlugs')
    .populate('effectivePrices.cabinType', 'name')
    .populate('availability.cabinType', 'name')
    .lean();
  return { ...vessel, itineraries, departures };
};

module.exports = { listVessels, getVesselBySlug, listResorts, searchAdminProducts, searchProducts, parseAttributeFilters, productIdsForAttributes, typedValue, normalizeFacet, intersect };
