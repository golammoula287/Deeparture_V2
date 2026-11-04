// Design-review fixtures only. Never import this module into live catalogue/API code.
export const previewTrips = [
  { slug: 'coral-horizon', name: 'Coral Horizon', destination: 'Raja Ampat', country: 'Indonesia', route: 'Sorong · Dampier Strait · Misool', date: '2027-02-12', end: '2027-02-22', nights: 10, price: 3650, rack: 4295, offer: 'Save 15%', availability: 'limited', spaces: 4, vegan: 5, attributes: ['Vegan-friendly', 'Nitrox', 'Photography'], image: 'vessel.jpg', alt: 'Illustrative white yacht on clear turquoise water', dietary: ['vegan', 'gluten-free'], accessibility: ['step-free-saloon'], diving: ['nitrox', 'photography'], facilities: ['wifi', 'air-conditioning'], guests: 16, cabins: 8 },
  { slug: 'blue-current', name: 'Blue Current', destination: 'Maldives', country: 'Maldives', route: 'Malé · Ari Atoll · Vaavu', date: '2027-03-06', end: '2027-03-13', nights: 7, price: 2190, availability: 'available', spaces: 8, vegan: 4, attributes: ['Vegetarian-friendly', 'Nitrox', 'Wi-Fi'], image: 'boat.jpg', alt: 'Illustrative scuba diver beside a school of reef fish', dietary: ['vegetarian'], accessibility: [], diving: ['nitrox'], facilities: ['wifi', 'air-conditioning'], guests: 20, cabins: 10 },
  { slug: 'reef-wanderer', name: 'Reef Wanderer', destination: 'Red Sea', country: 'Egypt', route: 'Hurghada · Brothers · Daedalus', date: '2027-02-19', end: '2027-02-26', nights: 7, price: 1840, availability: 'unknown', vegan: 3, attributes: ['Nitrox', 'Rebreather support'], image: 'ocean.jpg', alt: 'Illustrative sunlight filtering through water above a reef', dietary: ['vegetarian'], accessibility: [], diving: ['nitrox', 'rebreather'], facilities: ['air-conditioning'], guests: 24, cabins: 12 },
  { slug: 'misool-explorer', name: 'Misool Explorer', destination: 'Raja Ampat', country: 'Indonesia', route: 'Sorong · Misool · Batanta', date: '2027-03-15', end: '2027-03-27', nights: 12, price: 4120, availability: 'sold-out', vegan: 5, attributes: ['Vegan-friendly', 'Photography'], image: 'reef.jpg', alt: 'Illustrative colourful coral formations', dietary: ['vegan', 'gluten-free'], accessibility: ['step-free-saloon'], diving: ['photography'], facilities: ['wifi'], guests: 12, cabins: 6 },
  { slug: 'southern-cross', name: 'Southern Cross', destination: 'Maldives', country: 'Maldives', route: 'Malé · South Ari · Felidhoo', date: '2027-04-03', end: '2027-04-13', nights: 10, price: 2890, availability: 'available', spaces: 6, vegan: 4, attributes: ['Gluten-free options', 'Photography'], image: 'vessel.jpg', alt: 'Illustrative yacht in a sheltered bay', dietary: ['vegetarian', 'gluten-free'], accessibility: [], diving: ['photography'], facilities: ['wifi', 'air-conditioning'], guests: 18, cabins: 9 },
  { slug: 'ocean-nomad', name: 'Ocean Nomad', destination: 'Raja Ampat', country: 'Indonesia', route: 'Sorong · Waigeo · Dampier Strait', date: '2027-04-10', end: '2027-04-17', nights: 7, price: 2790, availability: 'available', spaces: 6, vegan: 4, attributes: ['Vegan-friendly', 'Nitrox'], image: 'boat.jpg', alt: 'Illustrative diver exploring a tropical reef', dietary: ['vegan'], accessibility: [], diving: ['nitrox'], facilities: ['air-conditioning'], guests: 14, cabins: 7 },
];

export const defaultFilters = { destination: '', from: '', to: '', nights: '', maxPrice: '', vegan: '', dietary: [], accessibility: [], diving: [], facilities: [], availableOnly: false, offersOnly: false };

export const filterGroups = [
  { key: 'dietary', title: 'Dietary preferences', items: [['vegan', 'Vegan meals'], ['vegetarian', 'Vegetarian meals'], ['gluten-free', 'Gluten-free options']] },
  { key: 'accessibility', title: 'Accessibility', items: [['step-free-saloon', 'Step-free saloon access']] },
  { key: 'diving', title: 'Your diving', items: [['nitrox', 'Nitrox available'], ['photography', 'Photography facilities'], ['rebreather', 'Rebreather support']] },
  { key: 'facilities', title: 'On board', items: [['wifi', 'Wi-Fi'], ['air-conditioning', 'Air conditioning']] },
];

// This in-memory selection exists solely to demonstrate preview interactions.
// Real customer filtering/sorting/pagination must remain in shared V2 backend services.
export function selectPreviewTrips(filters, sort = 'recommended') {
  const selected = previewTrips.filter(trip =>
    (!filters.destination || trip.destination === filters.destination) &&
    (!filters.from || trip.date >= filters.from) && (!filters.to || trip.date <= filters.to) &&
    (!filters.nights || (filters.nights === '7' ? trip.nights <= 7 : trip.nights >= 8)) &&
    (!filters.maxPrice || trip.price <= Number(filters.maxPrice)) &&
    (!filters.vegan || trip.vegan >= Number(filters.vegan)) &&
    (!filters.availableOnly || ['available', 'limited'].includes(trip.availability)) &&
    (!filters.offersOnly || trip.offer) &&
    filterGroups.every(({ key }) => filters[key].every(value => trip[key].includes(value)))
  );
  return selected.sort((a, b) => (sort === 'price' ? a.price - b.price : sort === 'date' ? a.date.localeCompare(b.date) : sort === 'name' ? a.name.localeCompare(b.name) : previewTrips.indexOf(a) - previewTrips.indexOf(b)) || a.slug.localeCompare(b.slug));
}

export const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
export const shortDate = value => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`));

export function previewPageAccess(res) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  return process.env.NODE_ENV === 'development' || process.env.PHASE4_DESIGN_PREVIEW === 'true';
}
