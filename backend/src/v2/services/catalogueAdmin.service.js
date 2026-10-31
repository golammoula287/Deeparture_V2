const Vessel = require('../models/vessel.model');
const Resort = require('../models/resort.model');
const Location = require('../models/location.model');
const AppError = require('../../error/appError');
const { logAudit } = require('./audit.service');
const { publishDomainEvent } = require('./domainEvent.service');
const { refreshProductCompleteness } = require('./completeness.service');

const LISTING_STATUSES = ['draft','pending_review','published','restricted','archived'];
const modelFor = (productType) => productType === 'resort' ? Resort : productType === 'vessel' ? Vessel : null;

const assertVersion = (item, expectedUpdatedAt) => {
  if (!expectedUpdatedAt) return;
  const expected = new Date(expectedUpdatedAt).getTime();
  if (!Number.isFinite(expected) || expected !== new Date(item.updatedAt).getTime()) {
    throw new AppError(409, 'Listing changed since it was loaded', { code: 'conflict', details: { currentUpdatedAt: item.updatedAt } });
  }
};

const setListingStatus = async ({ productType, id, listingStatus, expectedUpdatedAt, req, operationId }) => {
  if (!LISTING_STATUSES.includes(listingStatus)) throw new AppError(400, 'Invalid listing status');
  const Model = modelFor(productType);
  if (!Model) throw new AppError(400, 'Unsupported product type');
  const item = await Model.findById(id);
  if (!item) throw new AppError(404, 'Listing not found');
  assertVersion(item, expectedUpdatedAt);
  const before = item.listingStatus;
  item.listingStatus = listingStatus;
  await item.save();
  await logAudit({ req, organisation: item.organisation, action: `${productType}.status`, entityType: productType, entityId: item._id, before: { listingStatus: before }, after: { listingStatus }, source: 'admin', operationId });
  await publishDomainEvent({ name: listingStatus === 'published' ? 'listing.published' : 'listing.status_changed', aggregateType: productType, aggregateId: item._id, organisation: item.organisation, actorUser: req?.v2User?._id, operationId, payload: { before, after: listingStatus } });
  return item;
};

const assignDestination = async ({ productType, id, locationId, req, operationId }) => {
  const Model = modelFor(productType);
  if (!Model) throw new AppError(400, 'Unsupported product type');
  const location = await Location.findOne({ _id: locationId, active: true, type: { $in: ['country','region','destination'] } });
  if (!location) throw new AppError(400, 'Active canonical destination location is required');
  const item = await Model.findById(id);
  if (!item) throw new AppError(404, 'Listing not found');
  const before = { destinationLocations: item.destinationLocations, destinationSlugs: item.destinationSlugs };
  if (!item.destinationLocations.some(x => String(x) === String(location._id))) item.destinationLocations.push(location._id);
  if (!item.destinationSlugs.includes(location.slug)) item.destinationSlugs.push(location.slug);
  await item.save();
  await refreshProductCompleteness({ productType, productId: item._id });
  await logAudit({ req, organisation: item.organisation, action: `${productType}.destination.assign`, entityType: productType, entityId: item._id, before, after: { destinationLocations: item.destinationLocations, destinationSlugs: item.destinationSlugs }, source: 'admin', operationId });
  return item;
};

module.exports = { setListingStatus, assignDestination, LISTING_STATUSES };
