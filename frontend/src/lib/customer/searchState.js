import { isDateOnly, stayDateError } from './searchDates';

const scalar = value => typeof value === 'string' ? value.trim().slice(0, 250) : '';
export const defaultSort = resort => resort ? 'recommended' : 'departureDate';
export const finderSorts = resort => [
  resort ? ['recommended', 'Recommended'] : ['departureDate', 'Departure date'],
  ['price', 'Price low–high'], ['-price', 'Price high–low'], ['-veganRating', 'Vegan Rating'],
  ['name', 'Name A–Z'], ['-name', 'Name Z–A'],
];
export function searchState(query = {}, resort = false) {
  const state = { destination: scalar(query.destination), minPrice: scalar(query.minPrice), maxPrice: scalar(query.maxPrice), veganRatingMin: scalar(query.veganRatingMin), sort: finderSorts(resort).some(([key]) => key === query.sort) ? query.sort : defaultSort(resort), page: String(Math.max(1, parseInt(query.page, 10) || 1)) };
  if (!resort) for (const key of ['startDate', 'endDate', 'minNights', 'maxNights', 'embarkation']) state[key] = scalar(query[key]);
  let invalid = false;
  if (resort) {
    const checkIn = scalar(query.checkIn);
    const checkOut = scalar(query.checkOut);
    if (checkIn || checkOut || Array.isArray(query.checkIn) || Array.isArray(query.checkOut)) {
      invalid = Boolean(stayDateError(checkIn, checkOut));
      if (!invalid) Object.assign(state, { checkIn, checkOut });
    }
  }
  for (const key of ['minPrice', 'maxPrice', 'minNights', 'maxNights', 'veganRatingMin']) if (state[key] && (!Number.isFinite(Number(state[key])) || Number(state[key]) < 0 || (key === 'veganRatingMin' && Number(state[key]) > 5))) { state[key] = ''; invalid = true; }
  if (state.minPrice && state.maxPrice && Number(state.minPrice) > Number(state.maxPrice)) { state.minPrice = ''; state.maxPrice = ''; invalid = true; }
  for (const key of ['startDate', 'endDate']) if (state[key] && !isDateOnly(state[key])) { state[key] = ''; invalid = true; }
  if (state.startDate && state.endDate && state.startDate > state.endDate) { state.startDate = ''; state.endDate = ''; invalid = true; }
  if (state.minNights && state.maxNights && Number(state.minNights) > Number(state.maxNights)) { state.minNights = ''; state.maxNights = ''; invalid = true; }
  if (typeof query.attributes === 'string' && query.attributes.trim()) {
    try {
      const parsed = JSON.parse(query.attributes);
      if (!Array.isArray(parsed)) invalid = true;
      else {
        const attributes = parsed.filter(item => item && typeof item.key === 'string' && item.key.length <= 100 && (['string','number','boolean'].includes(typeof item.value) || (Array.isArray(item.value) && item.value.every(v => typeof v === 'string'))) && ['eq', 'all', 'gte', 'lte'].includes(item.op)).slice(0, 30);
        if (attributes.length) state.attributes = JSON.stringify(attributes);
        if (attributes.length !== parsed.length) invalid = true;
      }
    } catch { invalid = true; }
  } else if (Array.isArray(query.attributes)) invalid = true;
  return { state, invalid };
}
export function finderUrl(path, state) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(state)) if (value !== undefined && value !== '' && !(key === 'page' && String(value) === '1') && !(key === 'sort' && value === defaultSort(path === '/explore/resorts'))) params.set(key, String(value));
  return `${path}${params.size ? `?${params}` : ''}`;
}
