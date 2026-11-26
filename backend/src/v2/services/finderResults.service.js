const Departure = require('../models/departure.model');
const ResortPackage = require('../models/resortPackage.model');
const { resortPromotions, vesselPromotions } = require('./catalogueOffers.service');
const { usdPrice, departureStartingUsd } = require('./pricing.service');
const { pagedResult } = require('./pagination.service');

const matchesPrice = (price, { minPrice, maxPrice, hasPriceBounds }) => !hasPriceBounds ||
  (Number.isFinite(price) && price >= (minPrice ?? 0) && price <= (maxPrice ?? Infinity));

function numericOrder(left, right, direction = 1) {
  if (!Number.isFinite(left)) return Number.isFinite(right) ? 1 : 0;
  if (!Number.isFinite(right)) return -1;
  return (left - right) * direction;
}

function retainBest(summaries, key, data, compare) {
  const previous = summaries.get(key);
  if (!previous || compare(data, previous) < 0) summaries.set(key, data);
}

async function departureSummaries(ids, finder, priceSort) {
  const summaries = new Map();
  const now = new Date();
  const filter = finder.departureFilter;
  const earliest = filter.startDate?.$gte;
  const departures = await Departure.find({
    ...filter,
    vessel: { $in: ids },
    status: { $nin: ['cancelled', 'sold_out'] },
    startDate: { ...filter.startDate, $gte: earliest > now ? earliest : now },
  }).select('vessel itinerary startDate endDate effectiveMinPrice effectiveMinPriceUsd effectiveCurrency offers priceOverrides')
    .populate({ path: 'itinerary', match: { status: 'active' }, select: 'name numberOfNights basePrices' })
    .sort({ startDate: 1, _id: 1 }).lean();
  for (const { vessel, itinerary, offers, priceOverrides, ...departure } of departures) {
    if (!itinerary) continue;
    const { basePrices, ...itinerarySummary } = itinerary;
    const price = departureStartingUsd(itinerary, { ...departure, offers, priceOverrides }, now);
    if (!matchesPrice(price, finder)) continue;
    retainBest(summaries, String(vessel), { departure: { ...departure, itinerary: itinerarySummary, startingPriceUsd: price, effectiveMinPriceUsd: price }, price },
      (left, right) => priceSort ? numericOrder(left.price, right.price) : 0);
  }
  return summaries;
}

async function resortSummaries(ids, finder) {
  const packages = finder.packages || await ResortPackage.find({ ...finder.packageFilter, resort: { $in: ids } })
    .select('_id resort basePrice').sort({ _id: 1 }).lean();
  const summaries = new Map();
  for (const item of packages) {
    const { _id, resort, basePrice } = item;
    const rate = finder.checkIn ? item.startingRate : basePrice;
    if (!Number.isFinite(rate?.amount) || !rate.currency) continue;
    const price = usdPrice(rate);
    if (!matchesPrice(price, finder)) continue;
    retainBest(summaries, String(resort), { startingRate: { ...rate, packageId: _id }, price },
      (left, right) => numericOrder(left.price, right.price));
  }
  return summaries;
}

async function promotionSummaries(ids, finder, resort) {
  const now = new Date();
  const entries = resort
    ? await resortPromotions(now, { ...finder, resortIds: ids })
    : await vesselPromotions(now, finder.departureFilter, ids);
  const summaries = new Map();
  for (const { vessel, resort: resortId, ...summary } of entries) {
    const price = usdPrice(summary.promotion);
    if (!matchesPrice(price, finder)) continue;
    retainBest(summaries, String(vessel || resortId), { ...summary, price },
      (left, right) => numericOrder(left.price, right.price));
  }
  return summaries;
}

async function finderResults({ Model, filter, finder, productType, requestedSort, page, limit, skip }) {
  let products = await Model.find(filter).select('_id name veganRating completenessScore').lean();
  if (!products.length) return pagedResult({ items: [], total: 0, page, limit });
  const ids = products.map(item => item._id);
  const resort = productType === 'resort';
  const priceSort = requestedSort === 'price' || requestedSort === '-price';
  const summaries = finder.activeOffer
    ? await promotionSummaries(ids, finder, resort)
    : resort ? await resortSummaries(ids, finder) : await departureSummaries(ids, finder, priceSort);
  const summaryFor = item => summaries.get(String(item._id));
  if (finder.requiresDeparture || finder.activeOffer || finder.hasPriceBounds) products = products.filter(item => summaryFor(item));
  products.sort((left, right) => {
    const a = summaryFor(left), b = summaryFor(right);
    let order;
    if (priceSort) order = numericOrder(a?.price, b?.price, requestedSort === 'price' ? 1 : -1);
    else if (requestedSort === '-veganRating') order = numericOrder(left.veganRating, right.veganRating, -1);
    else if (requestedSort === 'name' || requestedSort === '-name') order = left.name.localeCompare(right.name) * (requestedSort === 'name' ? 1 : -1);
    else if (resort) {
      order = numericOrder(left.completenessScore, right.completenessScore, -1) || numericOrder(a?.price, b?.price);
    } else order = numericOrder(a?.departure.startDate.getTime(), b?.departure.startDate.getTime());
    return order || left.name.localeCompare(right.name) || String(left._id).localeCompare(String(right._id));
  });
  const ordered = products.slice(skip, skip + limit);
  const pageItems = await Model.find({ ...filter, _id: { $in: ordered.map(item => item._id) } }).lean();
  const byId = new Map(pageItems.map(item => [String(item._id), item]));
  const items = ordered.flatMap(item => {
    const listing = byId.get(String(item._id));
    return listing ? [{ ...listing, ...summaryFor(item) }] : [];
  });
  return pagedResult({ items, total: products.length, page, limit });
}

module.exports = { finderResults };
