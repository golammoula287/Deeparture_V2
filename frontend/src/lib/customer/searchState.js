const scalar = value => typeof value === 'string' ? value.trim().slice(0, 250) : '';
export const sorts = [['name', 'Name A–Z'], ['-name', 'Name Z–A'], ['-veganRating', 'Vegan Rating']];
export function searchState(query = {}, resort = false) {
  const state = { destination: scalar(query.destination), minPrice: scalar(query.minPrice), maxPrice: scalar(query.maxPrice), veganRatingMin: scalar(query.veganRatingMin), sort: sorts.some(([key]) => key === query.sort) ? query.sort : 'name', page: String(Math.max(1, parseInt(query.page, 10) || 1)) };
  if (query.availableOnly === 'true') state.availableOnly = 'true';
  if (!resort) for (const key of ['startDate', 'endDate', 'minNights', 'maxNights', 'embarkation']) state[key] = scalar(query[key]);
  let invalid = false;
  for (const key of ['minPrice', 'maxPrice', 'minNights', 'maxNights', 'veganRatingMin']) if (state[key] && (!Number.isFinite(Number(state[key])) || Number(state[key]) < 0 || (key === 'veganRatingMin' && Number(state[key]) > 5))) { state[key] = ''; invalid = true; }
  if (state.minPrice && state.maxPrice && Number(state.minPrice) > Number(state.maxPrice)) { state.minPrice = ''; state.maxPrice = ''; invalid = true; }
  for (const key of ['startDate', 'endDate']) if (state[key] && (!/^\d{4}-\d{2}-\d{2}$/.test(state[key]) || !Number.isFinite(Date.parse(state[key])) || (Number.isFinite(Date.parse(state[key])) && new Date(state[key]).toISOString().slice(0, 10) !== state[key]))) { state[key] = ''; invalid = true; }
  if (state.startDate && state.endDate && state.startDate > state.endDate) { state.startDate = ''; state.endDate = ''; invalid = true; }
  if (state.minNights && state.maxNights && Number(state.minNights) > Number(state.maxNights)) { state.minNights = ''; state.maxNights = ''; invalid = true; }
  let attributes = [];
  try { const parsed = JSON.parse(typeof query.attributes === 'string' ? query.attributes : '[]'); if (Array.isArray(parsed)) attributes = parsed.filter(item => item && typeof item.key === 'string' && item.key.length <= 100 && (['string','number','boolean'].includes(typeof item.value) || (Array.isArray(item.value) && item.value.every(v => typeof v === 'string'))) && ['eq', 'all', 'gte', 'lte'].includes(item.op)).slice(0, 30); } catch { invalid = true; }
  if (attributes.length) state.attributes = JSON.stringify(attributes);
  return { state, invalid };
}
export function finderUrl(path, state) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(state)) if (value !== undefined && value !== '' && !(key === 'page' && String(value) === '1') && !(key === 'sort' && value === 'name')) params.set(key, String(value));
  return `${path}${params.size ? `?${params}` : ''}`;
}
