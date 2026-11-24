import ProductDetail from '@/src/components/customer/ProductDetail';
import { selectedPromotion } from '@/src/lib/customer/tripSelection';

export default function LiveaboardPage({ vessel, promotion = null, unavailable = false }) {
  if (unavailable) return <UnavailablePage />;
  return <ProductDetail product={vessel} type="vessel" promotion={promotion} />;
}
LiveaboardPage.customerPage = true;

import CustomerShell from '@/src/components/customer/CustomerShell';
function UnavailablePage() {
  return <CustomerShell noIndex title="Unable to load this liveaboard"><main className="max-w-3xl mx-auto px-6 py-20"><h1 className="text-3xl mb-4">This journey is temporarily unavailable</h1><p className="mb-6">We couldn’t load the latest trip information. Please try again shortly.</p><a href="" className="underline mr-6">Try again</a><a href="/explore/liveaboards" className="underline">Explore liveaboards</a></main></CustomerShell>;
}

export async function getServerSideProps({ params, query, res }) {
  const api = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  res.setHeader('Cache-Control', 'private, no-store');
  try {
    const response = await fetch(`${api}/v2/liveaboards/${encodeURIComponent(params.slug)}`, { signal: AbortSignal.timeout(8000) });
    if (response.status === 404) return { notFound: true };
    if (!response.ok) throw new Error('Unavailable');
    const json = await response.json();
    if (!json.success || !json.data) throw new Error('Unavailable');
    const promotion = await selectedPromotion(query, params.slug, "vessel");
    return { props: { vessel: json.data, promotion } };
  } catch {
    res.statusCode = 503;
    return { props: { vessel: null, unavailable: true } };
  }
}
