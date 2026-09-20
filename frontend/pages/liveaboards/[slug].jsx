import Head from "next/head";
import FeaturePills from "@/src/components/v2/FeaturePills";
import VeganRating from "@/src/components/v2/VeganRating";
import DepartureTable from "@/src/components/v2/DepartureTable";
import EnquiryForm from "@/src/components/v2/EnquiryForm";

export default function LiveaboardPage({ vessel }) {
  return (
    <>
      <Head><title>{vessel.name} | Deeparture</title><meta name="description" content={vessel.summary || vessel.description || `${vessel.name} liveaboard`} /></Head>
      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-8 items-start">
          <div className="min-w-0">
            {vessel.featuredImage ? <img src={vessel.featuredImage} alt={vessel.name} className="w-full max-h-[560px] object-cover rounded-2xl" /> : null}
            <div className="mt-6 flex flex-wrap gap-3 items-center"><h1 className="text-4xl font-bold mr-auto">{vessel.name}</h1><VeganRating value={vessel.veganRating} /></div>
            {vessel.organisation?.name ? <p className="mt-2 text-gray-600">Operated by {vessel.organisation.name}{vessel.organisation.status === "verified" ? " · Verified operator" : ""}</p> : null}
            {vessel.summary ? <p className="mt-5 text-lg text-gray-700">{vessel.summary}</p> : null}
            <FeaturePills title="Facilities" items={vessel.facilities} />
            <FeaturePills title="Diving" items={vessel.divingFeatures} />
            <FeaturePills title="Dietary support" items={vessel.dietary} />
            <FeaturePills title="Accessibility" items={vessel.accessibility} />
            {vessel.description ? <section className="my-8"><h2 className="text-2xl font-semibold mb-3">About {vessel.name}</h2><p className="whitespace-pre-line text-gray-700 leading-7">{vessel.description}</p></section> : null}
            <section className="my-8"><h2 className="text-2xl font-semibold mb-4">Upcoming departures</h2><DepartureTable departures={vessel.departures || []} /></section>
          </div>
          <aside className="min-w-0 lg:sticky lg:top-24"><EnquiryForm productType="vessel" productId={vessel._id} /></aside>
        </div>
      </main>
    </>
  );
}

export async function getServerSideProps({ params, res }) {
  const api = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const response = await fetch(`${api}/v2/liveaboards/${encodeURIComponent(params.slug)}`);
  if (response.status === 404) return { notFound: true };
  if (!response.ok) return { notFound: true };
  const json = await response.json();
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  return { props: { vessel: json.data } };
}
