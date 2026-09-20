const Itinerary = require("../models/itinerary.model");
const Departure = require("../models/departure.model");

const isOfferActive = (offer, at = new Date()) => {
  if (!offer || offer.active === false) return false;
  if (offer.validFrom && new Date(offer.validFrom) > at) return false;
  if (offer.validUntil && new Date(offer.validUntil) < at) return false;
  return true;
};

const applyOffer = ({ amount, amountUsd, currency }, offer, at = new Date()) => {
  if (!isOfferActive(offer, at)) return { amount, amountUsd, currency, offerName: undefined };
  if (offer.type === "percent" && Number.isFinite(offer.percent)) {
    const factor = 1 - offer.percent / 100;
    return { amount: Math.max(0, amount * factor), amountUsd: Number.isFinite(amountUsd) ? Math.max(0, amountUsd * factor) : undefined, currency, offerName: offer.name };
  }
  if (offer.type === "fixed_amount" && Number.isFinite(offer.amount)) {
    if (offer.currency && offer.currency !== currency) return { amount, amountUsd, currency, offerName: undefined };
    const nextUsd = Number.isFinite(amountUsd)
      ? Math.max(0, amountUsd - (Number.isFinite(offer.amountUsd) ? offer.amountUsd : currency === "USD" ? offer.amount : NaN))
      : undefined;
    return { amount: Math.max(0, amount - offer.amount), amountUsd: Number.isFinite(nextUsd) ? nextUsd : undefined, currency, offerName: offer.name };
  }
  if (offer.type === "fixed_price" && Number.isFinite(offer.amount)) {
    const nextCurrency = offer.currency || currency;
    const nextUsd = Number.isFinite(offer.amountUsd) ? offer.amountUsd : nextCurrency === "USD" ? offer.amount : undefined;
    return { amount: Math.max(0, offer.amount), amountUsd: nextUsd, currency: nextCurrency, offerName: offer.name };
  }
  return { amount, amountUsd, currency, offerName: undefined };
};

const calculateEffectivePrices = (itinerary, departure, at = new Date()) => {
  const overrides = new Map((departure.priceOverrides || []).map((item) => [String(item.cabinType), item]));
  const prices = [];
  for (const base of itinerary.basePrices || []) {
    const cabinId = String(base.cabinType);
    const override = overrides.get(cabinId);
    const rackAmount = override?.amount ?? base.amount;
    const currency = override?.currency || base.currency;
    // Never reuse the base USD value after a departure override changes the price.
    const rackAmountUsd = override
      ? (Number.isFinite(override.amountUsd) ? override.amountUsd : currency === "USD" ? rackAmount : undefined)
      : (Number.isFinite(base.amountUsd) ? base.amountUsd : currency === "USD" ? rackAmount : undefined);
    const offers = (departure.offers || []).filter((offer) => (!offer.cabinType || String(offer.cabinType) === cabinId) && isOfferActive(offer, at));
    let effective = { amount: rackAmount, amountUsd: rackAmountUsd, currency, offerName: undefined };
    for (const offer of offers) {
      const candidate = applyOffer({ amount: rackAmount, amountUsd: rackAmountUsd, currency }, offer, at);
      const useUsd = Number.isFinite(candidate.amountUsd) && Number.isFinite(effective.amountUsd);
      const sameCurrency = candidate.currency === effective.currency;
      const candidateComparable = useUsd ? candidate.amountUsd : sameCurrency ? candidate.amount : Infinity;
      const currentComparable = useUsd ? effective.amountUsd : effective.amount;
      if (candidateComparable < currentComparable) effective = candidate;
    }
    prices.push({ cabinType: base.cabinType, rackAmount, rackAmountUsd, effectiveAmount: Number(effective.amount.toFixed(2)), effectiveAmountUsd: Number.isFinite(effective.amountUsd) ? Number(effective.amountUsd.toFixed(2)) : undefined, currency: effective.currency, offerName: effective.offerName });
  }
  return prices;
};

const materializeDeparturePricing = async (departure, at = new Date()) => {
  const itinerary = await Itinerary.findById(departure.itinerary);
  if (!itinerary) throw new Error("Itinerary not found for departure pricing");
  const effectivePrices = calculateEffectivePrices(itinerary, departure, at);
  departure.effectivePrices = effectivePrices;
  if (effectivePrices.length) {
    const sameCurrency = effectivePrices.every((p) => p.currency === effectivePrices[0].currency);
    departure.effectiveCurrency = sameCurrency ? effectivePrices[0].currency : undefined;
    departure.effectiveMinPrice = Math.min(...effectivePrices.map((p) => p.effectiveAmount));
    const usdPrices = effectivePrices.map((p) => p.effectiveAmountUsd).filter(Number.isFinite);
    departure.effectiveMinPriceUsd = usdPrices.length ? Math.min(...usdPrices) : undefined;
  } else {
    departure.effectiveMinPrice = undefined;
    departure.effectiveMinPriceUsd = undefined;
    departure.effectiveCurrency = undefined;
  }
  departure.pricingUpdatedAt = new Date();
  return departure;
};

const repriceDeparturesForItinerary = async (itineraryId, at = new Date()) => {
  const departures = await Departure.find({ itinerary: itineraryId });
  for (const departure of departures) {
    await materializeDeparturePricing(departure, at);
    await departure.save();
  }
  return departures.length;
};

module.exports = { isOfferActive, applyOffer, calculateEffectivePrices, materializeDeparturePricing, repriceDeparturesForItinerary };
