import { catalogueRead, noStore } from './publicCatalogue';
import { searchState } from './searchState';

export const discoveryTypes = { vessel: 'Liveaboards', resort: 'Resorts' };

export function discoveryState(query = {}) {
  const type = typeof query.type === 'string' && Object.hasOwn(discoveryTypes, query.type) ? query.type : '';
  const { state, invalid } = searchState(query, type === 'resort');
  delete state.sort;
  if (!type) for (const key of ['startDate', 'endDate', 'minNights', 'maxNights', 'embarkation']) delete state[key];
  return { state: { ...state, type }, invalid };
}

export function discoveryUrl(path, state) {
  const params = new URLSearchParams(Object.entries(state).filter(([key, value]) =>
    value !== undefined && value !== '' && (key !== 'page' || String(value) !== '1')
  ));
  return `${path}${params.size ? `?${params}` : ''}`;
}

export async function discoveryProps({ res, query }, offers = false) {
  noStore(res);
  const { state, invalid } = discoveryState(query);
  const types = state.type ? [state.type] : Object.keys(discoveryTypes);
  const { type, ...filters } = state;
  const request = results => ({
    ...results,
    view: 'finder',
    limit: 6,
    ...(offers ? { activeOffer: true } : { featured: true }),
  });
  const fetchResults = criteria => Promise.all(types.map(async kind => ({
    kind,
    ...await catalogueRead(kind === 'vessel' ? 'liveaboards' : 'resorts', request(criteria)),
  })));
  const filtered = Object.entries(filters).some(([key, value]) => key !== 'page' && Boolean(value));
  const [results, attributes, ports, baseline] = await Promise.all([
    fetchResults(filters),
    catalogueRead('attributes'),
    catalogueRead('embarkation-ports'),
    offers && (filtered || type) ? Promise.all(Object.keys(discoveryTypes).map(kind =>
      catalogueRead(kind === 'vessel' ? 'liveaboards' : 'resorts', { activeOffer: true, limit: 1 })
    )) : null,
  ]);
  return { props: {
    offers, state, invalid, results,
    definitions: attributes.data || [],
    definitionsError: Boolean(attributes.error),
    ports: ports?.data || [],
    portsError: Boolean(ports?.error),
    catalogueHasOffers: baseline && baseline.every(result => !result.error)
      ? baseline.some(result => result.data.total > 0)
      : null,
  } };
}
