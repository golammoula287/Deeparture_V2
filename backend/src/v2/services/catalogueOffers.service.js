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

const vesselPromotions = async (now, filter = {}, vesselIds) => {
  const earliest = filter.startDate?.$gte;
  const departures = await Departure.find({
    ...filter,
    ...(vesselIds && { vessel: { $in: vesselIds } }),
    startDate: { ...filter.startDate, $gte: earliest > now ? earliest : now },
    status: { $nin: ['sold_out', 'cancelled'] },
    offers: { $elemMatch: { ...offerWindow(now), active: { $ne: false } } },
  }).select('vessel itinerary startDate endDate offers priceOverrides')
    .populate({ path: 'itinerary', match: { status: 'active' }, select: 'basePrices vessel name numberOfNights' })
    .sort({ startDate: 1, _id: 1 }).lean();

  return departures.flatMap(({ vessel, itinerary, _id, startDate, endDate, ...departure }) => {
    if (!itinerary || String(itinerary.vessel) !== String(vessel)) return [];
    const offers = calculateEffectivePrices(itinerary, departure, now).filter(price => price.offerName);
    return offers.map(price => ({
      vessel,
      departure: { _id, startDate, endDate, itinerary: { name: itinerary.name, numberOfNights: itinerary.numberOfNights } },
      promotion: {
        offerId: price.offerId,
        name: price.offerName,
        amount: price.effectiveAmount,
        amountUsd: price.effectiveAmountUsd,
        currency: price.currency,
        originalPrice: price.rackAmount,
        originalCurrency: departure.priceOverrides?.find(override => String(override.cabinType) === String(price.cabinType))?.currency
          || itinerary.basePrices?.find(base => String(base.cabinType) === String(price.cabinType))?.currency,
        validUntil: departure.offers.find(offer => String(offer._id) === String(price.offerId))?.validUntil,
        pricingBasis: itinerary.basePrices?.find(base => String(base.cabinType) === String(price.cabinType))?.pricingBasis,
      },
    }));
  });
};

const resortPromotions = async (now, { resortIds, packageFilter = {}, packages, checkIn, checkOut } = {}) => {
  const lastNight = checkOut ? new Date(new Date(checkOut).getTime() - 86_400_000) : null;
  const firstDay = new Date(now);
  firstDay.setUTCHours(0, 0, 0, 0);
  const rates = await ResortRatePeriod.find({
    active: true,
    ...(resortIds && { resort: { $in: resortIds } }),
    ...(packages && { package: { $in: packages.map(item => item._id) } }),
    ...(checkIn && { startDate: { $lte: new Date(new Date(checkIn).getTime() + 86_399_999) } }),
    endDate: { $gte: lastNight || firstDay },
    ...offerWindow(now, 'offer.'),
  }).select('resort package offer priceOverride minimumStayNights')
    .populate({ path: 'package', match: { ...packageFilter, active: true }, select: 'resort basePrice' })
    .sort({ _id: 1 }).lean();

  return rates.flatMap(rate => {
    if (!rate.package || String(rate.package.resort) !== String(rate.resort)) return [];
    if (checkIn && (new Date(checkOut) - new Date(checkIn)) / 86_400_000 < (rate.minimumStayNights || 0)) return [];
    const base = rate.package.basePrice || {};
    const override = rate.priceOverride;
    const price = Number.isFinite(override?.amount) ? { ...override, currency: override.currency || base.currency } : base;
    if (!Number.isFinite(price.amount) || !price.currency) return [];
    const discounted = applyOffer(price, rate.offer, now);
    const lower = discounted.currency === price.currency
      ? discounted.amount < price.amount
      : Number.isFinite(discounted.amountUsd) && Number.isFinite(price.amountUsd) && discounted.amountUsd < price.amountUsd;
    return lower ? [{
      resort: rate.resort,
      promotion: { offerId: rate._id, amount: discounted.amount, amountUsd: discounted.amountUsd, currency: discounted.currency, name: rate.offer.name, pricingBasis: base.pricingBasis, packageId: rate.package._id, minimumStayNights: rate.minimumStayNights },
    }] : [];
  });
};

const activeOfferProductIds = async (productType, now = new Date()) => productType === 'resort'
  ? (await resortPromotions(now)).map(entry => entry.resort)
  : (await vesselPromotions(now)).map(entry => entry.vessel);

module.exports = { activeOfferProductIds, resortPromotions, vesselPromotions };
