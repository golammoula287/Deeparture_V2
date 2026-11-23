import { allowIndexing, siteOrigin } from '@/src/lib/customer/siteSeo';

export default function Robots() { return null; }

export function getServerSideProps({ res }) {
  const rules = allowIndexing
    ? ['Disallow: /api/', 'Disallow: /admin', 'Disallow: /operator', 'Disallow: /dashboard',
      'Disallow: /login', 'Disallow: /claim-operator', 'Disallow: /team-invite',
      `Sitemap: ${siteOrigin}/sitemap.xml`]
    : ['Disallow: /'];
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(['User-agent: *', ...rules, ''].join('\n'));
  return { props: {} };
}
