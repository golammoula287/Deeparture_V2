const Departure = require('../models/departure.model');
const ResortPackage = require('../models/resortPackage.model');
const { pagedResult } = require('./pagination.service');

function usdPrice(price) {
  if (Number.isFinite(price?.amountUsd)) return price.amountUsd;
  return price?.currency === 'USD' && Number.isFinite(price.amount) ? price.amount : null;
}

function numericOrder(left, right, direction = 1) {
  if (!Number.isFinite(left)) return Number.isFinite(right) ? 1 : 0;
  if (!Number.isFinite(right)) return -1;
  return (left - right) * direction;
}

function retainBest(summaries, key, data, compare) {
  const previous = summaries.get(key);
  if (!previous || compare(data, previous) < 0) summaries.set(key, data);
}

async function departureSummaries(ids, filter, priceSort) {
  const summaries = new Map();
  const now = new Date();
  const earliest = filter.startDate?.$gte;
  const departures = await Departure.find({
    ...filter,
    vessel: { $in: ids },
    status: { $nin: ['cancelled', 'sold_out'] },
    startDate: { ...filter.startDate, $gte: earliest > now ? earliest : now },
  }).select('vessel itinerary startDate endDate effectiveMinPrice effectiveMinPriceUsd effectiveCurrency')
    .populate({ path: 'itinerary', match: { status: 'active' }, select: 'name numberOfNights' })
    .sort({ startDate: 1, _id: 1 }).lean();
  for (const { vessel, ...departure } of departures) {
    if (!departure.itinerary) continue;
    const price = usdPrice({ amount: departure.effectiveMinPrice, amountUsd: departure.effectiveMinPriceUsd, currency: departure.effectiveCurrency });
    retainBest(summaries, String(vessel), { departure, price },
      (left, right) => priceSort ? numericOrder(left.price, right.price) : 0);
  }
  return summaries;
}

async function resortSummaries(ids, finder) {
  const packages = finder.packages || await ResortPackage.find({ ...finder.packageFilter, resort: { $in: ids } })
    .select('_id resort basePrice').sort({ _id: 1 }).lean();
  const summaries = new Map();
  for (const { _id, resort, basePrice } of packages) {
    if (!Number.isFinite(basePrice?.amount) || !basePrice.currency) continue;
    retainBest(summaries, String(resort), { startingRate: { ...basePrice, packageId: _id }, price: usdPrice(basePrice) },
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
  const summaries = resort
    ? await resortSummaries(ids, finder)
    : await departureSummaries(ids, finder.departureFilter, priceSort);
  const summaryFor = item => summaries.get(String(item._id));
  if (finder.requiresDeparture) products = products.filter(item => summaryFor(item));
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
