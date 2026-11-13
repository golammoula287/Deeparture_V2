import ProductDetail from '@/src/components/customer/ProductDetail';
import CustomerShell from '@/src/components/customer/CustomerShell';

export default function ResortPage({ resort, unavailable = false }) {
  if (unavailable) return <CustomerShell title="Unable to load this resort"><main className="max-w-3xl mx-auto px-6 py-20"><h1 className="text-3xl mb-4">This resort is temporarily unavailable</h1><p className="mb-6">We couldn’t load the latest resort information. Please try again shortly.</p><a href="" className="underline mr-6">Try again</a><a href="/explore/resorts" className="underline">Explore resorts</a></main></CustomerShell>;
  return <ProductDetail product={resort} type="resort" />;
}
ResortPage.customerPage = true;

export async function getServerSideProps({ params, res }) {
  const api = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  res.setHeader('Cache-Control', 'private, no-store');
  try {
    const response = await fetch(`${api}/v2/resorts/${encodeURIComponent(params.slug)}`, { signal: AbortSignal.timeout(8000) });
    if (response.status === 404) return { notFound: true };
    if (!response.ok) throw new Error('Unavailable');
    const json = await response.json();
    if (!json.success || !json.data) throw new Error('Unavailable');
    return { props: { resort: json.data } };
  } catch {
    res.statusCode = 503;
    return { props: { resort: null, unavailable: true } };
  }
}
