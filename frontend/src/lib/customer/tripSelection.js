import { catalogueRead, noStore } from './publicCatalogue';
import { productHref } from './format';

export function tripSelectionProps(kind) {
  return async ({ params, query, res }) => {
    noStore(res);
    const { id, slug } = params;
    const selection = await catalogueRead(`${kind}/${encodeURIComponent(id || slug)}`);
    if (selection.status === 404) return { notFound: true };
    if (!selection.data?.slug) {
      res.statusCode = 503;
      return { props: {} };
    }
    const { data } = selection;
    const destination = new URLSearchParams();
    if (data.departureId) destination.set('departure', data.departureId);
    if (data.packageId) destination.set('package', data.packageId);
    if (data.promotion?.offerId) destination.set('offer', data.promotion.offerId);
    if (typeof query.returnTo === 'string') destination.set('returnTo', query.returnTo);
    else if (kind === 'offers') destination.set('returnTo', '/special-offers');
    return { redirect: { destination: `${productHref(data, data.type)}?${destination}#trip-options`, permanent: false } };
  };
}

export async function selectedPromotion(query, slug, type) {
  if (typeof query.offer !== 'string' || !/^[a-f0-9]{24}$/i.test(query.offer)) return null;
  const { data } = await catalogueRead(`offers/${encodeURIComponent(query.offer)}`);
  if (data?.slug !== slug || data.type !== type) return null;
  const [selected, expected] = type === 'resort' ? [query.package, data.packageId] : [query.departure, data.departureId];
  return selected === expected ? data.promotion ?? null : null;
}
