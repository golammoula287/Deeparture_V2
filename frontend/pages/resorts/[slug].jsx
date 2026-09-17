import Head from "next/head";
import FeaturePills from "@/src/components/v2/FeaturePills";
import VeganRating from "@/src/components/v2/VeganRating";
import EnquiryForm from "@/src/components/v2/EnquiryForm";

const money = (amount, currency) => new Intl.NumberFormat("en", { style: "currency", currency: currency || "USD", maximumFractionDigits: 0 }).format(amount || 0);

export default function ResortPage({ resort }) {
  return (
    <>
      <Head><title>{resort.name} | Deeparture</title><meta name="description" content={resort.summary || resort.description || `${resort.name} dive resort`} /></Head>
      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-8 items-start">
          <div>
            {resort.featuredImage ? <img src={resort.featuredImage} alt={resort.name} className="w-full max-h-[560px] object-cover rounded-2xl" /> : null}
            <div className="mt-6 flex flex-wrap gap-3 items-center"><h1 className="text-4xl font-bold mr-auto">{resort.name}</h1><VeganRating value={resort.veganRating} /></div>
            {resort.organisation?.name ? <p className="mt-2 text-gray-600">Operated by {resort.organisation.name}</p> : null}
            {resort.summary ? <p className="mt-5 text-lg text-gray-700">{resort.summary}</p> : null}
            <FeaturePills title="Facilities" items={resort.facilities} />
            <FeaturePills title="Dietary support" items={resort.dietary} />
            <FeaturePills title="Accessibility" items={resort.accessibility} />
            <FeaturePills title="Diving" items={resort.divingFeatures} />
            {resort.description ? <section className="my-8"><h2 className="text-2xl font-semibold mb-3">About the resort</h2><p className="whitespace-pre-line text-gray-700 leading-7">{resort.description}</p></section> : null}
            <section className="my-8"><h2 className="text-2xl font-semibold mb-4">Packages</h2>
              {resort.packages?.length ? <div className="grid md:grid-cols-2 gap-4">{resort.packages.map((p) => <div key={p._id} className="rounded-xl border p-4"><h3 className="font-semibold text-lg">{p.name}</h3><p className="text-gray-600">{p.roomType?.name || ""}{p.numberOfNights ? ` · ${p.numberOfNights} nights` : ""}{p.numberOfDives ? ` · ${p.numberOfDives} dives` : ""}</p><p className="mt-2 font-semibold">From {money(p.basePrice?.amount, p.basePrice?.currency)}</p></div>)}</div> : <div className="rounded-xl border bg-gray-50 p-5">Current package pricing is on request.</div>}
            </section>
          </div>
          <aside className="lg:sticky lg:top-24"><EnquiryForm productType="resort" productId={resort._id} /></aside>
        </div>
      </main>
    </>
  );
}

export async function getServerSideProps({ params, res }) {
  const api = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const response = await fetch(`${api}/v2/resorts/${encodeURIComponent(params.slug)}`);
  if (response.status === 404) return { notFound: true };
  if (!response.ok) return { notFound: true };
  const json = await response.json();
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  return { props: { resort: json.data } };
}
