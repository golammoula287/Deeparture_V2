// Display only a currently valid offer tied to the actual displayed cabin price.
export function departureOffer(departure, at = Date.now()) {
  if (!departure || !Number.isFinite(departure.effectiveMinPrice)) return null;
  const prices = Array.isArray(departure.effectivePrices) ? departure.effectivePrices : [];
  const offers = Array.isArray(departure.offers) ? departure.offers : [];
  for (const price of prices) {
    if (price.effectiveAmount !== departure.effectiveMinPrice || price.currency !== departure.effectiveCurrency || !Number.isFinite(price.rackAmount) || price.rackAmount <= price.effectiveAmount || price.effectiveAmount <= 0) continue;
    const offer = offers.find(item => item.active !== false && item.name === price.offerName && (!item.validFrom || new Date(item.validFrom).getTime() <= at) && (!item.validUntil || new Date(item.validUntil).getTime() >= at));
    if (!offer) continue;
    return { name:offer.name, percent:Math.round((1-price.effectiveAmount/price.rackAmount)*100), originalPrice:price.rackAmount, validUntil:offer.validUntil || null };
  }
  return null;
}
