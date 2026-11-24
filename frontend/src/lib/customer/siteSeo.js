import { destinations } from './destinations';

export const searchPaths = ['/explore/liveaboards', '/explore/resorts', '/featured-trips', '/special-offers'];

export const sitemapPaths = [
  '/', ...searchPaths, '/destinations',
  ...destinations.map(({ slug }) => `/destinations/${slug}`),
  '/why-deeparture', '/about-us', '/contact',
];

function configuredOrigin(value) {
  try {
    const url = new URL(value);
    if (['http:', 'https:'].includes(url.protocol) && !url.username && !url.password) return url.origin;
  } catch {
    return null;
  }
  return null;
}

export const siteOrigin = configuredOrigin(process.env.NEXT_PUBLIC_SITE_URL);
export const allowIndexing = Boolean(siteOrigin && process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true');

export function canonicalPath(pathname, slug) {
  if (sitemapPaths.includes(pathname)) return pathname;
  if (['/destinations/[slug]', '/liveaboards/[slug]', '/resorts/[slug]'].includes(pathname)
    && typeof slug === 'string' && /^[a-z0-9-]+$/.test(slug)) return pathname.replace('[slug]', slug);
  return null;
}
