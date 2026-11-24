import { catalogueRead } from '@/src/lib/customer/publicCatalogue';
import { allowIndexing, canonicalPath, siteOrigin, sitemapPaths } from '@/src/lib/customer/siteSeo';

const pageSize = 100;
const sitemapLimit = 50_000;

async function listingPaths(type) {
  const paths = [];
  let page = 1;
  let hasNext;
  do {
    const { data } = await catalogueRead(type, { page, limit: pageSize, sort: 'createdAt' });
    if (!data || typeof data.hasNext !== 'boolean') throw new Error('Catalogue unavailable');
    for (const item of data.items) {
      if (item.metadata?.synthetic) continue;
      const path = canonicalPath(`/${type}/[slug]`, item.slug);
      if (path) paths.push(path);
    }
    if (paths.length > sitemapLimit) throw new Error('Sitemap size limit exceeded');
    hasNext = data.hasNext;
    page += 1;
  } while (hasNext);
  return paths;
}

export default function Sitemap() { return null; }

export async function getServerSideProps({ res }) {
  if (!allowIndexing) return { notFound: true };
  try {
    const listings = await Promise.all(['liveaboards', 'resorts'].map(listingPaths));
    const paths = [...new Set([...sitemapPaths, ...listings.flat()])];
    if (paths.length > sitemapLimit) throw new Error('Sitemap size limit exceeded');
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300');
    res.end(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map(path => `  <url><loc>${siteOrigin}${path}</loc></url>`).join('\n')}\n</urlset>\n`);
  } catch {
    res.statusCode = 503;
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Sitemap temporarily unavailable');
  }
  return { props: {} };
}
