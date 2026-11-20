const Departure = require('../models/departure.model');
const ResortRatePeriod = require('../models/resortRatePeriod.model');
const { applyOffer, calculateEffectivePrices } = require('./pricing.service');

const offerWindow = (now, prefix = '') => ({
  [`${prefix}type`]: { $in: ['percent', 'fixed_amount', 'fixed_price'] },
  $and: [
    { $or: [{ [`${prefix}validFrom`]: null }, { [`${prefix}validFrom`]: { $lte: now } }] },
    { $or: [{ [`${prefix}validUntil`]: null }, { [`${prefix}validUntil`]: { $gte: now } }] },
  ],
});

const vesselOfferIds = async (now) => {
  const departures = await Departure.find({
    startDate: { $gte: now },
    status: { $nin: ['sold_out', 'cancelled'] },
    offers: { $elemMatch: { ...offerWindow(now), active: { $ne: false } } },
  }).select('vessel itinerary offers priceOverrides')
    .populate({ path: 'itinerary', match: { status: 'active' }, select: 'basePrices vessel' })
    .lean();

  return departures.filter(({ itinerary, vessel, ...departure }) =>
    itinerary && String(itinerary.vessel) === String(vessel) &&
    calculateEffectivePrices(itinerary, departure, now).some(price => price.offerName)
  ).map(({ vessel }) => vessel);
};

const resortOfferIds = async (now) => {
  const rates = await ResortRatePeriod.find({
    active: true,
    endDate: { $gte: now },
    ...offerWindow(now, 'offer.'),
  }).select('resort package offer priceOverride')
    .populate({ path: 'package', match: { active: true }, select: 'resort basePrice' })
    .lean();

  return rates.filter(rate => {
    if (!rate.package || String(rate.package.resort) !== String(rate.resort)) return false;
    const base = rate.package.basePrice || {};
    const override = rate.priceOverride;
    const price = Number.isFinite(override?.amount) ? { ...override, currency: override.currency || base.currency } : base;
    if (!Number.isFinite(price.amount) || !price.currency) return false;
    const discounted = applyOffer(price, rate.offer, now);
    if (discounted.currency === price.currency) return discounted.amount < price.amount;
    return Number.isFinite(discounted.amountUsd) && Number.isFinite(price.amountUsd) && discounted.amountUsd < price.amountUsd;
  }).map(({ resort }) => resort);
};

const activeOfferProductIds = (productType, now = new Date()) =>
  productType === 'resort' ? resortOfferIds(now) : vesselOfferIds(now);

module.exports = { activeOfferProductIds };
