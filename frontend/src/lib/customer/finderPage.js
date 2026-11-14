import { catalogueRead, noStore } from './publicCatalogue';
import { searchState } from './searchState';
export async function finderProps({ query, res }, resort = false) {
  noStore(res);
  const { state, invalid } = searchState(query, resort);
  const [result, definitions] = await Promise.all([catalogueRead(resort ? 'resorts' : 'liveaboards', { ...state, limit: 12 }), catalogueRead('attributes', { productType: resort ? 'resort' : 'vessel' })]);
  return { props: { resort, state, invalid, data: result.data, error: result.error, definitions: Array.isArray(definitions.data) ? definitions.data : [], definitionsError: Boolean(definitions.error) } };
}
